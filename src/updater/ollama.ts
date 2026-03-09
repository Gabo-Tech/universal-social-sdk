import axios, { isAxiosError } from "axios";
import { z } from "zod";
import { env } from "../config/env.js";
import type { CrawledDoc } from "./docCrawler.js";

export interface OllamaPatchFile {
  path: string;
  content: string;
}

export interface OllamaPatchPlan {
  summary: string;
  updatedMethods: Record<string, string[]>;
  changes: Array<{
    platform: string;
    endpoint: string;
    changeType: "added" | "modified" | "deprecated" | "removed";
    confidence: number;
    notes?: string;
  }>;
  files: OllamaPatchFile[];
  readmeTable: string;
}

const ollamaPatchPlanSchema: z.ZodType<OllamaPatchPlan> = z.object({
  summary: z.string().min(1),
  updatedMethods: z.record(z.array(z.string())),
  changes: z
    .array(
      z.object({
        platform: z.string().min(1),
        endpoint: z.string().min(1),
        changeType: z.enum(["added", "modified", "deprecated", "removed"]),
        confidence: z.number().min(0).max(1),
        notes: z.string().optional()
      })
    )
    .default([]),
  files: z.array(
    z.object({
      path: z.string().min(1),
      content: z.string()
    })
  ),
  readmeTable: z.string()
});

class OpenRouterRequestError extends Error {
  status?: number;
  canRetryWithAnotherModel: boolean;

  constructor(params: {
    message: string;
    status?: number;
    canRetryWithAnotherModel: boolean;
  }) {
    super(params.message);
    this.name = "OpenRouterRequestError";
    this.status = params.status;
    this.canRetryWithAnotherModel = params.canRetryWithAnotherModel;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  if (maxChars < 80) {
    return text.slice(0, maxChars);
  }
  const head = Math.floor(maxChars * 0.75);
  const tail = Math.max(0, maxChars - head - 32);
  return `${text.slice(0, head)}\n...[truncated]...\n${text.slice(text.length - tail)}`;
}

function compactDocs(docs: CrawledDoc[]): Array<{
  url: string;
  title: string;
  text: string;
  endpointRows: Array<Record<string, string>>;
  truncated: boolean;
}> {
  return docs.map((doc) => {
    const limitedRows = doc.endpointRows
      .slice(0, env.llm.maxEndpointRowsPerPage)
      .map((row) =>
        Object.fromEntries(
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
      truncated:
        text.length < doc.text.length ||
        limitedRows.length < doc.endpointRows.length
    };
  });
}

function buildPrompt(docs: CrawledDoc[], existingMethodsJson: string): string {
  const compactedDocs = compactDocs(docs);
  const compactedMethods = truncate(existingMethodsJson, 100_000);
  return [
    "You are maintaining universal-social-sdk.",
    "Compare the crawled docs with current methods and identify NEW or CHANGED endpoints.",
    "Focus areas: content publishing, stories, reels, comments, DMs, analytics.",
    "Crawled text may be truncated. Only report high-confidence changes.",
    "Output STRICT JSON with this shape only:",
    "{\"summary\": string, \"updatedMethods\": Record<string,string[]>, \"changes\": [{\"platform\": string, \"endpoint\": string, \"changeType\": \"added|modified|deprecated|removed\", \"confidence\": number, \"notes\"?: string}], \"files\": [{\"path\": string, \"content\": string}], \"readmeTable\": string}",
    "Files must target src/platforms/*.ts and supported-methods.json updates when needed.",
    "Each file.content must be complete TypeScript file content, not patch snippets.",
    "Current supported-methods.json:",
    compactedMethods,
    "Crawled docs:",
    JSON.stringify(compactedDocs)
  ].join("\n");
}

export function parseJsonOutput(raw: string): OllamaPatchPlan {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("LLM response did not contain a JSON object.");
  }
  const maybeJson = cleaned.slice(start, end + 1);
  const parsed = JSON.parse(maybeJson) as unknown;
  const result = ollamaPatchPlanSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Patch plan schema validation failed: ${result.error.message}`
    );
  }
  return result.data;
}

async function askViaOllama(params: {
  prompt: string;
  model: string;
}): Promise<string> {
  const response = await axios.post<{ response: string }>(
    `${env.ollama.host}/api/generate`,
    {
      model: params.model,
      prompt: params.prompt,
      stream: false
    },
    {
      timeout: 120_000
    }
  );
  return response.data.response;
}

async function askViaOpenRouter(params: {
  prompt: string;
  model: string;
}): Promise<string> {
  if (!env.llm.apiKey) {
    throw new Error(
      "Missing updater API key. Set UPDATER_LLM_API_KEY (or OPENROUTER_API_KEY)."
    );
  }
  let response: { data: { choices?: Array<{ message?: { content?: string } }> } };
  try {
    response = await axios.post<{
      choices?: Array<{ message?: { content?: string } }>;
    }>(
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
        timeout: 120_000,
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
    const responseBody = error.response?.data as
      | { error?: { message?: string }; message?: string }
      | string
      | undefined;
    const providerMessage =
      typeof responseBody === "string"
        ? responseBody
        : responseBody?.error?.message ?? responseBody?.message ?? "";
    const hint =
      status === 401 || status === 403
        ? "Verify UPDATER_LLM_API_KEY permissions."
        : status === 402
        ? "Your provider account/model likely requires billing or has no quota."
        : status === 404
        ? "Model or endpoint not found. Verify UPDATER_LLM_MODEL and base URL."
        : status === 429
        ? "Rate-limited by provider. Retry later or switch to a less busy model."
        : status === 413
        ? "Prompt payload too large. Reduce UPDATER_LLM_MAX_DOC_CHARS_PER_PAGE."
        : "Check provider status and updater LLM configuration.";
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

function buildModelChain(params: {
  primaryModel: string;
  fallbackModels?: string[];
  maxModelAttempts?: number;
}): string[] {
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

export async function askOllamaForPatchPlan(params: {
  docs: CrawledDoc[];
  existingMethodsJson: string;
  model?: string;
  fallbackModels?: string[];
  maxModelAttempts?: number;
}): Promise<OllamaPatchPlan> {
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
  const failures: string[] = [];
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
