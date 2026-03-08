import axios from "axios";
import { env } from "../config/env.js";
import type { CrawledDoc } from "./docCrawler.js";

export interface OllamaPatchFile {
  path: string;
  content: string;
}

export interface OllamaPatchPlan {
  summary: string;
  updatedMethods: Record<string, string[]>;
  files: OllamaPatchFile[];
  readmeTable: string;
}

function buildPrompt(docs: CrawledDoc[], existingMethodsJson: string): string {
  return [
    "You are maintaining universal-social-sdk.",
    "Compare the crawled docs with current methods and identify NEW or CHANGED endpoints.",
    "Focus areas: content publishing, stories, reels, comments, DMs, analytics.",
    "Output STRICT JSON with this shape only:",
    "{\"summary\": string, \"updatedMethods\": Record<string,string[]>, \"files\": [{\"path\": string, \"content\": string}], \"readmeTable\": string}",
    "Files must target src/platforms/*.ts and supported-methods.json updates when needed.",
    "Each file.content must be complete TypeScript file content, not patch snippets.",
    "Current supported-methods.json:",
    existingMethodsJson,
    "Crawled docs:",
    JSON.stringify(docs)
  ].join("\n");
}

function parseJsonOutput(raw: string): OllamaPatchPlan {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Ollama response did not contain a JSON object.");
  }
  const maybeJson = cleaned.slice(start, end + 1);
  return JSON.parse(maybeJson) as OllamaPatchPlan;
}

export async function askOllamaForPatchPlan(params: {
  docs: CrawledDoc[];
  existingMethodsJson: string;
  model?: string;
}): Promise<OllamaPatchPlan> {
  const model = params.model || env.ollama.model || "llama3.2:3b";
  const prompt = buildPrompt(params.docs, params.existingMethodsJson);

  const response = await axios.post<{ response: string }>(
    `${env.ollama.host}/api/generate`,
    {
      model,
      prompt,
      stream: false
    },
    {
      timeout: 120_000
    }
  );

  return parseJsonOutput(response.data.response);
}
