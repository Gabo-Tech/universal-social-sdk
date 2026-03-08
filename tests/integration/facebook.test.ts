import { describe, expect, it } from "vitest";
import { Facebook } from "../../src/platforms/facebook.js";
import { integrationSuite } from "../helpers/guards.js";
import { platformEnabled } from "../helpers/env.js";

const status = platformEnabled("facebook");

describe("Facebook integration setup", () => {
  it("documents missing vars when disabled", () => {
    if (status.enabled) {
      expect(status.missingVars).toEqual([]);
      return;
    }
    expect(status.missingVars.length).toBeGreaterThan(0);
  });
});

integrationSuite(status, "Facebook integration smoke tests", () => {
  it("reads published posts for configured page", async () => {
    const result = await Facebook.listPublishedPosts({ limit: 1 });
    expect(result).toBeTruthy();
  });
});
