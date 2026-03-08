import { describe, expect, it } from "vitest";
import { withRetries } from "../../src/utils/retry.js";
import { SocialError } from "../../src/errors/SocialError.js";

describe("withRetries", () => {
  it("retries retryable errors and eventually succeeds", async () => {
    let attempts = 0;
    const result = await withRetries({
      platform: "x",
      endpoint: "POST /2/tweets",
      retries: 2,
      baseDelayMs: 1,
      execute: async () => {
        attempts += 1;
        if (attempts < 3) {
          throw {
            message: "rate limited",
            response: {
              status: 429,
              data: { message: "Too many requests" },
              headers: { "retry-after": "0" }
            }
          };
        }
        return "ok";
      }
    });

    expect(result).toBe("ok");
    expect(attempts).toBe(3);
  });

  it("does not retry non-retryable errors", async () => {
    await expect(
      withRetries({
        platform: "linkedin",
        endpoint: "/posts",
        retries: 3,
        baseDelayMs: 1,
        execute: async () => {
          throw {
            message: "bad request",
            response: { status: 400, data: { message: "Invalid payload" } }
          };
        }
      })
    ).rejects.toBeInstanceOf(SocialError);
  });
});
