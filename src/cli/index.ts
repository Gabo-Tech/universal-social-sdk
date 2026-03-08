#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { runInitCommand } from "./commands/init.js";
import { runUpdateCommand } from "./commands/update.js";

const program = new Command();

program
  .name("universal-social-sdk")
  .description("Universal social media SDK CLI")
  .version("1.1.0");

program
  .command("init")
  .description("Create .env.example and show OAuth setup links")
  .action(async () => {
    try {
      await runInitCommand(process.cwd());
    } catch (error) {
      console.error(chalk.red("Initialization failed."));
      console.error(error);
      process.exitCode = 1;
    }
  });

program
  .command("update")
  .description("Crawl docs + run local Ollama + patch SDK sources")
  .option("--dry-run", "Preview changes without writing files")
  .option("-y, --yes", "Apply changes without confirmation prompt")
  .option("--model <name>", "Override Ollama model for this run")
  .option("--ci", "Run in non-interactive CI mode")
  .option("--open-pr", "Prepare PR artifacts for workflow automation")
  .option(
    "--branch-prefix <prefix>",
    "Branch prefix for updater PR metadata",
    "chore/updater"
  )
  .option("--base <branch>", "Base branch for PR metadata", "main")
  .option(
    "--artifacts-dir <path>",
    "Directory for generated updater artifacts",
    ".artifacts"
  )
  .action(
    async (options: {
      dryRun?: boolean;
      yes?: boolean;
      model?: string;
      ci?: boolean;
      openPr?: boolean;
      branchPrefix?: string;
      base?: string;
      artifactsDir?: string;
    }) => {
    try {
      await runUpdateCommand(process.cwd(), {
        dryRun: options.dryRun,
        yes: options.yes,
        model: options.model,
        ci: options.ci,
        openPr: options.openPr,
        branchPrefix: options.branchPrefix,
        base: options.base,
        artifactsDir: options.artifactsDir
      });
    } catch (error) {
      console.error(chalk.red("Update failed."));
      console.error(error);
      process.exitCode = 1;
    }
    }
  );

program.parse(process.argv);
