export type Platform = "x" | "facebook" | "instagram" | "linkedin";

export interface BaseResult<T = unknown> {
  ok: boolean;
  platform: Platform;
  endpoint: string;
  data: T;
}

export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
}

export interface MediaUploadOptions {
  mediaPath: string;
  mimeType?: string;
  fileName?: string;
  onProgress?: (percent: number) => void;
}

export interface ScheduleOptions {
  publishAt: Date | string;
}

export interface AnalyticsRange {
  since?: string;
  until?: string;
}
