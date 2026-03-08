import axios from "axios";
import { env } from "../config/env.js";
import { SocialError } from "../errors/SocialError.js";
import {
  normalizeActionResult,
  normalizeDeleteResult,
  normalizeDetailResult
} from "../utils/normalizedResult.js";
import { withRetries } from "../utils/retry.js";
import { scheduleTask } from "../utils/scheduler.js";
import { validatePlatformInput } from "../validation/platformSchemas.js";
import type {
  ThreadsActionResult,
  ThreadsDeleteResult,
  ThreadsInsightsResult,
  ThreadsListResult,
  ThreadsPublishResult,
  ThreadsThreadResult
} from "../responseTypes.js";

function graphBase() {
  return `https://graph.facebook.com/${env.meta.graphVersion}`;
}

function threadsUserIdOrThrow(inputUserId?: string) {
  const userId = inputUserId ?? env.threads.userId;
  if (!userId) {
    throw new SocialError({
      platform: "threads",
      endpoint: "threads-user-id",
      message: "Missing THREADS_USER_ID (or pass threadsUserId)."
    });
  }
  return userId;
}

function threadsTokenOrThrow() {
  const token = env.threads.accessToken || env.meta.igToken;
  if (!token) {
    throw new SocialError({
      platform: "threads",
      endpoint: "threads-token",
      message: "Missing THREADS_ACCESS_TOKEN (or IG_ACCESS_TOKEN fallback)."
    });
  }
  return token;
}

async function threadsRequest<T = unknown>(params: {
  endpoint: string;
  method: "GET" | "POST" | "DELETE";
  data?: Record<string, unknown>;
  query?: Record<string, unknown>;
}): Promise<T> {
  return withRetries({
    platform: "threads",
    endpoint: params.endpoint,
    execute: async () => {
      try {
        const response = await axios.request<T>({
          baseURL: graphBase(),
          url: params.endpoint,
          method: params.method,
          params: {
            ...params.query,
            access_token: threadsTokenOrThrow()
          },
          data: params.data
        });
        return response.data;
      } catch (error) {
        throw SocialError.normalize({
          platform: "threads",
          endpoint: params.endpoint,
          error
        });
      }
    }
  });
}

async function createContainer(params: {
  threadsUserId: string;
  mediaType?: "TEXT" | "IMAGE" | "VIDEO";
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  replyToId?: string;
}) {
  return threadsRequest<{ id: string }>({
    endpoint: `/${params.threadsUserId}/threads`,
    method: "POST",
    data: {
      media_type: params.mediaType ?? "TEXT",
      text: params.text,
      image_url: params.imageUrl,
      video_url: params.videoUrl,
      reply_to_id: params.replyToId
    }
  });
}

async function publishContainer(
  threadsUserId: string,
  creationId: string
): Promise<ThreadsPublishResult> {
  return threadsRequest<ThreadsPublishResult>({
    endpoint: `/${threadsUserId}/threads_publish`,
    method: "POST",
    data: { creation_id: creationId }
  });
}

export class Threads {
  static async postText(input: {
    threadsUserId?: string;
    text: string;
  }): Promise<ThreadsPublishResult> {
    validatePlatformInput("threads", "postText", input);
    const threadsUserId = threadsUserIdOrThrow(input.threadsUserId);
    const container = await createContainer({
      threadsUserId,
      mediaType: "TEXT",
      text: input.text
    });
    return publishContainer(threadsUserId, container.id);
  }

  static async postImage(input: {
    threadsUserId?: string;
    text?: string;
    imageUrl: string;
  }): Promise<ThreadsPublishResult> {
    validatePlatformInput("threads", "postImage", input);
    const threadsUserId = threadsUserIdOrThrow(input.threadsUserId);
    const container = await createContainer({
      threadsUserId,
      mediaType: "IMAGE",
      text: input.text,
      imageUrl: input.imageUrl
    });
    return publishContainer(threadsUserId, container.id);
  }

  static async postVideo(input: {
    threadsUserId?: string;
    text?: string;
    videoUrl: string;
  }): Promise<ThreadsPublishResult> {
    validatePlatformInput("threads", "postVideo", input);
    const threadsUserId = threadsUserIdOrThrow(input.threadsUserId);
    const container = await createContainer({
      threadsUserId,
      mediaType: "VIDEO",
      text: input.text,
      videoUrl: input.videoUrl
    });
    return publishContainer(threadsUserId, container.id);
  }

