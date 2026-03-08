import { describe, expect, it } from "vitest";
import { X } from "../../src/platforms/x.js";
import { integrationSuite } from "../helpers/guards.js";
import { platformEnabled } from "../helpers/env.js";

const status = platformEnabled("x");

describe("X integration setup", () => {
  it("documents missing vars when disabled", () => {
    if (status.enabled) {
      expect(status.missingVars).toEqual([]);
      return;
    }
    expect(status.missingVars.length).toBeGreaterThan(0);
  });
});

integrationSuite(status, "X integration smoke tests", () => {
  it("can call analytics endpoint with a known tweet id", async () => {
    const tweetId = process.env.X_TEST_TWEET_ID;
    if (!tweetId) {
      throw new Error("Set X_TEST_TWEET_ID in .env.test to run this test.");
    }
    const result = await X.getTweetAnalytics({ tweetId });
    expect(result).toBeTruthy();
  });
});
