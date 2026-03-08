import { describe, expect, it } from "vitest";
import { Mastodon } from "../../src/platforms/mastodon.js";
import { integrationSuite } from "../helpers/guards.js";
import { platformEnabled } from "../helpers/env.js";

const status = platformEnabled("mastodon");

describe("Mastodon integration setup", () => {
  it("documents missing vars when disabled", () => {
    if (status.enabled) {
      expect(status.missingVars).toEqual([]);
      return;
    }
    expect(status.missingVars.length).toBeGreaterThan(0);
  });
});

integrationSuite(status, "Mastodon integration smoke tests", () => {
  it("lists statuses for configured account", async () => {
    const result = await Mastodon.listMyStatuses({ limit: 1 });
    expect(result).toBeTruthy();
  });
});