  static async replyToThread(input: {
    threadsUserId?: string;
    threadId: string;
    text: string;
  }): Promise<ThreadsPublishResult> {
    validatePlatformInput("threads", "replyToThread", input);
    const threadsUserId = threadsUserIdOrThrow(input.threadsUserId);
    const container = await createContainer({
      threadsUserId,
      mediaType: "TEXT",
      text: input.text,
      replyToId: input.threadId
    });
    return publishContainer(threadsUserId, container.id);
  }

  static async deleteThread(
    input: { threadId: string }
  ): Promise<ThreadsDeleteResult> {
    validatePlatformInput("threads", "deleteThread", input);
    const raw = await threadsRequest({
      endpoint: `/${input.threadId}`,
      method: "DELETE"
    });
    return normalizeDeleteResult({ platform: "threads", targetId: input.threadId, raw });
  }

  static async getThread(input: {
    threadId: string;
    fields?: string[];
  }): Promise<ThreadsThreadResult> {
    validatePlatformInput("threads", "getThread", input);
    const raw = await threadsRequest({
      endpoint: `/${input.threadId}`,
      method: "GET",
      query: {
        fields: (input.fields ?? ["id", "text", "timestamp", "permalink"]).join(",")
      }
    });
    return normalizeDetailResult({ platform: "threads", raw });
  }

  static async listMyThreads(input: {
    threadsUserId?: string;
    limit?: number;
  }): Promise<ThreadsListResult> {
    validatePlatformInput("threads", "listMyThreads", input);
    const threadsUserId = threadsUserIdOrThrow(input.threadsUserId);
    return threadsRequest<ThreadsListResult>({
      endpoint: `/${threadsUserId}/threads`,
      method: "GET",
      query: { limit: input.limit ?? 25 }
    });
  }

  static async getThreadInsights(input: {
    threadId: string;
    metrics?: string[];
  }): Promise<ThreadsInsightsResult> {
    validatePlatformInput("threads", "getThreadInsights", input);
    return threadsRequest<ThreadsInsightsResult>({
      endpoint: `/${input.threadId}/insights`,
      method: "GET",
      query: {
        metric: (input.metrics ?? ["views", "likes", "replies", "reposts"]).join(",")
      }
    });
  }

  static async getAccountInsights(input: {
    threadsUserId?: string;
    metrics?: string[];
    period?: "day" | "week" | "days_28";
  }): Promise<ThreadsInsightsResult> {
    validatePlatformInput("threads", "getAccountInsights", input);
    const threadsUserId = threadsUserIdOrThrow(input.threadsUserId);
    return threadsRequest<ThreadsInsightsResult>({
      endpoint: `/${threadsUserId}/threads_insights`,
      method: "GET",
      query: {
        metric: (input.metrics ?? ["views", "followers_count", "likes"]).join(","),
        period: input.period ?? "day"
      }
    });
  }

  static async likeThread(input: {
    threadId: string;
  }): Promise<ThreadsActionResult> {
    validatePlatformInput("threads", "likeThread", input);
    const raw = await threadsRequest({
      endpoint: `/${input.threadId}/likes`,
      method: "POST"
    });
    return normalizeActionResult({ platform: "threads", action: "likeThread", raw });
  }

  static async unlikeThread(input: {
    threadId: string;
  }): Promise<ThreadsDeleteResult> {
    validatePlatformInput("threads", "unlikeThread", input);
    const raw = await threadsRequest({
      endpoint: `/${input.threadId}/likes`,
      method: "DELETE"
    });
    return normalizeDeleteResult({ platform: "threads", targetId: input.threadId, raw });
  }

  static async scheduleTextPost(input: {
    threadsUserId?: string;
    text: string;
    publishAt: Date | string;
  }): Promise<ThreadsPublishResult> {
    validatePlatformInput("threads", "scheduleTextPost", input);
    return scheduleTask({
      id: `threads-schedule-${Date.now()}`,
      runAt: input.publishAt,
      task: async () =>
        Threads.postText({
          threadsUserId: input.threadsUserId,
          text: input.text
        })
    });
  }
}
