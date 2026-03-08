import type { NormalizedWebhookEvent, WebhookPlatform } from "./types.js";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function normalizeMetaWebhook(body: unknown): NormalizedWebhookEvent[] {
  const root = asRecord(body);
  const entries = Array.isArray(root?.entry) ? root?.entry : [];
  const events: NormalizedWebhookEvent[] = [];

  for (const entry of entries) {
    const entryRecord = asRecord(entry);
    const entryId =
      typeof entryRecord?.id === "string" ? entryRecord.id : undefined;
    const timestamp =
      typeof entryRecord?.time === "number" ? entryRecord.time : undefined;
    const changes = Array.isArray(entryRecord?.changes)
      ? entryRecord.changes
      : [];

    for (const change of changes) {
      const changeRecord = asRecord(change);
      const field =
        typeof changeRecord?.field === "string"
          ? changeRecord.field
          : "change";
      events.push({
        platform: "meta",
        type: `meta.${field}`,
        id: entryId,
        timestamp,
        payload: changeRecord?.value ?? changeRecord,
        raw: body
      });
    }

    const messaging = Array.isArray(entryRecord?.messaging)
      ? entryRecord.messaging
      : [];
    for (const item of messaging) {
      events.push({
        platform: "meta",
        type: "meta.messaging",
        id: entryId,
        timestamp,
        payload: item,
        raw: body
      });
    }
  }

  if (events.length === 0) {
    events.push({
      platform: "meta",
      type: "meta.unknown",
      payload: body,
      raw: body
    });
  }

  return events;
}

export function normalizeXWebhook(body: unknown): NormalizedWebhookEvent[] {
  const root = asRecord(body);
  if (!root) {
    return [
      {
        platform: "x",
        type: "x.unknown",
        payload: body,
        raw: body
      }
    ];
  }

  const events: NormalizedWebhookEvent[] = [];
  for (const [key, value] of Object.entries(root)) {
    if (key === "for_user_id") {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        events.push({
          platform: "x",
          type: `x.${key}`,
          payload: item,
          raw: body
        });
      }
      continue;
    }
    events.push({
      platform: "x",
      type: `x.${key}`,
      payload: value,
      raw: body
    });
  }

  if (events.length === 0) {
    events.push({
      platform: "x",
      type: "x.unknown",
      payload: body,
      raw: body
    });
  }

  return events;
}

export function normalizeWebhook(
  platform: WebhookPlatform,
  body: unknown
): NormalizedWebhookEvent[] {
  if (platform === "meta") {
    return normalizeMetaWebhook(body);
  }
  return normalizeXWebhook(body);
}
