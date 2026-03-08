import axios from "axios";
import { env } from "../config/env.js";
import { SocialError } from "../errors/SocialError.js";
import { createUploadStream, getFileMeta } from "../utils/file.js";
import {
  normalizeDeleteResult,
  normalizeDetailResult
} from "../utils/normalizedResult.js";
import { withRetries } from "../utils/retry.js";
import { scheduleTask } from "../utils/scheduler.js";
import { validatePlatformInput } from "../validation/platformSchemas.js";
import type {
  MastodonAccountAnalyticsResult,
  MastodonContextResult,
  MastodonDeleteStatusResult,
  MastodonListStatusesResult,
  MastodonMediaResult,
  MastodonStatusResult
} from "../responseTypes.js";

function baseUrl() {
  if (!env.mastodon.baseUrl) {
    throw new SocialError({
      platform: "mastodon",
      endpoint: "baseUrl",
      message: "Missing MASTODON_BASE_URL."
    });
  }
  return env.mastodon.baseUrl.replace(/\/$/, "");
}

function mastodonHeaders(extra?: Record<string, string>) {
  if (!env.mastodon.accessToken) {
    throw new SocialError({
      platform: "mastodon",
      endpoint: "auth",
      message: "Missing MASTODON_ACCESS_TOKEN."
    });
  }
  return {
    Authorization: `Bearer ${env.mastodon.accessToken}`,
    ...extra
  };
}

async function mastodonRequest<T = unknown>(params: {
  endpoint: string;
  method: "GET" | "POST" | "DELETE";
  data?: unknown;
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
}) {
  return withRetries({
    platform: "mastodon",
    endpoint: params.endpoint,
    execute: async () => {
      try {
        const response = await axios.request<T>({
          baseURL: `${baseUrl()}/api/v1`,
          url: params.endpoint,
          method: params.method,
          params: params.query,
          data: params.data,
          headers: mastodonHeaders(params.headers)
        });
        return response.data;
      } catch (error) {
        throw SocialError.normalize({
          platform: "mastodon",
          endpoint: params.endpoint,
          error
        });
      }
    }
  });
}

export class Mastodon {
  static async createStatus(input: {
    text: string;
    visibility?: "public" | "unlisted" | "private" | "direct";
  }): Promise<MastodonStatusResult> {
    validatePlatformInput("mastodon", "createStatus", input);
    return mastodonRequest({
      endpoint: "/statuses",
      method: "POST",
      data: {
        status: input.text,
        visibility: input.visibility ?? "public"
      }
    });
  }

  static async uploadMedia(input: {
    mediaPath: string;
    description?: string;
  }): Promise<MastodonMediaResult> {
    validatePlatformInput("mastodon", "uploadMedia", input);
    const { fileSize } = getFileMeta(input.mediaPath);

    return withRetries({
      platform: "mastodon",
      endpoint: "/media",
      execute: async () => {
        const response = await axios.post(
          `${baseUrl()}/api/v2/media`,
          createUploadStream(input.mediaPath),
          {
            headers: mastodonHeaders({
              "Content-Length": String(fileSize),
              "Content-Type": "application/octet-stream"
            }),
            maxBodyLength: Infinity
          }
        );
        return response.data as MastodonMediaResult;
      }
    });
  }

  static async createMediaStatus(input: {
    text: string;
    mediaIds: string[];
    visibility?: "public" | "unlisted" | "private" | "direct";
  }): Promise<MastodonStatusResult> {
    validatePlatformInput("mastodon", "createMediaStatus", input);
    return mastodonRequest({
      endpoint: "/statuses",
      method: "POST",
      data: {
        status: input.text,
        media_ids: input.mediaIds,
        visibility: input.visibility ?? "public"
      }
    });
  }

  static async replyToStatus(input: {
    statusId: string;
    text: string;
  }): Promise<MastodonStatusResult> {
    validatePlatformInput("mastodon", "replyToStatus", input);
    return mastodonRequest({
      endpoint: "/statuses",
      method: "POST",
      data: {
        status: input.text,
        in_reply_to_id: input.statusId
      }
    });
  }

  static async deleteStatus(
    input: { statusId: string }
  ): Promise<MastodonDeleteStatusResult> {
    validatePlatformInput("mastodon", "deleteStatus", input);
    const raw = await mastodonRequest({
      endpoint: `/statuses/${input.statusId}`,
      method: "DELETE"
    });
    return normalizeDeleteResult({ platform: "mastodon", targetId: input.statusId, raw });
  }

  static async favouriteStatus(input: {
    statusId: string;
  }): Promise<MastodonStatusResult> {
    validatePlatformInput("mastodon", "favouriteStatus", input);
    return mastodonRequest({
      endpoint: `/statuses/${input.statusId}/favourite`,
      method: "POST"
    });
  }

  static async unfavouriteStatus(input: {
    statusId: string;
  }): Promise<MastodonStatusResult> {
    validatePlatformInput("mastodon", "unfavouriteStatus", input);
    return mastodonRequest({
      endpoint: `/statuses/${input.statusId}/unfavourite`,
      method: "POST"
    });
  }

  static async boostStatus(input: {
    statusId: string;
  }): Promise<MastodonStatusResult> {
    validatePlatformInput("mastodon", "boostStatus", input);
    return mastodonRequest({
      endpoint: `/statuses/${input.statusId}/reblog`,
      method: "POST"
    });
  }

  static async unboostStatus(input: {
    statusId: string;
  }): Promise<MastodonStatusResult> {
    validatePlatformInput("mastodon", "unboostStatus", input);
    return mastodonRequest({
      endpoint: `/statuses/${input.statusId}/unreblog`,
      method: "POST"
    });
  }

  static async listMyStatuses(
    input: { limit?: number }
  ): Promise<MastodonListStatusesResult> {
    validatePlatformInput("mastodon", "listMyStatuses", input);
    const accountId = env.mastodon.accountId;
    if (!accountId) {
      throw new SocialError({
        platform: "mastodon",
        endpoint: "accountId",
        message: "Missing MASTODON_ACCOUNT_ID."
      });
    }
    return mastodonRequest({
      endpoint: `/accounts/${accountId}/statuses`,
      method: "GET",
      query: { limit: input.limit ?? 20 }
    });
  }

  static async getStatusContext(input: {
    statusId: string;
  }): Promise<MastodonContextResult> {
    validatePlatformInput("mastodon", "getStatusContext", input);
    return mastodonRequest({
      endpoint: `/statuses/${input.statusId}/context`,
      method: "GET"
    });
  }

  static async getAccountAnalytics(input: {
    instanceScope?: "day" | "week" | "month";
  }): Promise<MastodonAccountAnalyticsResult> {
    validatePlatformInput("mastodon", "getAccountAnalytics", input);
    const raw = await mastodonRequest({
      endpoint: "/accounts/verify_credentials",
      method: "GET",
      query: { scope: input.instanceScope ?? "day" }
    });
    return normalizeDetailResult({ platform: "mastodon", raw });
  }

  static async scheduleStatus(input: {
    text: string;
    publishAt: Date | string;
  }): Promise<MastodonStatusResult> {
    validatePlatformInput("mastodon", "scheduleStatus", input);
    return scheduleTask({
      id: `mastodon-schedule-${Date.now()}`,
      runAt: input.publishAt,
      task: async () => Mastodon.createStatus({ text: input.text })
    });
  }
}
