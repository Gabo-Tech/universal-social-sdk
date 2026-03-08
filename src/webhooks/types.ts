export type WebhookPlatform = "meta" | "x";

export interface NormalizedWebhookEvent {
  platform: WebhookPlatform;
  type: string;
  id?: string;
  timestamp?: number;
  payload: unknown;
  raw: unknown;
}

export type WebhookHandler = (
  event: NormalizedWebhookEvent
) => void | Promise<void>;
