import { describe, expect, it } from "vitest";
import {
  hasMaterialChanges,
  validateUpdaterPlanSafety
} from "../../src/cli/commands/update.js";
import { parseJsonOutput } from "../../src/updater/ollama.js";

describe("updater plan validation", () => {
  it("accepts valid Ollama patch plan JSON", () => {
    const valid = JSON.stringify({
      summary: "No changes",
      updatedMethods: { x: ["postTweet"] },
      files: [
        {
          path: "src/platforms/x.ts",
          content: "export class X {}\n"
        }
      ],
      readmeTable: "| Method |"
    });

    const parsed = parseJsonOutput(valid);
    expect(parsed.summary).toBe("No changes");
    expect(parsed.files[0]?.path).toBe("src/platforms/x.ts");
  });

  it("rejects invalid Ollama patch plan JSON shape", () => {
    const invalid = JSON.stringify({
      summary: "",
      files: "bad"
    });

    expect(() => parseJsonOutput(invalid)).toThrow(/schema validation failed/i);
  });
});

describe("updater no-change behavior", () => {
  it("reports no changes when diffs and methods are unchanged", () => {
    const result = hasMaterialChanges({
      diffs: [
        {
          path: "README.md",
          absolutePath: "/tmp/README.md",
          before: "same",
          after: "same",
          diff: ""
        }
      ],
      existingMethods: { x: ["postTweet"] },
      updatedMethods: { x: ["postTweet"] }
    });

    expect(result.hasChanges).toBe(false);
    expect(result.hasFileChanges).toBe(false);
    expect(result.methodsChanged).toBe(false);
  });
});

describe("updater plan safety checks", () => {
  it("rejects suspicious placeholder rewrites", () => {
    const result = validateUpdaterPlanSafety([
      {
        path: "src/platforms/x.ts",
        absolutePath: "/tmp/x.ts",
        before: Array.from({ length: 250 }, (_, i) => `line-${i}`).join("\n"),
        after: [
          "// This file needs to be updated",
          "import { XApi } from './api';",
          "export class XPlatform extends XApi {}"
        ].join("\n"),
        diff: ""
      }
    ]);

    expect(result.safe).toBe(false);
    expect(result.findings.some((item) => item.includes("suspicious"))).toBe(true);
  });

  it("accepts normal platform updates with stable class names", () => {
    const result = validateUpdaterPlanSafety([
      {
        path: "src/platforms/x.ts",
        absolutePath: "/tmp/x.ts",
        before: "export class X { static async postTweet() {} }\n",
        after: "export class X { static async postTweet() {} static async pinTweet() {} }\n",
        diff: ""
      }
    ]);

    expect(result.safe).toBe(true);
    expect(result.findings).toEqual([]);
  });
});
