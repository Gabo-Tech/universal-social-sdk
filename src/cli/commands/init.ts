import { access, copyFile, writeFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";

const ENV_TEMPLATE = `# X / Twitter
X_API_KEY=
X_API_SECRET=
X_ACCESS_TOKEN=
X_ACCESS_SECRET=
X_BEARER_TOKEN=
X_CLIENT_ID=
X_CLIENT_SECRET=

# Facebook Pages + Instagram Graph (Meta)
META_APP_ID=
META_APP_SECRET=
FB_PAGE_ACCESS_TOKEN=
FB_PAGE_ID=
IG_ACCESS_TOKEN=
IG_USER_ID=
META_GRAPH_VERSION=v21.0

# LinkedIn
LINKEDIN_ACCESS_TOKEN=
LINKEDIN_REFRESH_TOKEN=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_ORG_URN=
LINKEDIN_PERSON_URN=
LINKEDIN_API_VERSION=202510

# SDK behavior
SOCIAL_SDK_MAX_RETRIES=3
SOCIAL_SDK_RETRY_BASE_MS=500
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
`;

const OAUTH_LINKS = [
  {
    platform: "X (Twitter)",
    url: "https://developer.x.com/en/portal/dashboard"
  },
  {
    platform: "Meta (Facebook + Instagram Graph)",
    url: "https://developers.facebook.com/apps/"
  },
  {
    platform: "LinkedIn",
    url: "https://www.linkedin.com/developers/apps"
  }
];

async function exists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function runInitCommand(cwd: string): Promise<void> {
  const spinner = ora("Preparing universal-social-sdk project bootstrap...").start();
  const envExamplePath = path.join(cwd, ".env.example");
  const envPath = path.join(cwd, ".env");

  if (!(await exists(envExamplePath))) {
    await writeFile(envExamplePath, ENV_TEMPLATE, "utf8");
  }

  if (!(await exists(envPath))) {
    await copyFile(envExamplePath, envPath);
  }

  spinner.succeed("Environment files generated.");

  console.log(chalk.bold("\nOAuth setup links"));
  for (const link of OAUTH_LINKS) {
    console.log(`- ${chalk.cyan(link.platform)}: ${chalk.underline(link.url)}`);
  }

  console.log(chalk.bold("\nSetup hints (screenshots to capture while configuring):"));
  console.log("- X: app dashboard with OAuth 1.0a user tokens and callback URL.");
  console.log("- Meta: App Review permissions screen + Page token debug screen.");
  console.log("- LinkedIn: Products tab + OAuth 2.0 redirect URL + scopes list.");

  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "openLinks",
      message: "Open OAuth setup links manually in your browser now?",
      default: true
    }
  ]);

  if (answers.openLinks) {
    console.log(chalk.yellow("Open each URL above in your browser and fill `.env` values."));
  }

  console.log(chalk.green("\nInitialization complete."));
}
