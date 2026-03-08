import "./config/env.js";

export { Instagram } from "./platforms/instagram.js";
export { X } from "./platforms/x.js";
export { Facebook } from "./platforms/facebook.js";
export { LinkedIn } from "./platforms/linkedin.js";
export { YouTube } from "./platforms/youtube.js";
export { TikTok } from "./platforms/tiktok.js";
export { Pinterest } from "./platforms/pinterest.js";
export { Bluesky } from "./platforms/bluesky.js";
export { Mastodon } from "./platforms/mastodon.js";
export { Threads } from "./platforms/threads.js";
export { WebhookRouter } from "./webhooks/index.js";
export {
  verifyMetaWebhookSignature,
  verifyXWebhookSignature,
  normalizeMetaWebhook,
  normalizeXWebhook,
  normalizeWebhook
} from "./webhooks/index.js";
export type {
  WebhookPlatform,
  NormalizedWebhookEvent,
  WebhookHandler
} from "./webhooks/index.js";
export {
  InMemoryQueueAdapter,
  BullMQAdapter,
  SQSAdapter,
  getQueueAdapter,
  setQueueAdapter,
  resetQueueAdapter
} from "./queue/index.js";
export type {
  QueueAdapter,
  QueueJob,
  QueueJobHandle
} from "./queue/index.js";
export type * from "./responseTypes.js";
export { SocialError } from "./errors/SocialError.js";
export type * from "./types.js";
