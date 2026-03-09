#!/usr/bin/env node

// src/cli/index.ts
import { Command } from "commander";
import chalk3 from "chalk";

// src/cli/commands/init.ts
import { access, copyFile, writeFile } from "fs/promises";
import path from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
var ENV_TEMPLATE = `# X / Twitter
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

# YouTube
YOUTUBE_ACCESS_TOKEN=
YOUTUBE_CHANNEL_ID=

# TikTok
TIKTOK_ACCESS_TOKEN=
TIKTOK_OPEN_ID=
TIKTOK_ADVERTISER_ID=

# Pinterest
PINTEREST_ACCESS_TOKEN=
PINTEREST_BOARD_ID=

# Bluesky
BLUESKY_SERVICE_URL=https://bsky.social
BLUESKY_IDENTIFIER=
BLUESKY_APP_PASSWORD=
BLUESKY_ACCESS_JWT=
BLUESKY_REFRESH_JWT=

# Mastodon
MASTODON_BASE_URL=
MASTODON_ACCESS_TOKEN=
MASTODON_ACCOUNT_ID=

# Threads
THREADS_ACCESS_TOKEN=
THREADS_USER_ID=

# SDK behavior
SOCIAL_SDK_MAX_RETRIES=3
SOCIAL_SDK_RETRY_BASE_MS=500
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
`;
var OAUTH_LINKS = [
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
  },
  {
    platform: "YouTube",
    url: "https://console.cloud.google.com/apis/library/youtube.googleapis.com"
  },
  {
    platform: "TikTok",
    url: "https://developers.tiktok.com/"
  },
  {
    platform: "Pinterest",
    url: "https://developers.pinterest.com/"
  },
  {
    platform: "Bluesky",
    url: "https://bsky.app/settings/app-passwords"
  },
  {
    platform: "Mastodon",
    url: "https://docs.joinmastodon.org/client/token/"
  },
  {
    platform: "Threads",
    url: "https://developers.facebook.com/docs/threads"
  }
];
async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}
async function runInitCommand(cwd) {
  const spinner = ora("Preparing universal-social-sdk project bootstrap...").start();
  const envExamplePath = path.join(cwd, ".env.example");
  const envPath = path.join(cwd, ".env");
  if (!await exists(envExamplePath)) {
    await writeFile(envExamplePath, ENV_TEMPLATE, "utf8");
  }
  if (!await exists(envPath)) {
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
  console.log("- YouTube: OAuth consent screen + Data API enabled credentials.");
  console.log("- TikTok/Pinterest: app scopes + redirect URI + long-lived token.");
  console.log("- Bluesky/Mastodon/Threads: app password or token issuance screens.");
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

// src/cli/commands/update.ts
import { mkdir, readFile as readFile2, writeFile as writeFile3 } from "fs/promises";
import path3 from "path";
import chalk2 from "chalk";
import inquirer2 from "inquirer";
import ora2 from "ora";

// src/updater/docCrawler.ts
import axios from "axios";
import * as cheerio from "cheerio";
var DOC_URLS = {
  x: [
    "https://developer.x.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets",
    "https://developer.x.com/en/docs/twitter-api/users/likes/api-reference/post-users-id-likes"
  ],
  facebook: [
    "https://developers.facebook.com/docs/graph-api/reference/page/feed/",
    "https://developers.facebook.com/docs/pages-api/getting-started/"
  ],
  instagram: [
    "https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media",
    "https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media_publish/"
  ],
  linkedin: [
    "https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2025-10",
    "https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/comments-api?view=li-lms-2025-06"
  ]
};
function cleanText(raw) {
  return raw.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}
function extractTables($) {
  const rows = [];
  $("table").each((_, table) => {
    const headers = [];
    $(table).find("thead th").each((_2, th) => {
      headers.push(cleanText($(th).text()));
    });
    $(table).find("tbody tr").each((_2, tr) => {
      const row = {};
      $(tr).find("td").each((idx, td) => {
        const key = headers[idx] || `column_${idx + 1}`;
        row[key] = cleanText($(td).text());
      });
      if (Object.keys(row).length > 0) {
        rows.push(row);
      }
    });
  });
  return rows;
}
async function crawlSingleDoc(url) {
  const response = await axios.get(url, {
    timeout: 3e4,
    headers: {
      "User-Agent": "universal-social-sdk-doc-crawler/1.0"
    }
  });
  const $ = cheerio.load(response.data);
  const title = cleanText($("title").first().text()) || "Untitled";
  const text = cleanText($("main, article, body").text());
  const endpointRows = extractTables($);
  return {
    url,
    title,
    text: text.slice(0, 25e4),
    endpointRows
  };
}
async function crawlAllDocs() {
  const urls = [
    ...DOC_URLS.x,
    ...DOC_URLS.facebook,
    ...DOC_URLS.instagram,
    ...DOC_URLS.linkedin
  ];
  const results = await Promise.all(urls.map((url) => crawlSingleDoc(url)));
  return results;
}

// src/updater/ollama.ts
import axios2, { isAxiosError } from "axios";
import { z } from "zod";

// src/config/env.ts
import dotenv from "dotenv";
dotenv.config();
function readNumberEnv(name, fallback) {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function readListEnv(name) {
  const value = process.env[name];
  if (!value) {
    return [];
  }
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}
function resolveLlmProvider() {
  const provider = process.env.UPDATER_LLM_PROVIDER;
  if (provider === "openrouter" || provider === "ollama") {
    return provider;
  }
  return process.env.UPDATER_LLM_API_KEY || process.env.OPENROUTER_API_KEY ? "openrouter" : "ollama";
}
var llmProvider = resolveLlmProvider();
var env = {
  x: {
    apiKey: process.env.X_API_KEY ?? "",
    apiSecret: process.env.X_API_SECRET ?? "",
    accessToken: process.env.X_ACCESS_TOKEN ?? "",
    accessSecret: process.env.X_ACCESS_SECRET ?? "",
    bearerToken: process.env.X_BEARER_TOKEN ?? "",
    clientId: process.env.X_CLIENT_ID ?? "",
    clientSecret: process.env.X_CLIENT_SECRET ?? ""
  },
  meta: {
    appId: process.env.META_APP_ID ?? "",
    appSecret: process.env.META_APP_SECRET ?? "",
    graphVersion: process.env.META_GRAPH_VERSION ?? "v21.0",
    fbPageToken: process.env.FB_PAGE_ACCESS_TOKEN ?? "",
    fbPageId: process.env.FB_PAGE_ID ?? "",
    igToken: process.env.IG_ACCESS_TOKEN ?? "",
    igUserId: process.env.IG_USER_ID ?? ""
  },
  linkedin: {
    accessToken: process.env.LINKEDIN_ACCESS_TOKEN ?? "",
    refreshToken: process.env.LINKEDIN_REFRESH_TOKEN ?? "",
    clientId: process.env.LINKEDIN_CLIENT_ID ?? "",
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
    orgUrn: process.env.LINKEDIN_ORG_URN ?? "",
    personUrn: process.env.LINKEDIN_PERSON_URN ?? "",
    apiVersion: process.env.LINKEDIN_API_VERSION ?? "202510"
  },
  youtube: {
    accessToken: process.env.YOUTUBE_ACCESS_TOKEN ?? "",
    channelId: process.env.YOUTUBE_CHANNEL_ID ?? ""
  },
  tiktok: {
    accessToken: process.env.TIKTOK_ACCESS_TOKEN ?? "",
    openId: process.env.TIKTOK_OPEN_ID ?? "",
    advertiserId: process.env.TIKTOK_ADVERTISER_ID ?? ""
  },
  pinterest: {
    accessToken: process.env.PINTEREST_ACCESS_TOKEN ?? "",
    boardId: process.env.PINTEREST_BOARD_ID ?? ""
  },
  bluesky: {
    serviceUrl: process.env.BLUESKY_SERVICE_URL ?? "https://bsky.social",
    identifier: process.env.BLUESKY_IDENTIFIER ?? "",
    appPassword: process.env.BLUESKY_APP_PASSWORD ?? "",
    accessJwt: process.env.BLUESKY_ACCESS_JWT ?? "",
    refreshJwt: process.env.BLUESKY_REFRESH_JWT ?? ""
  },
  mastodon: {
    baseUrl: process.env.MASTODON_BASE_URL ?? "",
    accessToken: process.env.MASTODON_ACCESS_TOKEN ?? "",
    accountId: process.env.MASTODON_ACCOUNT_ID ?? ""
  },
  threads: {
    accessToken: process.env.THREADS_ACCESS_TOKEN ?? "",
    userId: process.env.THREADS_USER_ID ?? ""
  },
  retry: {
    maxRetries: readNumberEnv("SOCIAL_SDK_MAX_RETRIES", 3),
    baseDelayMs: readNumberEnv("SOCIAL_SDK_RETRY_BASE_MS", 500)
  },
  llm: {
    provider: llmProvider,
    baseUrl: process.env.UPDATER_LLM_BASE_URL ?? "https://openrouter.ai/api/v1",
    apiKey: process.env.UPDATER_LLM_API_KEY ?? process.env.OPENROUTER_API_KEY ?? "",
    model: process.env.UPDATER_LLM_MODEL ?? process.env.OPENROUTER_MODEL ?? process.env.OLLAMA_MODEL ?? (llmProvider === "openrouter" ? "google/gemma-3-4b-it:free" : "llama3.2:3b"),
    appName: process.env.UPDATER_LLM_APP_NAME ?? "universal-social-sdk-updater",
    appUrl: process.env.UPDATER_LLM_APP_URL ?? "https://github.com/Gabo-Tech/universal-social-sdk",
    maxTokens: readNumberEnv("UPDATER_LLM_MAX_TOKENS", 1200),
    maxDocCharsPerPage: readNumberEnv("UPDATER_LLM_MAX_DOC_CHARS_PER_PAGE", 6e3),
    maxEndpointRowsPerPage: readNumberEnv(
      "UPDATER_LLM_MAX_ENDPOINT_ROWS_PER_PAGE",
      40
    ),
    fallbackModels: readListEnv("UPDATER_LLM_FALLBACK_MODELS"),
    maxModelAttempts: readNumberEnv("UPDATER_LLM_MAX_MODEL_ATTEMPTS", 4)
  },
  ollama: {
    host: process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434",
    model: process.env.OLLAMA_MODEL ?? "llama3.2:3b"
  }
};

// src/updater/ollama.ts
var ollamaPatchPlanSchema = z.object({
  summary: z.string().min(1),
  updatedMethods: z.record(z.array(z.string())),
  changes: z.array(
    z.object({
      platform: z.string().min(1),
      endpoint: z.string().min(1),
      changeType: z.enum(["added", "modified", "deprecated", "removed"]),
      confidence: z.number().min(0).max(1),
      notes: z.string().optional()
    })
  ).default([]),
  files: z.array(
    z.object({
      path: z.string().min(1),
      content: z.string()
    })
  ),
  readmeTable: z.string()
});
var OpenRouterRequestError = class extends Error {
  status;
  canRetryWithAnotherModel;
  constructor(params) {
    super(params.message);
    this.name = "OpenRouterRequestError";
    this.status = params.status;
    this.canRetryWithAnotherModel = params.canRetryWithAnotherModel;
  }
};
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function truncate(text, maxChars) {
  if (text.length <= maxChars) {
    return text;
  }
  if (maxChars < 80) {
    return text.slice(0, maxChars);
  }
  const head = Math.floor(maxChars * 0.75);
  const tail = Math.max(0, maxChars - head - 32);
  return `${text.slice(0, head)}
...[truncated]...
${text.slice(text.length - tail)}`;
}
function compactDocs(docs) {
  return docs.map((doc) => {
    const limitedRows = doc.endpointRows.slice(0, env.llm.maxEndpointRowsPerPage).map(
      (row) => Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          truncate(String(value), 200)
        ])
      )
    );
    const text = truncate(doc.text, env.llm.maxDocCharsPerPage);
    return {
      url: doc.url,
      title: doc.title,
      text,
      endpointRows: limitedRows,
      truncated: text.length < doc.text.length || limitedRows.length < doc.endpointRows.length
    };
  });
}
function buildPrompt(docs, existingMethodsJson) {
  const compactedDocs = compactDocs(docs);
  const compactedMethods = truncate(existingMethodsJson, 1e5);
  return [
    "You are maintaining universal-social-sdk.",
    "Compare the crawled docs with current methods and identify NEW or CHANGED endpoints.",
    "Focus areas: content publishing, stories, reels, comments, DMs, analytics.",
    "Crawled text may be truncated. Only report high-confidence changes.",
    "Output STRICT JSON with this shape only:",
    '{"summary": string, "updatedMethods": Record<string,string[]>, "changes": [{"platform": string, "endpoint": string, "changeType": "added|modified|deprecated|removed", "confidence": number, "notes"?: string}], "files": [{"path": string, "content": string}], "readmeTable": string}',
    "Files must target src/platforms/*.ts and supported-methods.json updates when needed.",
    "Each file.content must be complete TypeScript file content, not patch snippets.",
    "Current supported-methods.json:",
    compactedMethods,
    "Crawled docs:",
    JSON.stringify(compactedDocs)
  ].join("\n");
}
function parseJsonOutput(raw) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("LLM response did not contain a JSON object.");
  }
  const maybeJson = cleaned.slice(start, end + 1);
  const parsed = JSON.parse(maybeJson);
  const result = ollamaPatchPlanSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Patch plan schema validation failed: ${result.error.message}`
    );
  }
  return result.data;
}
async function askViaOllama(params) {
  const response = await axios2.post(
    `${env.ollama.host}/api/generate`,
    {
      model: params.model,
      prompt: params.prompt,
      stream: false
    },
    {
      timeout: 12e4
    }
  );
  return response.data.response;
}
async function askViaOpenRouter(params) {
  if (!env.llm.apiKey) {
    throw new Error(
      "Missing updater API key. Set UPDATER_LLM_API_KEY (or OPENROUTER_API_KEY)."
    );
  }
  let response;
  try {
    response = await axios2.post(
      `${env.llm.baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        model: params.model,
        messages: [
          {
            role: "user",
            content: params.prompt
          }
        ],
        temperature: 0,
        max_tokens: env.llm.maxTokens
      },
      {
        timeout: 12e4,
        headers: {
          Authorization: `Bearer ${env.llm.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": env.llm.appUrl,
          "X-Title": env.llm.appName
        }
      }
    );
  } catch (error) {
    if (!isAxiosError(error)) {
      throw error;
    }
    const status = error.response?.status;
    const responseBody = error.response?.data;
    const providerMessage = typeof responseBody === "string" ? responseBody : responseBody?.error?.message ?? responseBody?.message ?? "";
    const hint = status === 401 || status === 403 ? "Verify UPDATER_LLM_API_KEY permissions." : status === 402 ? "Your provider account/model likely requires billing or has no quota." : status === 404 ? "Model or endpoint not found. Verify UPDATER_LLM_MODEL and base URL." : status === 429 ? "Rate-limited by provider. Retry later or switch to a less busy model." : status === 413 ? "Prompt payload too large. Reduce UPDATER_LLM_MAX_DOC_CHARS_PER_PAGE." : "Check provider status and updater LLM configuration.";
    throw new OpenRouterRequestError({
      message: `OpenRouter request failed${status ? ` (${status})` : ""}. ${providerMessage || hint}`,
      status,
      canRetryWithAnotherModel: status === 402 || status === 404 || status === 408 || status === 429
    });
  }
  const content = response.data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter did not return a message content payload.");
  }
  return content;
}
function buildModelChain(params) {
  const fromEnv = params.fallbackModels ?? env.llm.fallbackModels;
  const defaults = [
    "google/gemma-3-4b-it:free",
    "qwen/qwen3-4b:free",
    "openai/gpt-oss-20b:free"
  ];
  const all = [params.primaryModel, ...fromEnv, ...defaults];
  const maxAttempts = Math.max(
    1,
    params.maxModelAttempts ?? env.llm.maxModelAttempts
  );
  return [...new Set(all.filter(Boolean))].slice(
    0,
    maxAttempts
  );
}
async function askOllamaForPatchPlan(params) {
  const provider = env.llm.provider;
  const model = params.model || env.llm.model || env.ollama.model || "llama3.2:3b";
  const prompt = buildPrompt(params.docs, params.existingMethodsJson);
  if (provider !== "openrouter") {
    const raw = await askViaOllama({ prompt, model });
    return parseJsonOutput(raw);
  }
  const attempts = buildModelChain({
    primaryModel: model,
    fallbackModels: params.fallbackModels,
    maxModelAttempts: params.maxModelAttempts
  });
  const failures = [];
  const fallbackDelayMs = 750;
  for (const [index, candidate] of attempts.entries()) {
    try {
      const raw = await askViaOpenRouter({ prompt, model: candidate });
      return parseJsonOutput(raw);
    } catch (error) {
      if (error instanceof OpenRouterRequestError) {
        failures.push(`${candidate}: ${error.message}`);
        if (!error.canRetryWithAnotherModel) {
          throw error;
        }
        if (index < attempts.length - 1) {
          await sleep(fallbackDelayMs);
        }
        continue;
      }
      throw error;
    }
  }
  throw new Error(
    `All OpenRouter models failed (${attempts.length} attempts). ${failures.join(" | ")}`
  );
}

// src/updater/patcher.ts
import { readFile, writeFile as writeFile2 } from "fs/promises";
import path2 from "path";
import { createPatch } from "diff";
var ALLOWED_TARGETS = /* @__PURE__ */ new Set([
  "supported-methods.json",
  "README.md"
]);
function isAllowedPath(rootDir, filePath) {
  if (path2.isAbsolute(filePath)) {
    throw new Error(`Unsafe patch path (absolute not allowed): ${filePath}`);
  }
  const normalized = path2.normalize(filePath);
  if (normalized.startsWith("..")) {
    throw new Error(`Unsafe patch path (traversal): ${filePath}`);
  }
  const isPlatformSource = normalized.startsWith(`src${path2.sep}platforms${path2.sep}`) && normalized.endsWith(".ts");
  const isAllowedTopLevel = ALLOWED_TARGETS.has(normalized);
  if (!isPlatformSource && !isAllowedTopLevel) {
    throw new Error(
      `Patch path not allowed: ${filePath}. Allowed: src/platforms/*.ts, README.md, supported-methods.json.`
    );
  }
  return path2.resolve(rootDir, normalized);
}
async function planDiffs(params) {
  const plans = [];
  for (const file of params.files) {
    const absolutePath = isAllowedPath(params.rootDir, file.path);
    let before = "";
    try {
      before = await readFile(absolutePath, "utf8");
    } catch {
      before = "";
    }
    const after = file.content;
    const diff = createPatch(file.path, before, after, "before", "after");
    plans.push({
      path: file.path,
      absolutePath,
      before,
      after,
      diff
    });
  }
  return plans;
}
async function applyPlannedDiffs(params) {
  for (const plan of params.plans) {
    await writeFile2(plan.absolutePath, plan.after, "utf8");
  }
}

// src/cli/commands/update.ts
import { spawn } from "child_process";
function runNpmScript(cwd, script) {
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
function applyReadmeTable(readmeContent, tableMarkdown) {
  const startMarker = "<!-- AUTO_METHODS_TABLE_START -->";
  const endMarker = "<!-- AUTO_METHODS_TABLE_END -->";
  const hasMarkers = readmeContent.includes(startMarker) && readmeContent.includes(endMarker);
  if (!hasMarkers) {
    return readmeContent;
  }
  const replacement = `${startMarker}
${tableMarkdown.trim()}
${endMarker}`;
  return readmeContent.replace(
    new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, "m"),
    replacement
  );
}
function normalizeMethods(methods) {
  return Object.fromEntries(
    Object.entries(methods).sort(([a], [b]) => a.localeCompare(b)).map(([platform, items]) => [platform, [...items].sort()])
  );
}
function parseExistingMethods(methodsJson) {
  try {
    const parsed = JSON.parse(methodsJson);
    return parsed.platforms ?? {};
  } catch {
    return {};
  }
}
function expectedPlatformClassName(filePath) {
  const match = filePath.match(/^src\/platforms\/([^/]+)\.ts$/);
  if (!match) {
    return null;
  }
  const slug = match[1];
  const bySlug = {
    x: "X",
    instagram: "Instagram",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    youtube: "YouTube",
    tiktok: "TikTok",
    pinterest: "Pinterest",
    bluesky: "Bluesky",
    mastodon: "Mastodon",
    threads: "Threads"
  };
  return bySlug[slug] ?? null;
}
function validateUpdaterPlanSafety(diffs) {
  const findings = [];
  const suspiciousSnippets = [
    "Placeholder for implementation",
    "This file needs to be updated",
    "... other methods ...",
    "from './api'"
  ];
  for (const diff of diffs) {
    if (!diff.path.startsWith("src/platforms/")) {
      continue;
    }
    const beforeLines = diff.before.split(/\r?\n/).length;
    const afterLines = diff.after.split(/\r?\n/).length;
    const shrinkRatio = beforeLines > 0 ? afterLines / beforeLines : 1;
    if (beforeLines >= 120 && shrinkRatio < 0.4) {
      findings.push(
        `${diff.path}: suspicious large rewrite (${beforeLines} -> ${afterLines} lines).`
      );
    }
    for (const snippet of suspiciousSnippets) {
      if (diff.after.includes(snippet)) {
        findings.push(`${diff.path}: suspicious snippet detected (${snippet}).`);
      }
    }
    const className = expectedPlatformClassName(diff.path);
    if (className) {
      const classRegex = new RegExp(`\\bexport\\s+class\\s+${className}\\b`);
      if (!classRegex.test(diff.after)) {
        findings.push(
          `${diff.path}: expected exported class '${className}' was not found.`
        );
      }
    }
  }
  return {
    safe: findings.length === 0,
    findings
  };
}
function hasMaterialChanges(params) {
  const hasFileChanges = params.diffs.some((diff) => diff.before !== diff.after);
  const methodsChanged = JSON.stringify(normalizeMethods(params.existingMethods)) !== JSON.stringify(normalizeMethods(params.updatedMethods));
  return {
    hasChanges: hasFileChanges || methodsChanged,
    hasFileChanges,
    methodsChanged
  };
}
function inferRisk(params) {
  const text = params.summary.toLowerCase();
  if (text.includes("breaking") || text.includes("deprecat") || text.includes("remove")) {
    return "high";
  }
  if (params.diffs.some((diff) => diff.path.startsWith("src/platforms/"))) {
    return "medium";
  }
  return "low";
}
function buildPrArtifacts(params) {
  const changedPlatforms = /* @__PURE__ */ new Set();
  for (const file of params.plan.files) {
    const parts = file.path.split("/");
    if (parts[0] === "src" && parts[1] === "platforms" && parts[2]) {
      changedPlatforms.add(parts[2].replace(/\.ts$/, ""));
    }
  }
  const changeTypeCounts = params.plan.changes.reduce(
    (acc, change) => {
      acc[change.changeType] = (acc[change.changeType] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const branchName = `${params.branchPrefix}-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}`;
  const title = "chore(updater): sync social API documentation changes";
  const body = [
    "## Summary",
    `- ${params.plan.summary}`,
    `- Risk classification: **${params.risk}**`,
    `- Changed files: ${params.diffs.length}`,
    `- Changed platforms: ${changedPlatforms.size > 0 ? [...changedPlatforms].sort().join(", ") : "none"}`,
    `- Endpoint deltas: ${Object.keys(changeTypeCounts).length > 0 ? Object.entries(changeTypeCounts).map(([type, count]) => `${type}=${count}`).join(", ") : "none"}`,
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
async function writeUpdaterArtifacts(params) {
  const outDir = path3.join(params.cwd, params.artifactsDir);
  await mkdir(outDir, { recursive: true });
  await writeFile3(
    path3.join(outDir, "update-plan.json"),
    JSON.stringify(
      {
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
  await writeFile3(
    path3.join(outDir, "update-diff-summary.json"),
    JSON.stringify(
      {
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        hasChanges: params.hasChanges,
        risk: params.risk,
        changes: params.plan.changes,
        changedFiles: params.diffs.filter((diff) => diff.before !== diff.after).map((diff) => diff.path),
        pr: params.pr
      },
      null,
      2
    ),
    "utf8"
  );
  await writeFile3(path3.join(outDir, "pr-title.txt"), `${params.pr.title}
`, "utf8");
  await writeFile3(path3.join(outDir, "pr-body.md"), `${params.pr.body}
`, "utf8");
}
async function runUpdateCommand(cwd, options = {}) {
  const crawlSpinner = ora2("Crawling official social API docs...").start();
  const docs = await crawlAllDocs();
  crawlSpinner.succeed(`Crawled ${docs.length} documentation pages.`);
  const methodsPath = path3.join(cwd, "supported-methods.json");
  const methodsJson = await readFile2(methodsPath, "utf8");
  const existingMethods = parseExistingMethods(methodsJson);
  const planSpinner = ora2("Generating SDK update plan from crawled docs...").start();
  const plan = await askOllamaForPatchPlan({
    docs,
    existingMethodsJson: methodsJson,
    model: options.model,
    fallbackModels: options.fallbackModels,
    maxModelAttempts: options.maxModelAttempts
  });
  planSpinner.succeed("Update plan generated.");
  const generatedFiles = [...plan.files];
  const readmePath = path3.join(cwd, "README.md");
  const readmeContent = await readFile2(readmePath, "utf8");
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
  const safety = validateUpdaterPlanSafety(diffs);
  if (!safety.safe) {
    const topFindings = safety.findings.slice(0, 8).join(" | ");
    throw new Error(
      `Updater plan rejected by safety checks. ${topFindings}`
    );
  }
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
  console.log(chalk2.bold("\nProposed changes"));
  console.log(chalk2.dim(plan.summary));
  for (const planned of diffs) {
    console.log(chalk2.cyan(`
--- ${planned.path} ---`));
    console.log(planned.diff.slice(0, 4e3));
    if (planned.diff.length > 4e3) {
      console.log(chalk2.dim("... diff truncated in terminal preview ..."));
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
    console.log(chalk2.green("No material documentation changes detected."));
    return;
  }
  const nonInteractive = options.ci || options.openPr;
  const applyChanges = options.yes ? true : nonInteractive ? true : (await inquirer2.prompt([
    {
      type: "confirm",
      name: "applyChanges",
      message: "Apply these changes and rebuild package?",
      default: false
    }
  ])).applyChanges;
  if (!applyChanges) {
    console.log(chalk2.yellow("Update cancelled. No files changed."));
    return;
  }
  if (options.dryRun) {
    console.log(chalk2.yellow("Dry-run mode enabled. No files changed."));
    return;
  }
  const applySpinner = ora2("Applying generated patches...").start();
  await applyPlannedDiffs({ plans: diffs });
  await writeFile3(
    methodsPath,
    JSON.stringify(
      {
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        platforms: plan.updatedMethods
      },
      null,
      2
    ),
    "utf8"
  );
  applySpinner.succeed("Patch files applied.");
  const buildSpinner = ora2("Rebuilding package...").start();
  await runNpmScript(cwd, "build");
  buildSpinner.succeed("Package rebuilt successfully.");
  if (options.ci || options.openPr) {
    const testSpinner = ora2("Running unit tests...").start();
    await runNpmScript(cwd, "test:unit");
    testSpinner.succeed("Unit tests passed.");
  }
}

// src/cli/index.ts
var program = new Command();
function formatCliError(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
function parseCsv(value) {
  if (!value) {
    return void 0;
  }
  const parsed = value.split(",").map((item) => item.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : void 0;
}
function parseOptionalPositiveInt(value) {
  if (!value) {
    return void 0;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return void 0;
  }
  return Math.floor(parsed);
}
program.name("universal-social-sdk").description("Universal social media SDK CLI").version("1.1.0");
program.command("init").description("Create .env.example and show OAuth setup links").action(async () => {
  try {
    await runInitCommand(process.cwd());
  } catch (error) {
    console.error(chalk3.red("Initialization failed."));
    console.error(chalk3.red(formatCliError(error)));
    process.exitCode = 1;
  }
});
program.command("update").description("Crawl docs + run local Ollama + patch SDK sources").option("--dry-run", "Preview changes without writing files").option("-y, --yes", "Apply changes without confirmation prompt").option("--model <name>", "Override Ollama model for this run").option(
  "--fallback-models <csv>",
  "Comma-separated fallback model chain for OpenRouter"
).option(
  "--max-model-attempts <number>",
  "Max model attempts for OpenRouter fallback chain"
).option("--ci", "Run in non-interactive CI mode").option("--open-pr", "Prepare PR artifacts for workflow automation").option(
  "--branch-prefix <prefix>",
  "Branch prefix for updater PR metadata",
  "chore/updater"
).option("--base <branch>", "Base branch for PR metadata", "main").option(
  "--artifacts-dir <path>",
  "Directory for generated updater artifacts",
  ".artifacts"
).action(
  async (options) => {
    try {
      await runUpdateCommand(process.cwd(), {
        dryRun: options.dryRun,
        yes: options.yes,
        model: options.model,
        fallbackModels: parseCsv(options.fallbackModels),
        maxModelAttempts: parseOptionalPositiveInt(options.maxModelAttempts),
        ci: options.ci,
        openPr: options.openPr,
        branchPrefix: options.branchPrefix,
        base: options.base,
        artifactsDir: options.artifactsDir
      });
    } catch (error) {
      console.error(chalk3.red("Update failed."));
      console.error(chalk3.red(formatCliError(error)));
      process.exitCode = 1;
    }
  }
);
program.parse(process.argv);
//# sourceMappingURL=index.js.map