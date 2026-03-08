import { describe, expect, it } from "vitest";
import type { IntegrationEnvStatus } from "./env.js";

export function integrationSuite(
  status: IntegrationEnvStatus,
  title: string,
  defineTests: () => void
) {
  const suite = status.enabled ? describe : describe.skip;
  suite(title, () => {
    it("has required integration credentials", () => {
      expect(status.missingVars).toEqual([]);
    });
    defineTests();
  });
}
