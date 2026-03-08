import { describe, expect, it } from "vitest";
import {
  normalizeActionResult,
  normalizeDeleteResult,
  normalizeDetailResult,
  normalizeMutationResult
} from "../../src/utils/normalizedResult.js";

describe("normalized result helpers", () => {
  it("produces stable action/delete/mutation/detail contracts", () => {
    const action = normalizeActionResult({
      platform: "x",
      action: "retweet",
      raw: { data: { retweeted: true } }
    });
    const deleted = normalizeDeleteResult({
      platform: "facebook",
      targetId: "123"
    });
    const mutation = normalizeMutationResult({
      platform: "youtube",
      resourceId: "video-1"
    });
    const detail = normalizeDetailResult({
      platform: "threads",
      raw: { id: "t1" }
    });

    expect(action).toMatchObject({ platform: "x", action: "retweet", success: true });
    expect(deleted).toMatchObject({ platform: "facebook", targetId: "123", deleted: true, success: true });
    expect(mutation).toMatchObject({ platform: "youtube", resourceId: "video-1", success: true });
    expect(detail).toMatchObject({ platform: "threads", success: true });
  });
});
