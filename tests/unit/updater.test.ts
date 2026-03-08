import { describe, expect, it } from "vitest";
import { hasMaterialChanges } from "../../src/cli/commands/update.js";
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
