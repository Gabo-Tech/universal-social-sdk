#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { runInitCommand } from "./commands/init.js";
import { runUpdateCommand } from "./commands/update.js";

const program = new Command();

program
  .name("universal-social-sdk")
  .description("Universal social media SDK CLI")
  .version("1.0.0");

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
  .action(async (options: { dryRun?: boolean; yes?: boolean; model?: string }) => {
    try {
      await runUpdateCommand(process.cwd(), {
        dryRun: options.dryRun,
        yes: options.yes,
        model: options.model
      });
    } catch (error) {
      console.error(chalk.red("Update failed."));
      console.error(error);
      process.exitCode = 1;
    }
  });

program.parse(process.argv);
