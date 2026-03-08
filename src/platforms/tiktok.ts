import axios from "axios";
import { env } from "../config/env.js";
import { SocialError } from "../errors/SocialError.js";
import { withRetries } from "../utils/retry.js";
import { scheduleTask } from "../utils/scheduler.js";
import { validatePlatformInput } from "../validation/platformSchemas.js";

const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";

function tiktokHeaders() {
  if (!env.tiktok.accessToken) {
    throw new SocialError({
      platform: "tiktok",
      endpoint: "auth",
      message: "Missing TIKTOK_ACCESS_TOKEN."
    });
  }
  return {
    Authorization: `Bearer ${env.tiktok.accessToken}`,
    "Content-Type": "application/json"
  };
}

async function tikTokRequest<T = unknown>(params: {
  endpoint: string;
  method: "GET" | "POST" | "DELETE";
  data?: unknown;
  query?: Record<string, unknown>;
}): Promise<T> {
  return withRetries({
    platform: "tiktok",
    endpoint: params.endpoint,
    execute: async () => {
      try {
        const response = await axios.request<T>({
          baseURL: TIKTOK_API_BASE,
          url: params.endpoint,
          method: params.method,
          params: params.query,
          data: params.data,
          headers: tiktokHeaders()
        });
        return response.data;
      } catch (error) {
        throw SocialError.normalize({
          platform: "tiktok",
          endpoint: params.endpoint,
          error
        });
      }
    }
  });
}

export class TikTok {
  static async createPost(input: {
    text: string;
    visibility?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY";
  }) {
    validatePlatformInput("tiktok", "createPost", input);
    return tikTokRequest({
      endpoint: "/post/publish/inbox/video/init/",
      method: "POST",
      data: {
        post_info: {
          title: input.text,
          privacy_level: input.visibility ?? "PUBLIC_TO_EVERYONE"
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: ""
        }
      }
    });
  }

  static async createVideoPost(input: {
    title: string;
    videoUrl: string;
    visibility?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY";
  }) {
    validatePlatformInput("tiktok", "createVideoPost", input);
    return tikTokRequest({
      endpoint: "/post/publish/video/init/",
      method: "POST",
      data: {
        post_info: {
          title: input.title,
          privacy_level: input.visibility ?? "PUBLIC_TO_EVERYONE"
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: input.videoUrl
        }
      }
    });
  }

  static async getPostStatus(input: { publishId: string }) {
    validatePlatformInput("tiktok", "getPostStatus", input);
    return tikTokRequest({
      endpoint: "/post/publish/status/fetch/",
      method: "POST",
      data: { publish_id: input.publishId }
    });
  }

  static async listVideos(input: { maxCount?: number }) {
    validatePlatformInput("tiktok", "listVideos", input);
    return tikTokRequest({
      endpoint: "/video/list/",
      method: "POST",
      data: { max_count: input.maxCount ?? 20 }
    });
  }

  static async deleteVideo(input: { videoId: string }) {
    validatePlatformInput("tiktok", "deleteVideo", input);
    return tikTokRequest({
      endpoint: "/video/delete/",
      method: "POST",
      data: { video_id: input.videoId }
    });
  }

  static async commentOnVideo(input: { videoId: string; text: string }) {
    validatePlatformInput("tiktok", "commentOnVideo", input);
    return tikTokRequest({
      endpoint: "/video/comment/create/",
      method: "POST",
      data: { video_id: input.videoId, text: input.text }
    });
  }

  static async replyToComment(input: { commentId: string; text: string }) {
    validatePlatformInput("tiktok", "replyToComment", input);
    return tikTokRequest({
      endpoint: "/video/comment/reply/",
      method: "POST",
      data: { comment_id: input.commentId, text: input.text }
    });
  }

  static async likeVideo(input: { videoId: string }) {
    validatePlatformInput("tiktok", "likeVideo", input);
    return tikTokRequest({
      endpoint: "/video/like/",
      method: "POST",
      data: { video_id: input.videoId }
    });
  }

  static async unlikeVideo(input: { videoId: string }) {
    validatePlatformInput("tiktok", "unlikeVideo", input);
    return tikTokRequest({
      endpoint: "/video/unlike/",
      method: "POST",
      data: { video_id: input.videoId }
    });
  }

  static async getVideoAnalytics(input: { videoIds: string[] }) {
    validatePlatformInput("tiktok", "getVideoAnalytics", input);
    return tikTokRequest({
      endpoint: "/research/video/query/",
      method: "POST",
      data: { filters: { video_ids: input.videoIds } }
    });
  }

  static async getProfileAnalytics(input: { fields?: string[] }) {
    validatePlatformInput("tiktok", "getProfileAnalytics", input);
    return tikTokRequest({
      endpoint: "/user/info/",
      method: "GET",
      query: {
        fields: (input.fields ?? ["display_name", "follower_count", "video_count"]).join(",")
      }
    });
  }

  static async scheduleVideoPost(input: {
    title: string;
    videoUrl: string;
    publishAt: Date | string;
  }) {
    validatePlatformInput("tiktok", "scheduleVideoPost", input);
    return scheduleTask({
      id: `tiktok-schedule-${Date.now()}`,
      runAt: input.publishAt,
      task: async () =>
        TikTok.createVideoPost({
          title: input.title,
          videoUrl: input.videoUrl
        })
    });
  }
}
