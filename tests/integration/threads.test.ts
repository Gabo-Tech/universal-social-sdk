import { describe, expect, it } from "vitest";
import { Threads } from "../../src/platforms/threads.js";
import { integrationSuite } from "../helpers/guards.js";
import { platformEnabled } from "../helpers/env.js";

const status = platformEnabled("threads");

describe("Threads integration setup", () => {
  it("documents missing vars when disabled", () => {
    if (status.enabled) {
      expect(status.missingVars).toEqual([]);
      return;
    }
    expect(status.missingVars.length).toBeGreaterThan(0);
  });
});

integrationSuite(status, "Threads integration smoke tests", () => {
  it("lists threads for configured user", async () => {
    const result = await Threads.listMyThreads({ limit: 1 });
    expect(result).toBeTruthy();
  });
});
