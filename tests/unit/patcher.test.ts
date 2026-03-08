import { describe, expect, it } from "vitest";
import { planDiffs } from "../../src/updater/patcher.js";

describe("planDiffs path safety", () => {
  it("allows safe platform file targets", async () => {
    const plans = await planDiffs({
      rootDir: process.cwd(),
      files: [
        {
          path: "src/platforms/x.ts",
          content: "export class X {}\n"
        }
      ]
    });
    expect(plans.length).toBe(1);
  });

  it("rejects path traversal targets", async () => {
    await expect(
      planDiffs({
        rootDir: process.cwd(),
        files: [
          {
            path: "../outside.ts",
            content: "console.log('bad')\n"
          }
        ]
      })
    ).rejects.toThrow(/Unsafe patch path/);
  });
});
