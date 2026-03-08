import { describe, expect, it } from "vitest";
import { TikTok } from "../../src/platforms/tiktok.js";
import { integrationSuite } from "../helpers/guards.js";
import { platformEnabled } from "../helpers/env.js";

const status = platformEnabled("tiktok");

describe("TikTok integration setup", () => {
  it("documents missing vars when disabled", () => {
    if (status.enabled) {
      expect(status.missingVars).toEqual([]);
      return;
    }
    expect(status.missingVars.length).toBeGreaterThan(0);
  });
});

integrationSuite(status, "TikTok integration smoke tests", () => {
  it("lists videos for authenticated account", async () => {
    const result = await TikTok.listVideos({ maxCount: 1 });
    expect(result).toBeTruthy();
  });
});
