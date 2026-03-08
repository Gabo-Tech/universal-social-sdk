import { describe, expect, it } from "vitest";
import { validatePlatformInput } from "../../src/validation/platformSchemas.js";
import { SocialError } from "../../src/errors/SocialError.js";

describe("validatePlatformInput", () => {
  it("accepts valid payloads", () => {
    const parsed = validatePlatformInput("x", "postTweet", {
      text: "hello world"
    });
    expect(parsed.text).toBe("hello world");
  });

  it("throws SocialError with details on invalid input", () => {
    expect(() =>
      validatePlatformInput("instagram", "uploadReel", {
        videoUrl: ""
      })
    ).toThrowError(SocialError);

    try {
      validatePlatformInput("instagram", "uploadReel", { videoUrl: "" });
    } catch (error) {
      const socialError = error as SocialError;
      expect(socialError.platform).toBe("instagram");
      expect(socialError.endpoint).toBe("instagram.uploadReel");
      expect(socialError.details).toBeDefined();
    }
  });
});
