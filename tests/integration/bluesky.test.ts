import { describe, expect, it } from "vitest";
import { Bluesky } from "../../src/platforms/bluesky.js";
import { integrationSuite } from "../helpers/guards.js";
import { platformEnabled } from "../helpers/env.js";

const status = platformEnabled("bluesky");

describe("Bluesky integration setup", () => {
  it("documents missing vars when disabled", () => {
    if (status.enabled) {
      expect(status.missingVars).toEqual([]);
      return;
    }
    expect(status.missingVars.length).toBeGreaterThan(0);
  });
});

integrationSuite(status, "Bluesky integration smoke tests", () => {
  it("retrieves author feed for configured identifier", async () => {
    const actorDidOrHandle = process.env.BLUESKY_TEST_ACTOR ?? process.env.BLUESKY_IDENTIFIER;
    if (!actorDidOrHandle) {
      throw new Error(
        "Set BLUESKY_TEST_ACTOR or BLUESKY_IDENTIFIER in .env.test to run Bluesky integration test."
      );
    }
    const result = await Bluesky.getAuthorFeed({ actorDidOrHandle, limit: 1 });
    expect(result).toBeTruthy();
  });
});
