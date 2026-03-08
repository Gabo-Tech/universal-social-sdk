import { env } from "../config/env.js";
import { SocialError } from "../errors/SocialError.js";
import { metaCall } from "./shared/metaClient.js";
import {
  normalizeActionResult,
  normalizeDeleteResult,
  normalizeMutationResult
} from "../utils/normalizedResult.js";
import { scheduleTask } from "../utils/scheduler.js";
import { validatePlatformInput } from "../validation/platformSchemas.js";
import type {
  FacebookActionResult,
  FacebookDeleteResult,
  FacebookResumableVideoResult,
  MetaInsightsResult,
  MetaListResult,
  MetaPublishResult
} from "../responseTypes.js";

function pageIdOrThrow(inputPageId?: string): string {
  const pageId = inputPageId ?? env.meta.fbPageId;
  if (!pageId) {
    throw new SocialError({
      platform: "facebook",
      endpoint: "page-id",
      message: "Missing FB_PAGE_ID (or pass pageId explicitly)."
    });
  }
  return pageId;
}

export class Facebook {
  static async publishToPage(input: {
    pageId?: string;
    message: string;
    link?: string;
    photoUrl?: string;
  }): Promise<MetaPublishResult> {
    validatePlatformInput("facebook", "publishToPage", input);
    const pageId = pageIdOrThrow(input.pageId);
    return metaCall({
      platform: "facebook",
      method: "POST",
      endpoint: `/${pageId}/feed`,
      body: {
        message: input.message,
        link: input.link,
        picture: input.photoUrl
      }
    });
  }

  static async publishPhoto(input: {
    pageId?: string;
    url: string;
    caption?: string;
  }): Promise<MetaPublishResult> {
    validatePlatformInput("facebook", "publishPhoto", input);
    const pageId = pageIdOrThrow(input.pageId);
    return metaCall({
      platform: "facebook",
      method: "POST",
      endpoint: `/${pageId}/photos`,
      body: { url: input.url, caption: input.caption }
    });
  }

  static async publishVideo(input: {
    pageId?: string;
    fileUrl: string;
    description?: string;
    title?: string;
  }): Promise<MetaPublishResult> {
    validatePlatformInput("facebook", "publishVideo", input);
    const pageId = pageIdOrThrow(input.pageId);
    return metaCall({
      platform: "facebook",
      method: "POST",
      endpoint: `/${pageId}/videos`,
      body: {
        file_url: input.fileUrl,
        description: input.description,
        title: input.title
      }
    });
  }

  static async publishCarousel(input: {
    pageId?: string;
    message: string;
    photoUrls: string[];
  }): Promise<MetaPublishResult> {
    validatePlatformInput("facebook", "publishCarousel", input);
    const pageId = pageIdOrThrow(input.pageId);
    const mediaIds: string[] = [];
    for (const url of input.photoUrls) {
      const media = (await metaCall<{ id: string }>({
        platform: "facebook",
        method: "POST",
        endpoint: `/${pageId}/photos`,
        body: { url, published: false }
      })) as { id: string };
      mediaIds.push(media.id);
    }
    return metaCall({
      platform: "facebook",
      method: "POST",
      endpoint: `/${pageId}/feed`,
      body: {
        message: input.message,
        attached_media: mediaIds.map((id) => ({ media_fbid: id }))
      }
    });
  }

  static async publishStory(input: {
    pageId?: string;
    photoUrl: string;
  }): Promise<MetaPublishResult> {
    validatePlatformInput("facebook", "publishStory", input);
    const pageId = pageIdOrThrow(input.pageId);
    return metaCall({
      platform: "facebook",
      method: "POST",
      endpoint: `/${pageId}/photo_stories`,
      body: { url: input.photoUrl }
    });
  }

  static async schedulePost(input: {
    pageId?: string;
    message: string;
    publishAt: Date | string;
  }): Promise<MetaPublishResult> {
    validatePlatformInput("facebook", "schedulePost", input);
    const pageId = pageIdOrThrow(input.pageId);
    const publishTime = Math.floor(new Date(input.publishAt).getTime() / 1000);
    return metaCall({
      platform: "facebook",
      method: "POST",
      endpoint: `/${pageId}/feed`,
      body: {
        message: input.message,
        published: false,
        scheduled_publish_time: publishTime
      }
    });
  }

