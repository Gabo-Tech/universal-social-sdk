import axios from "axios";
import { env } from "../config/env.js";
import { SocialError } from "../errors/SocialError.js";
import { withRetries } from "../utils/retry.js";
import { scheduleTask } from "../utils/scheduler.js";
import { validatePlatformInput } from "../validation/platformSchemas.js";

const PINTEREST_BASE = "https://api.pinterest.com/v5";

function pinterestHeaders() {
  if (!env.pinterest.accessToken) {
    throw new SocialError({
      platform: "pinterest",
      endpoint: "auth",
      message: "Missing PINTEREST_ACCESS_TOKEN."
    });
  }
  return {
    Authorization: `Bearer ${env.pinterest.accessToken}`,
    "Content-Type": "application/json"
  };
}

async function pinterestRequest<T = unknown>(params: {
  endpoint: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  data?: unknown;
  query?: Record<string, unknown>;
}) {
  return withRetries({
    platform: "pinterest",
    endpoint: params.endpoint,
    execute: async () => {
      try {
        const response = await axios.request<T>({
          baseURL: PINTEREST_BASE,
          url: params.endpoint,
          method: params.method,
          params: params.query,
          data: params.data,
          headers: pinterestHeaders()
        });
        return response.data;
      } catch (error) {
        throw SocialError.normalize({
          platform: "pinterest",
          endpoint: params.endpoint,
          error
        });
      }
    }
  });
}

export class Pinterest {
  static async createPin(input: {
    boardId?: string;
    title: string;
    description?: string;
    link?: string;
    mediaSourceUrl: string;
  }) {
    validatePlatformInput("pinterest", "createPin", input);
    return pinterestRequest({
      endpoint: "/pins",
      method: "POST",
      data: {
        board_id: input.boardId ?? env.pinterest.boardId,
        title: input.title,
        description: input.description,
        link: input.link,
        media_source: {
          source_type: "image_url",
          url: input.mediaSourceUrl
        }
      }
    });
  }

  static async createVideoPin(input: {
    boardId?: string;
    title: string;
    description?: string;
    mediaSourceUrl: string;
  }) {
    validatePlatformInput("pinterest", "createVideoPin", input);
    return pinterestRequest({
      endpoint: "/pins",
      method: "POST",
      data: {
        board_id: input.boardId ?? env.pinterest.boardId,
        title: input.title,
        description: input.description,
        media_source: {
          source_type: "video_url",
          url: input.mediaSourceUrl
        }
      }
    });
  }

  static async updatePin(input: {
    pinId: string;
    title?: string;
    description?: string;
    link?: string;
  }) {
    validatePlatformInput("pinterest", "updatePin", input);
    return pinterestRequest({
      endpoint: `/pins/${input.pinId}`,
      method: "PATCH",
      data: {
        title: input.title,
        description: input.description,
        link: input.link
      }
    });
  }

  static async deletePin(input: { pinId: string }) {
    validatePlatformInput("pinterest", "deletePin", input);
    return pinterestRequest({
      endpoint: `/pins/${input.pinId}`,
      method: "DELETE"
    });
  }

  static async listPins(input: { boardId?: string; pageSize?: number }) {
    validatePlatformInput("pinterest", "listPins", input);
    return pinterestRequest({
      endpoint: "/pins",
      method: "GET",
      query: {
        board_id: input.boardId ?? env.pinterest.boardId,
        page_size: input.pageSize ?? 25
      }
    });
  }

  static async createBoard(input: {
    name: string;
    description?: string;
    privacy?: "PUBLIC" | "PROTECTED" | "SECRET";
  }) {
    validatePlatformInput("pinterest", "createBoard", input);
    return pinterestRequest({
      endpoint: "/boards",
      method: "POST",
      data: {
        name: input.name,
        description: input.description,
        privacy: input.privacy ?? "PUBLIC"
      }
    });
  }

  static async listBoards(input: { pageSize?: number }) {
    validatePlatformInput("pinterest", "listBoards", input);
    return pinterestRequest({
      endpoint: "/boards",
      method: "GET",
      query: { page_size: input.pageSize ?? 25 }
    });
  }

  static async commentOnPin(input: { pinId: string; text: string }) {
    validatePlatformInput("pinterest", "commentOnPin", input);
    return pinterestRequest({
      endpoint: `/pins/${input.pinId}/comments`,
      method: "POST",
      data: { text: input.text }
    });
  }

  static async replyToComment(input: { pinId: string; commentId: string; text: string }) {
    validatePlatformInput("pinterest", "replyToComment", input);
    return pinterestRequest({
      endpoint: `/pins/${input.pinId}/comments/${input.commentId}/replies`,
      method: "POST",
      data: { text: input.text }
    });
  }

  static async getPinAnalytics(input: { pinId: string; startDate: string; endDate: string }) {
    validatePlatformInput("pinterest", "getPinAnalytics", input);
    return pinterestRequest({
      endpoint: `/pins/${input.pinId}/analytics`,
      method: "GET",
      query: { start_date: input.startDate, end_date: input.endDate }
    });
  }

  static async getAccountAnalytics(input: { startDate: string; endDate: string }) {
    validatePlatformInput("pinterest", "getAccountAnalytics", input);
    return pinterestRequest({
      endpoint: "/user_account/analytics",
      method: "GET",
      query: { start_date: input.startDate, end_date: input.endDate }
    });
  }

  static async schedulePin(input: {
    title: string;
    mediaSourceUrl: string;
    boardId?: string;
    publishAt: Date | string;
  }) {
    validatePlatformInput("pinterest", "schedulePin", input);
    return scheduleTask({
      id: `pinterest-schedule-${Date.now()}`,
      runAt: input.publishAt,
      task: async () =>
        Pinterest.createPin({
          title: input.title,
          mediaSourceUrl: input.mediaSourceUrl,
          boardId: input.boardId
        })
    });
  }
}
