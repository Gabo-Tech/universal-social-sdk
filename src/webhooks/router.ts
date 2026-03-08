import { SocialError } from "../errors/SocialError.js";
import { normalizeWebhook } from "./normalize.js";
import {
  verifyMetaWebhookSignature,
  verifyXWebhookSignature
} from "./signature.js";
import type {
  NormalizedWebhookEvent,
  WebhookHandler,
  WebhookPlatform
} from "./types.js";

export class WebhookRouter {
  private readonly handlers = new Map<string, WebhookHandler[]>();

  on(type: string, handler: WebhookHandler): this {
    const existing = this.handlers.get(type) ?? [];
    existing.push(handler);
    this.handlers.set(type, existing);
    return this;
  }

  async dispatch(events: NormalizedWebhookEvent[]): Promise<void> {
    for (const event of events) {
      const typedHandlers = this.handlers.get(event.type) ?? [];
      const wildcardHandlers = this.handlers.get("*") ?? [];
      for (const handler of [...typedHandlers, ...wildcardHandlers]) {
        await handler(event);
      }
    }
  }

  async handle(platform: WebhookPlatform, body: unknown): Promise<void> {
    const events = normalizeWebhook(platform, body);
    await this.dispatch(events);
  }

  async handleMeta(params: {
    payload: string | Buffer;
    body: unknown;
    signatureHeader?: string;
    appSecret: string;
  }): Promise<void> {
    const valid = verifyMetaWebhookSignature({
      payload: params.payload,
      signatureHeader: params.signatureHeader,
      appSecret: params.appSecret
    });
    if (!valid) {
      throw new SocialError({
        platform: "facebook",
        endpoint: "webhooks.meta.verify",
        message: "Invalid Meta webhook signature."
      });
    }
    await this.handle("meta", params.body);
  }

  async handleX(params: {
    payload: string | Buffer;
    body: unknown;
    signatureHeader?: string;
    consumerSecret: string;
  }): Promise<void> {
    const valid = verifyXWebhookSignature({
      payload: params.payload,
      signatureHeader: params.signatureHeader,
      consumerSecret: params.consumerSecret
    });
    if (!valid) {
      throw new SocialError({
        platform: "x",
        endpoint: "webhooks.x.verify",
        message: "Invalid X webhook signature."
      });
    }
    await this.handle("x", params.body);
  }
}