  static async commentOnPost(input: {
    postId: string;
    message: string;
  }): Promise<MetaPublishResult> {
    validatePlatformInput("facebook", "commentOnPost", input);
    return metaCall({
      platform: "facebook",
      method: "POST",
      endpoint: `/${input.postId}/comments`,
      body: { message: input.message }
    });
  }

  static async replyToComment(input: {
    commentId: string;
    message: string;
  }): Promise<MetaPublishResult> {
    validatePlatformInput("facebook", "replyToComment", input);
    return metaCall({
      platform: "facebook",
      method: "POST",
      endpoint: `/${input.commentId}/comments`,
      body: { message: input.message }
    });
  }

  static async likeObject(input: {
    objectId: string;
  }): Promise<FacebookActionResult> {
    validatePlatformInput("facebook", "likeObject", input);
    const raw = await metaCall({
      platform: "facebook",
      method: "POST",
      endpoint: `/${input.objectId}/likes`
    });
    return normalizeActionResult({ platform: "facebook", action: "likeObject", raw });
  }

  static async deletePost(input: {
    objectId: string;
  }): Promise<FacebookDeleteResult> {
    validatePlatformInput("facebook", "deletePost", input);
    const raw = await metaCall({
      platform: "facebook",
      method: "DELETE",
      endpoint: `/${input.objectId}`
    });
    return normalizeDeleteResult({ platform: "facebook", targetId: input.objectId, raw });
  }

  static async sendPageMessage(input: {
    recipientPsid: string;
    message: string;
    pageId?: string;
  }): Promise<FacebookActionResult> {
    validatePlatformInput("facebook", "sendPageMessage", input);
    const pageId = pageIdOrThrow(input.pageId);
    const raw = await metaCall({
      platform: "facebook",
      method: "POST",
      endpoint: `/${pageId}/messages`,
      body: {
        recipient: { id: input.recipientPsid },
        message: { text: input.message },
        messaging_type: "RESPONSE"
      }
    });
    return normalizeActionResult({ platform: "facebook", action: "sendPageMessage", raw });
  }

  static async getPostInsights(input: {
    postId: string;
    metrics?: string[];
  }): Promise<MetaInsightsResult> {
    validatePlatformInput("facebook", "getPostInsights", input);
    return metaCall({
      platform: "facebook",
      method: "GET",
      endpoint: `/${input.postId}/insights`,
      query: { metric: (input.metrics ?? ["post_impressions", "post_engaged_users"]).join(",") }
    });
  }

  static async getPageInsights(input: {
    pageId?: string;
    metrics?: string[];
    period?: "day" | "week" | "days_28";
  }): Promise<MetaInsightsResult> {
    validatePlatformInput("facebook", "getPageInsights", input);
    const pageId = pageIdOrThrow(input.pageId);
    return metaCall({
      platform: "facebook",
      method: "GET",
      endpoint: `/${pageId}/insights`,
      query: {
        metric: (input.metrics ?? ["page_impressions", "page_engaged_users"]).join(","),
        period: input.period ?? "day"
      }
    });
  }

  static async uploadResumableVideo(input: {
    pageId?: string;
    fileSize: number;
    startOffset?: number;
  }): Promise<FacebookResumableVideoResult> {
    validatePlatformInput("facebook", "uploadResumableVideo", input);
    const pageId = pageIdOrThrow(input.pageId);
    const raw = await metaCall({
      platform: "facebook",
      method: "POST",
      endpoint: `/${pageId}/videos`,
      body: {
        upload_phase: "start",
        file_size: input.fileSize,
        start_offset: input.startOffset ?? 0
      }
    });
    return normalizeMutationResult({ platform: "facebook", raw });
  }

  static async listPublishedPosts(input: {
    pageId?: string;
    limit?: number;
  }): Promise<MetaListResult> {
    validatePlatformInput("facebook", "listPublishedPosts", input);
    const pageId = pageIdOrThrow(input.pageId);
    return metaCall({
      platform: "facebook",
      method: "GET",
      endpoint: `/${pageId}/published_posts`,
      query: { limit: input.limit ?? 25 }
    });
  }

  static async scheduleInProcess<T>(input: {
    publishAt: Date | string;
    action: () => Promise<T>;
  }): Promise<T> {
    return scheduleTask({
      id: `facebook-schedule-${Date.now()}`,
      runAt: input.publishAt,
      task: input.action
    });
  }
}
