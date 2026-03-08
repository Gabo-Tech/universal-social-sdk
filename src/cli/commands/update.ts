import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import { crawlAllDocs } from "../../updater/docCrawler.js";
import { askOllamaForPatchPlan } from "../../updater/ollama.js";
import { applyPlannedDiffs, planDiffs } from "../../updater/patcher.js";
import { spawn } from "node:child_process";

export interface UpdateCommandOptions {
  dryRun?: boolean;
  yes?: boolean;
  model?: string;
}

function runBuild(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "build"], {
      cwd,
      stdio: "inherit",
      shell: true
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Build failed with exit code ${code ?? -1}`));
      }
    });
  });
}

function applyReadmeTable(readmeContent: string, tableMarkdown: string): string {
  const startMarker = "<!-- AUTO_METHODS_TABLE_START -->";
  const endMarker = "<!-- AUTO_METHODS_TABLE_END -->";
  const hasMarkers =
    readmeContent.includes(startMarker) && readmeContent.includes(endMarker);

  if (!hasMarkers) {
    return readmeContent;
  }

  const replacement = `${startMarker}\n${tableMarkdown.trim()}\n${endMarker}`;
  return readmeContent.replace(
    new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, "m"),
    replacement
  );
}

export async function runUpdateCommand(
  cwd: string,
  options: UpdateCommandOptions = {}
): Promise<void> {
  const crawlSpinner = ora("Crawling official social API docs...").start();
  const docs = await crawlAllDocs();
  crawlSpinner.succeed(`Crawled ${docs.length} documentation pages.`);

  const methodsPath = path.join(cwd, "supported-methods.json");
  const methodsJson = await readFile(methodsPath, "utf8");

  const aiSpinner = ora("Asking local Ollama model for SDK update plan...").start();
  const plan = await askOllamaForPatchPlan({
    docs,
    existingMethodsJson: methodsJson,
    model: options.model
  });
  aiSpinner.succeed("Ollama returned an update plan.");

  const generatedFiles = [...plan.files];
  const readmePath = path.join(cwd, "README.md");
  const readmeContent = await readFile(readmePath, "utf8");
  const updatedReadme = applyReadmeTable(readmeContent, plan.readmeTable);
  if (updatedReadme !== readmeContent) {
    generatedFiles.push({
      path: "README.md",
      content: updatedReadme
    });
  }

  const diffs = await planDiffs({
    rootDir: cwd,
    files: generatedFiles
  });

  console.log(chalk.bold("\nProposed changes"));
  console.log(chalk.dim(plan.summary));
  for (const planned of diffs) {
    console.log(chalk.cyan(`\n--- ${planned.path} ---`));
    console.log(planned.diff.slice(0, 4000));
    if (planned.diff.length > 4000) {
      console.log(chalk.dim("... diff truncated in terminal preview ..."));
    }
  }

  const applyChanges = options.yes
    ? true
    : (
        await inquirer.prompt([
          {
            type: "confirm",
            name: "applyChanges",
            message: "Apply these changes and rebuild package?",
            default: false
          }
        ])
      ).applyChanges;

  if (!applyChanges) {
    console.log(chalk.yellow("Update cancelled. No files changed."));
    return;
  }

  if (options.dryRun) {
    console.log(chalk.yellow("Dry-run mode enabled. No files changed."));
    return;
  }

  const applySpinner = ora("Applying generated patches...").start();
  await applyPlannedDiffs({ plans: diffs });
  await writeFile(
    methodsPath,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        platforms: plan.updatedMethods
      },
      null,
      2
    ),
    "utf8"
  );
  applySpinner.succeed("Patch files applied.");

  const buildSpinner = ora("Rebuilding package...").start();
  await runBuild(cwd);
  buildSpinner.succeed("Package rebuilt successfully.");
}
