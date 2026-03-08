import axios from "axios";
import { env } from "../config/env.js";
import { SocialError } from "../errors/SocialError.js";
import {
  normalizeActionResult,
  normalizeDeleteResult,
  normalizeMutationResult
} from "../utils/normalizedResult.js";
import { withRetries } from "../utils/retry.js";
import { scheduleTask } from "../utils/scheduler.js";
import { validatePlatformInput } from "../validation/platformSchemas.js";
import type {
  PinterestActionResult,
  PinterestAnalyticsResult,
  PinterestDeleteResult,
  PinterestListPinsResult,
  PinterestListBoardsResult,
  PinterestMutationResult
} from "../responseTypes.js";

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
  }): Promise<PinterestMutationResult> {
    validatePlatformInput("pinterest", "createPin", input);
    const raw = await pinterestRequest({
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
    return normalizeMutationResult({ platform: "pinterest", raw });
  }

  static async createVideoPin(input: {
    boardId?: string;
    title: string;
    description?: string;
    mediaSourceUrl: string;
  }): Promise<PinterestMutationResult> {
    validatePlatformInput("pinterest", "createVideoPin", input);
    const raw = await pinterestRequest({
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
    return normalizeMutationResult({ platform: "pinterest", raw });
  }

  static async updatePin(input: {
    pinId: string;
    title?: string;
    description?: string;
    link?: string;
  }): Promise<PinterestMutationResult> {
    validatePlatformInput("pinterest", "updatePin", input);
    const raw = await pinterestRequest({
      endpoint: `/pins/${input.pinId}`,
      method: "PATCH",
      data: {
        title: input.title,
        description: input.description,
        link: input.link
      }
    });
    return normalizeMutationResult({
      platform: "pinterest",
      resourceId: input.pinId,
      raw
    });
  }

  static async deletePin(
    input: { pinId: string }
  ): Promise<PinterestDeleteResult> {
    validatePlatformInput("pinterest", "deletePin", input);
    const raw = await pinterestRequest({
      endpoint: `/pins/${input.pinId}`,
      method: "DELETE"
    });
    return normalizeDeleteResult({ platform: "pinterest", targetId: input.pinId, raw });
  }

  static async listPins(input: {
    boardId?: string;
    pageSize?: number;
  }): Promise<PinterestListPinsResult> {
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
  }): Promise<PinterestMutationResult> {
    validatePlatformInput("pinterest", "createBoard", input);
    const raw = await pinterestRequest({
      endpoint: "/boards",
      method: "POST",
      data: {
        name: input.name,
        description: input.description,
        privacy: input.privacy ?? "PUBLIC"
      }
    });
    return normalizeMutationResult({ platform: "pinterest", raw });
  }

  static async listBoards(
    input: { pageSize?: number }
  ): Promise<PinterestListBoardsResult> {
    validatePlatformInput("pinterest", "listBoards", input);
    return pinterestRequest({
      endpoint: "/boards",
      method: "GET",
      query: { page_size: input.pageSize ?? 25 }
    });
  }

  static async commentOnPin(input: {
    pinId: string;
    text: string;
  }): Promise<PinterestActionResult> {
    validatePlatformInput("pinterest", "commentOnPin", input);
    const raw = await pinterestRequest({
      endpoint: `/pins/${input.pinId}/comments`,
      method: "POST",
      data: { text: input.text }
    });
    return normalizeActionResult({ platform: "pinterest", action: "commentOnPin", raw });
  }

  static async replyToComment(input: {
    pinId: string;
    commentId: string;
    text: string;
  }): Promise<PinterestActionResult> {
    validatePlatformInput("pinterest", "replyToComment", input);
    const raw = await pinterestRequest({
      endpoint: `/pins/${input.pinId}/comments/${input.commentId}/replies`,
      method: "POST",
      data: { text: input.text }
    });
    return normalizeActionResult({
      platform: "pinterest",
      action: "replyToComment",
      raw
    });
  }

  static async getPinAnalytics(input: {
    pinId: string;
    startDate: string;
    endDate: string;
  }): Promise<PinterestAnalyticsResult> {
    validatePlatformInput("pinterest", "getPinAnalytics", input);
    return pinterestRequest({
      endpoint: `/pins/${input.pinId}/analytics`,
      method: "GET",
      query: { start_date: input.startDate, end_date: input.endDate }
    });
  }

  static async getAccountAnalytics(input: {
    startDate: string;
    endDate: string;
  }): Promise<PinterestAnalyticsResult> {
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
  }): Promise<PinterestMutationResult> {
    validatePlatformInput("pinterest", "schedulePin", input);
    const raw = await scheduleTask({
      id: `pinterest-schedule-${Date.now()}`,
      runAt: input.publishAt,
      task: async () =>
        Pinterest.createPin({
          title: input.title,
          mediaSourceUrl: input.mediaSourceUrl,
          boardId: input.boardId
        })
    });
    return normalizeMutationResult({ platform: "pinterest", raw });
  }
}
