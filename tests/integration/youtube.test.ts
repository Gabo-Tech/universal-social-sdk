import { describe, expect, it } from "vitest";
import { YouTube } from "../../src/platforms/youtube.js";
import { integrationSuite } from "../helpers/guards.js";
import { platformEnabled } from "../helpers/env.js";

const status = platformEnabled("youtube");

describe("YouTube integration setup", () => {
  it("documents missing vars when disabled", () => {
    if (status.enabled) {
      expect(status.missingVars).toEqual([]);
      return;
    }
    expect(status.missingVars.length).toBeGreaterThan(0);
  });
});

integrationSuite(status, "YouTube integration smoke tests", () => {
  it("lists videos for authenticated channel", async () => {
    const result = await YouTube.listMyVideos({ maxResults: 1 });
    expect(result).toBeTruthy();
  });
});
