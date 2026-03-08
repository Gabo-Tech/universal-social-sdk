import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createPatch } from "diff";
import type { OllamaPatchFile } from "./ollama.js";

export interface PlannedDiff {
  path: string;
  absolutePath: string;
  before: string;
  after: string;
  diff: string;
}

const ALLOWED_TARGETS = new Set<string>([
  "supported-methods.json",
  "README.md"
]);

function isAllowedPath(rootDir: string, filePath: string): string {
  if (path.isAbsolute(filePath)) {
    throw new Error(`Unsafe patch path (absolute not allowed): ${filePath}`);
  }

  const normalized = path.normalize(filePath);
  if (normalized.startsWith("..")) {
    throw new Error(`Unsafe patch path (traversal): ${filePath}`);
  }

  const isPlatformSource =
    normalized.startsWith(`src${path.sep}platforms${path.sep}`) &&
    normalized.endsWith(".ts");
  const isAllowedTopLevel = ALLOWED_TARGETS.has(normalized);

  if (!isPlatformSource && !isAllowedTopLevel) {
    throw new Error(
      `Patch path not allowed: ${filePath}. Allowed: src/platforms/*.ts, README.md, supported-methods.json.`
    );
  }

  return path.resolve(rootDir, normalized);
}

export async function planDiffs(params: {
  rootDir: string;
  files: OllamaPatchFile[];
}): Promise<PlannedDiff[]> {
  const plans: PlannedDiff[] = [];
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

export async function applyPlannedDiffs(params: {
  plans: PlannedDiff[];
}): Promise<void> {
  for (const plan of params.plans) {
    await writeFile(plan.absolutePath, plan.after, "utf8");
  }
}
