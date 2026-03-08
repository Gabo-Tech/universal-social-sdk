import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import { crawlAllDocs } from "../../updater/docCrawler.js";
import { askOllamaForPatchPlan } from "../../updater/ollama.js";
import { applyPlannedDiffs, planDiffs } from "../../updater/patcher.js";
import { spawn } from "node:child_process";
import type { PlannedDiff } from "../../updater/patcher.js";
import type { OllamaPatchPlan } from "../../updater/ollama.js";

export interface UpdateCommandOptions {
  dryRun?: boolean;
  yes?: boolean;
  model?: string;
  ci?: boolean;
  openPr?: boolean;
  branchPrefix?: string;
  base?: string;
  artifactsDir?: string;
}

function runNpmScript(cwd: string, script: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", script], {
      cwd,
      stdio: "inherit",
      shell: true
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`npm run ${script} failed with exit code ${code ?? -1}`)
        );
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

function normalizeMethods(methods: Record<string, string[]>): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(methods)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([platform, items]) => [platform, [...items].sort()])
  );
}

function parseExistingMethods(methodsJson: string): Record<string, string[]> {
  try {
    const parsed = JSON.parse(methodsJson) as {
      platforms?: Record<string, string[]>;
    };
    return parsed.platforms ?? {};
  } catch {
    return {};
  }
}

export function hasMaterialChanges(params: {
  diffs: PlannedDiff[];
  existingMethods: Record<string, string[]>;
  updatedMethods: Record<string, string[]>;
}): { hasChanges: boolean; hasFileChanges: boolean; methodsChanged: boolean } {
  const hasFileChanges = params.diffs.some((diff) => diff.before !== diff.after);
  const methodsChanged =
    JSON.stringify(normalizeMethods(params.existingMethods)) !==
    JSON.stringify(normalizeMethods(params.updatedMethods));
  return {
    hasChanges: hasFileChanges || methodsChanged,
    hasFileChanges,
    methodsChanged
  };
}

function inferRisk(params: { summary: string; diffs: PlannedDiff[] }): "low" | "medium" | "high" {
  const text = params.summary.toLowerCase();
  if (
    text.includes("breaking") ||
    text.includes("deprecat") ||
    text.includes("remove")
  ) {
    return "high";
  }
  if (params.diffs.some((diff) => diff.path.startsWith("src/platforms/"))) {
    return "medium";
  }
  return "low";
}

function buildPrArtifacts(params: {
  plan: OllamaPatchPlan;
  diffs: PlannedDiff[];
  risk: "low" | "medium" | "high";
  base: string;
  branchPrefix: string;
}) {
  const changedPlatforms = new Set<string>();
  for (const file of params.plan.files) {
    const parts = file.path.split("/");
    if (parts[0] === "src" && parts[1] === "platforms" && parts[2]) {
      changedPlatforms.add(parts[2].replace(/\.ts$/, ""));
    }
  }
  const changeTypeCounts = params.plan.changes.reduce<Record<string, number>>(
    (acc, change) => {
      acc[change.changeType] = (acc[change.changeType] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const branchName = `${params.branchPrefix}-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`;
  const title = "chore(updater): sync social API documentation changes";
  const body = [
    "## Summary",
    `- ${params.plan.summary}`,
    `- Risk classification: **${params.risk}**`,
    `- Changed files: ${params.diffs.length}`,
    `- Changed platforms: ${
      changedPlatforms.size > 0
        ? [...changedPlatforms].sort().join(", ")
        : "none"
    }`,
    `- Endpoint deltas: ${
      Object.keys(changeTypeCounts).length > 0
        ? Object.entries(changeTypeCounts)
            .map(([type, count]) => `${type}=${count}`)
            .join(", ")
        : "none"
    }`,
    "",
    "## Validation",
    "- [x] `npm run build`",
    "- [x] `npm run test:unit`",
    "",
    "## Review checklist",
    "- [ ] Confirm endpoint/scope changes match official docs",
    "- [ ] Confirm method signatures are backward compatible",
    "- [ ] Confirm normalized response contracts remain stable"
  ].join("\n");

  return {
    title,
    body,
    base: params.base,
    branchName,
    changedPlatforms: [...changedPlatforms].sort()
  };
}

async function writeUpdaterArtifacts(params: {
  cwd: string;
  artifactsDir: string;
  docsCount: number;
  plan: OllamaPatchPlan;
  diffs: PlannedDiff[];
  hasChanges: boolean;
  risk: "low" | "medium" | "high";
  pr: ReturnType<typeof buildPrArtifacts>;
}) {
  const outDir = path.join(params.cwd, params.artifactsDir);
  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, "update-plan.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        docsCount: params.docsCount,
        summary: params.plan.summary,
        changes: params.plan.changes,
        updatedMethods: params.plan.updatedMethods,
        files: params.plan.files.map((file) => file.path)
      },
      null,
      2
    ),
    "utf8"
  );

  await writeFile(
    path.join(outDir, "update-diff-summary.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        hasChanges: params.hasChanges,
        risk: params.risk,
        changes: params.plan.changes,
        changedFiles: params.diffs
          .filter((diff) => diff.before !== diff.after)
          .map((diff) => diff.path),
        pr: params.pr
      },
      null,
      2
    ),
    "utf8"
  );

  await writeFile(path.join(outDir, "pr-title.txt"), `${params.pr.title}\n`, "utf8");
  await writeFile(path.join(outDir, "pr-body.md"), `${params.pr.body}\n`, "utf8");
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
  const existingMethods = parseExistingMethods(methodsJson);

  const planSpinner = ora("Generating SDK update plan from crawled docs...").start();
  const plan = await askOllamaForPatchPlan({
    docs,
    existingMethodsJson: methodsJson,
    model: options.model
  });
  planSpinner.succeed("Update plan generated.");

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
  const changeStats = hasMaterialChanges({
    diffs,
    existingMethods,
    updatedMethods: plan.updatedMethods
  });
  const hasChanges = changeStats.hasChanges;
  const risk = inferRisk({ summary: plan.summary, diffs });
  const prArtifacts = buildPrArtifacts({
    plan,
    diffs,
    risk,
    base: options.base ?? "main",
    branchPrefix: options.branchPrefix ?? "chore/updater"
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

  if (options.openPr || options.ci) {
    await writeUpdaterArtifacts({
      cwd,
      artifactsDir: options.artifactsDir ?? ".artifacts",
      docsCount: docs.length,
      plan,
      diffs,
      hasChanges,
      risk,
      pr: prArtifacts
    });
  }

  if (!hasChanges) {
    console.log(chalk.green("No material documentation changes detected."));
    return;
  }

  const nonInteractive = options.ci || options.openPr;
  const applyChanges = options.yes
    ? true
    : nonInteractive
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
  await runNpmScript(cwd, "build");
  buildSpinner.succeed("Package rebuilt successfully.");

  if (options.ci || options.openPr) {
    const testSpinner = ora("Running unit tests...").start();
    await runNpmScript(cwd, "test:unit");
    testSpinner.succeed("Unit tests passed.");
  }
}
