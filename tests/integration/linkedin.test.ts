import { describe, expect, it } from "vitest";
import { LinkedIn } from "../../src/platforms/linkedin.js";
import { integrationSuite } from "../helpers/guards.js";
import { platformEnabled } from "../helpers/env.js";

const status = platformEnabled("linkedin");

describe("LinkedIn integration setup", () => {
  it("documents missing vars when disabled", () => {
    if (status.enabled) {
      expect(status.missingVars).toEqual([]);
      return;
    }
    expect(status.missingVars.length).toBeGreaterThan(0);
  });
});

integrationSuite(status, "LinkedIn integration smoke tests", () => {
  it("reads organization analytics when org URN is provided", async () => {
    if (!process.env.LINKEDIN_ORG_URN) {
      throw new Error(
        "Set LINKEDIN_ORG_URN in .env.test to run LinkedIn organization analytics test."
      );
    }
    const result = await LinkedIn.getOrganizationAnalytics({});
    expect(result).toBeTruthy();
  });
});
