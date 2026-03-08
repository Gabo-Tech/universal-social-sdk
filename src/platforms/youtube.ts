import axios from "axios";
import { env } from "../config/env.js";
import { SocialError } from "../errors/SocialError.js";
import { createUploadStream, getFileMeta } from "../utils/file.js";
import { withRetries } from "../utils/retry.js";
import { scheduleTask } from "../utils/scheduler.js";
import { validatePlatformInput } from "../validation/platformSchemas.js";

const YT_API_BASE = "https://www.googleapis.com/youtube/v3";
const YT_UPLOAD_BASE = "https://www.googleapis.com/upload/youtube/v3";
const YT_ANALYTICS_BASE = "https://youtubeanalytics.googleapis.com/v2";

function authHeader() {
  if (!env.youtube.accessToken) {
    throw new SocialError({
      platform: "youtube",
      endpoint: "auth",
      message: "Missing YOUTUBE_ACCESS_TOKEN."
    });
  }
  return { Authorization: `Bearer ${env.youtube.accessToken}` };
}

async function youtubeRequest<T = unknown>(params: {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  data?: unknown;
  query?: Record<string, unknown>;
  upload?: boolean;
}): Promise<T> {
  return withRetries({
    platform: "youtube",
    endpoint: params.endpoint,
    execute: async () => {
      try {
        const response = await axios.request<T>({
          baseURL: params.upload ? YT_UPLOAD_BASE : YT_API_BASE,
          url: params.endpoint,
          method: params.method,
          params: params.query,
          data: params.data,
          headers: {
            ...authHeader(),
            "Content-Type": "application/json"
          }
        });
        return response.data;
      } catch (error) {
        throw SocialError.normalize({
          platform: "youtube",
          endpoint: params.endpoint,
          error
        });
      }
    }
  });
}

export class YouTube {
  static async createVideoUploadSession(input: {
    title: string;
    description?: string;
    privacyStatus?: "private" | "public" | "unlisted";
  }) {
    validatePlatformInput("youtube", "createVideoUploadSession", input);
    return youtubeRequest({
      endpoint: "/videos",
      method: "POST",
      query: { part: "snippet,status", uploadType: "resumable" },
      data: {
        snippet: {
          title: input.title,
          description: input.description ?? ""
        },
        status: { privacyStatus: input.privacyStatus ?? "private" }
      },
      upload: true
    });
  }

  static async uploadBinary(input: { uploadUrl: string; mediaPath: string }) {
    validatePlatformInput("youtube", "uploadBinary", input);
    const { fileSize } = getFileMeta(input.mediaPath);
    return withRetries({
      platform: "youtube",
      endpoint: "uploadBinary",
      execute: async () =>
        axios.put(input.uploadUrl, createUploadStream(input.mediaPath), {
          maxBodyLength: Infinity,
          headers: {
            ...authHeader(),
            "Content-Length": String(fileSize),
            "Content-Type": "application/octet-stream"
          }
        })
    });
  }

  static async listMyVideos(input: { maxResults?: number }) {
    validatePlatformInput("youtube", "listMyVideos", input);
    return youtubeRequest({
      endpoint: "/search",
      method: "GET",
      query: {
        part: "snippet",
        forMine: true,
        type: "video",
        maxResults: input.maxResults ?? 25
      }
    });
  }

  static async updateVideoMetadata(input: {
    videoId: string;
    title?: string;
    description?: string;
    privacyStatus?: "private" | "public" | "unlisted";
  }) {
    validatePlatformInput("youtube", "updateVideoMetadata", input);
    return youtubeRequest({
      endpoint: "/videos",
      method: "PUT",
      query: { part: "snippet,status" },
      data: {
        id: input.videoId,
        snippet: {
          title: input.title,
          description: input.description
        },
        status: {
          privacyStatus: input.privacyStatus
        }
      }
    });
  }

  static async deleteVideo(input: { videoId: string }) {
    validatePlatformInput("youtube", "deleteVideo", input);
    return youtubeRequest({
      endpoint: "/videos",
      method: "DELETE",
      query: { id: input.videoId }
    });
  }

  static async commentOnVideo(input: { videoId: string; text: string }) {
    validatePlatformInput("youtube", "commentOnVideo", input);
    return youtubeRequest({
      endpoint: "/commentThreads",
      method: "POST",
      query: { part: "snippet" },
      data: {
        snippet: {
          videoId: input.videoId,
          topLevelComment: {
            snippet: { textOriginal: input.text }
          }
        }
      }
    });
  }

  static async replyToComment(input: { parentCommentId: string; text: string }) {
    validatePlatformInput("youtube", "replyToComment", input);
    return youtubeRequest({
      endpoint: "/comments",
      method: "POST",
      query: { part: "snippet" },
      data: {
        snippet: {
          parentId: input.parentCommentId,
          textOriginal: input.text
        }
      }
    });
  }

  static async likeVideo(input: { videoId: string }) {
    validatePlatformInput("youtube", "likeVideo", input);
    return youtubeRequest({
      endpoint: "/videos/rate",
      method: "POST",
      query: { id: input.videoId, rating: "like" }
    });
  }

  static async unlikeVideo(input: { videoId: string }) {
    validatePlatformInput("youtube", "unlikeVideo", input);
    return youtubeRequest({
      endpoint: "/videos/rate",
      method: "POST",
      query: { id: input.videoId, rating: "none" }
    });
  }

  static async createPlaylist(input: {
    title: string;
    description?: string;
    privacyStatus?: "private" | "public" | "unlisted";
  }) {
    validatePlatformInput("youtube", "createPlaylist", input);
    return youtubeRequest({
      endpoint: "/playlists",
      method: "POST",
      query: { part: "snippet,status" },
      data: {
        snippet: {
          title: input.title,
          description: input.description ?? ""
        },
        status: { privacyStatus: input.privacyStatus ?? "private" }
      }
    });
  }

  static async addVideoToPlaylist(input: { playlistId: string; videoId: string }) {
    validatePlatformInput("youtube", "addVideoToPlaylist", input);
    return youtubeRequest({
      endpoint: "/playlistItems",
      method: "POST",
      query: { part: "snippet" },
      data: {
        snippet: {
          playlistId: input.playlistId,
          resourceId: {
            kind: "youtube#video",
            videoId: input.videoId
          }
        }
      }
    });
  }

  static async getChannelAnalytics(input: {
    startDate: string;
    endDate: string;
    metrics?: string;
  }) {
    validatePlatformInput("youtube", "getChannelAnalytics", input);
    return withRetries({
      platform: "youtube",
      endpoint: "/reports",
      execute: async () => {
        const response = await axios.get(`${YT_ANALYTICS_BASE}/reports`, {
          params: {
            ids: `channel==${env.youtube.channelId}`,
            startDate: input.startDate,
            endDate: input.endDate,
            metrics: input.metrics ?? "views,likes,comments,estimatedMinutesWatched"
          },
          headers: authHeader()
        });
        return response.data;
      }
    });
  }

  static async scheduleVideoMetadataUpdate(input: {
    videoId: string;
    title?: string;
    description?: string;
    privacyStatus?: "private" | "public" | "unlisted";
    publishAt: Date | string;
  }) {
    validatePlatformInput("youtube", "scheduleVideoMetadataUpdate", input);
    return scheduleTask({
      id: `youtube-schedule-${Date.now()}`,
      runAt: input.publishAt,
      task: async () =>
        YouTube.updateVideoMetadata({
          videoId: input.videoId,
          title: input.title,
          description: input.description,
          privacyStatus: input.privacyStatus
        })
    });
  }
}
