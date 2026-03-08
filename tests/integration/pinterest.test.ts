import { describe, expect, it } from "vitest";
import { Pinterest } from "../../src/platforms/pinterest.js";
import { integrationSuite } from "../helpers/guards.js";
import { platformEnabled } from "../helpers/env.js";

const status = platformEnabled("pinterest");

describe("Pinterest integration setup", () => {
  it("documents missing vars when disabled", () => {
    if (status.enabled) {
      expect(status.missingVars).toEqual([]);
      return;
    }
    expect(status.missingVars.length).toBeGreaterThan(0);
  });
});

integrationSuite(status, "Pinterest integration smoke tests", () => {
  it("lists boards for authenticated account", async () => {
    const result = await Pinterest.listBoards({ pageSize: 1 });
    expect(result).toBeTruthy();
  });
});
