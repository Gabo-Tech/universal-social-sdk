import { describe, expect, it } from "vitest";
import { Instagram } from "../../src/platforms/instagram.js";
import { integrationSuite } from "../helpers/guards.js";
import { platformEnabled } from "../helpers/env.js";

const status = platformEnabled("instagram");

describe("Instagram integration setup", () => {
  it("documents missing vars when disabled", () => {
    if (status.enabled) {
      expect(status.missingVars).toEqual([]);
      return;
    }
    expect(status.missingVars.length).toBeGreaterThan(0);
  });
});

integrationSuite(status, "Instagram integration smoke tests", () => {
  it("reads account publishing limit", async () => {
    const result = await Instagram.getPublishingLimit({});
    expect(result).toBeTruthy();
  });
});
