import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  normalizeMetaWebhook,
  normalizeXWebhook,
  verifyMetaWebhookSignature,
  verifyXWebhookSignature,
  WebhookRouter
} from "../../src/webhooks/index.js";
import { SocialError } from "../../src/errors/SocialError.js";

describe("webhook signature verification", () => {
  it("verifies Meta signatures", () => {
    const payload = JSON.stringify({ object: "page", entry: [] });
    const appSecret = "meta-secret";
    const digest = createHmac("sha256", appSecret).update(payload).digest("hex");
    const valid = verifyMetaWebhookSignature({
      payload,
      appSecret,
      signatureHeader: `sha256=${digest}`
    });
    expect(valid).toBe(true);
  });

  it("verifies X signatures", () => {
    const payload = JSON.stringify({ for_user_id: "1", tweet_create_events: [] });
    const consumerSecret = "x-secret";
    const digest = createHmac("sha256", consumerSecret)
      .update(payload)
      .digest("base64");
    const valid = verifyXWebhookSignature({
      payload,
      consumerSecret,
      signatureHeader: `sha256=${digest}`
    });
    expect(valid).toBe(true);
  });
});

describe("webhook normalization", () => {
  it("normalizes meta change events", () => {
    const events = normalizeMetaWebhook({
      object: "page",
      entry: [
        {
          id: "123",
          time: 1000,
          changes: [{ field: "feed", value: { item: "post" } }]
        }
      ]
    });
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("meta.feed");
  });

  it("normalizes x payload keys", () => {
    const events = normalizeXWebhook({
      for_user_id: "1",
      tweet_create_events: [{ id: "t1" }]
    });
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("x.tweet_create_events");
  });
});

describe("webhook router", () => {
  it("dispatches matched and wildcard handlers", async () => {
    const router = new WebhookRouter();
    const matched = vi.fn();
    const wildcard = vi.fn();

    router.on("meta.feed", matched);
    router.on("*", wildcard);

    await router.handle("meta", {
      entry: [{ changes: [{ field: "feed", value: { id: "1" } }] }]
    });

    expect(matched).toHaveBeenCalledTimes(1);
    expect(wildcard).toHaveBeenCalledTimes(1);
  });

  it("throws SocialError on invalid Meta signature", async () => {
    const router = new WebhookRouter();
    await expect(
      router.handleMeta({
        payload: "{}",
        body: {},
        appSecret: "secret",
        signatureHeader: "sha256=invalid"
      })
    ).rejects.toBeInstanceOf(SocialError);
  });
});
