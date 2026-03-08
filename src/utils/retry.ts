import { env } from "../config/env.js";
import { SocialError } from "../errors/SocialError.js";
import type { Platform } from "../types.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(details: unknown): number | null {
  if (!details || typeof details !== "object") {
    return null;
  }
  const maybe = details as Record<string, unknown>;
  const headers = maybe.headers;
  if (!headers || typeof headers !== "object") {
    return null;
  }
  const retryAfterRaw = (headers as Record<string, unknown>)["retry-after"];
  if (typeof retryAfterRaw !== "string" && typeof retryAfterRaw !== "number") {
    return null;
  }
  const seconds = Number(retryAfterRaw);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 1000);
  }
  return null;
}

function isRetryableStatus(code?: number): boolean {
  if (!code) {
    return false;
  }
  return code === 429 || (code >= 500 && code <= 599);
}

export async function withRetries<T>(params: {
  platform: Platform;
  endpoint: string;
  execute: () => Promise<T>;
  retries?: number;
  baseDelayMs?: number;
}): Promise<T> {
  const retries = params.retries ?? env.retry.maxRetries;
  const baseDelayMs = params.baseDelayMs ?? env.retry.baseDelayMs;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await params.execute();
    } catch (error) {
      lastError = error;
      const normalized = SocialError.normalize({
        platform: params.platform,
        endpoint: params.endpoint,
        error
      });

      if (!isRetryableStatus(normalized.statusCode) || attempt === retries) {
        throw normalized;
      }

      const backoffMs = baseDelayMs * 2 ** attempt;
      const jitterMs = Math.floor(Math.random() * Math.max(50, baseDelayMs));
      const retryAfterMs = parseRetryAfterMs(normalized.details) ?? backoffMs + jitterMs;
      await sleep(retryAfterMs);
      attempt += 1;
    }
  }

  throw SocialError.normalize({
    platform: params.platform,
    endpoint: params.endpoint,
    error: lastError
  });
}
