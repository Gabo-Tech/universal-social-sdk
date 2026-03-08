import { env } from "../config/env.js";
import { SocialError } from "../errors/SocialError.js";
import { metaCall } from "./shared/metaClient.js";
import { scheduleTask } from "../utils/scheduler.js";
import { validatePlatformInput } from "../validation/platformSchemas.js";

function igUserIdOrThrow(inputUserId?: string): string {
  const igUserId = inputUserId ?? env.meta.igUserId;
  if (!igUserId) {
    throw new SocialError({
      platform: "instagram",
      endpoint: "ig-user-id",
      message: "Missing IG_USER_ID (or pass igUserId explicitly)."
    });
  }
  return igUserId;
}

async function createMediaContainer(params: {
  igUserId: string;
  imageUrl?: string;
  videoUrl?: string;
  caption?: string;
  mediaType?: "IMAGE" | "VIDEO" | "REELS" | "STORIES";
  isCarouselItem?: boolean;
  children?: string[];
}): Promise<{ id: string }> {
  return metaCall<{ id: string }>({
    platform: "instagram",
    method: "POST",
    endpoint: `/${params.igUserId}/media`,
    body: {
      image_url: params.imageUrl,
      video_url: params.videoUrl,
      caption: params.caption,
      media_type: params.mediaType,
      is_carousel_item: params.isCarouselItem,
      children: params.children
    }
  });
}

async function publishContainer(igUserId: string, creationId: string) {
  return metaCall({
    platform: "instagram",
    method: "POST",
    endpoint: `/${igUserId}/media_publish`,
    body: { creation_id: creationId }
  });
}

export class Instagram {
  static async uploadPhoto(input: { igUserId?: string; imageUrl: string; caption?: string }) {
    validatePlatformInput("instagram", "uploadPhoto", input);
    const igUserId = igUserIdOrThrow(input.igUserId);
    const container = await createMediaContainer({
      igUserId,
      imageUrl: input.imageUrl,
      caption: input.caption,
      mediaType: "IMAGE"
    });
    return publishContainer(igUserId, container.id);
  }

  static async uploadVideo(input: { igUserId?: string; videoUrl: string; caption?: string }) {
    validatePlatformInput("instagram", "uploadVideo", input);
    const igUserId = igUserIdOrThrow(input.igUserId);
    const container = await createMediaContainer({
      igUserId,
      videoUrl: input.videoUrl,
      caption: input.caption,
      mediaType: "VIDEO"
    });
    return publishContainer(igUserId, container.id);
  }

  static async uploadReel(input: { igUserId?: string; mediaPath?: string; videoUrl: string; caption?: string }) {
    validatePlatformInput("instagram", "uploadReel", input);
    const igUserId = igUserIdOrThrow(input.igUserId);
    const container = await createMediaContainer({
      igUserId,
      videoUrl: input.videoUrl,
      caption: input.caption,
      mediaType: "REELS"
    });
    return publishContainer(igUserId, container.id);
  }

  static async uploadStoryPhoto(input: { igUserId?: string; imageUrl: string }) {
    validatePlatformInput("instagram", "uploadStoryPhoto", input);
    const igUserId = igUserIdOrThrow(input.igUserId);
    const container = await createMediaContainer({
      igUserId,
      imageUrl: input.imageUrl,
      mediaType: "STORIES"
    });
    return publishContainer(igUserId, container.id);
  }

  static async uploadStoryVideo(input: { igUserId?: string; videoUrl: string }) {
    validatePlatformInput("instagram", "uploadStoryVideo", input);
    const igUserId = igUserIdOrThrow(input.igUserId);
    const container = await createMediaContainer({
      igUserId,
      videoUrl: input.videoUrl,
      mediaType: "STORIES"
    });
    return publishContainer(igUserId, container.id);
  }

  static async publishCarousel(input: {
    igUserId?: string;
    caption?: string;
    items: Array<{ imageUrl?: string; videoUrl?: string }>;
  }) {
    validatePlatformInput("instagram", "publishCarousel", input);
    const igUserId = igUserIdOrThrow(input.igUserId);
    const children: string[] = [];
    for (const item of input.items) {
      const child = await createMediaContainer({
        igUserId,
        imageUrl: item.imageUrl,
        videoUrl: item.videoUrl,
        isCarouselItem: true
      });
      children.push(child.id);
    }
    const parent = await createMediaContainer({
      igUserId,
      caption: input.caption,
      mediaType: "IMAGE",
      children
    });
    return publishContainer(igUserId, parent.id);
  }

  static async commentOnMedia(input: { mediaId: string; message: string }) {
    validatePlatformInput("instagram", "commentOnMedia", input);
    return metaCall({
      platform: "instagram",
      method: "POST",
      endpoint: `/${input.mediaId}/comments`,
      body: { message: input.message }
    });
  }

  static async replyToComment(input: { commentId: string; message: string }) {
    validatePlatformInput("instagram", "replyToComment", input);
    return metaCall({
      platform: "instagram",
      method: "POST",
      endpoint: `/${input.commentId}/replies`,
      body: { message: input.message }
    });
  }

  static async hideComment(input: { commentId: string; hide: boolean }) {
    validatePlatformInput("instagram", "hideComment", input);
    return metaCall({
      platform: "instagram",
      method: "POST",
      endpoint: `/${input.commentId}`,
      body: { hidden: input.hide }
    });
  }

  static async deleteComment(input: { commentId: string }) {
    validatePlatformInput("instagram", "deleteComment", input);
    return metaCall({
      platform: "instagram",
      method: "DELETE",
      endpoint: `/${input.commentId}`
    });
  }

  static async deleteMedia(input: { mediaId: string }) {
    validatePlatformInput("instagram", "deleteMedia", input);
    return metaCall({
      platform: "instagram",
      method: "DELETE",
      endpoint: `/${input.mediaId}`
    });
  }

  static async sendPrivateReply(input: { commentId: string; message: string }) {
    validatePlatformInput("instagram", "sendPrivateReply", input);
    return metaCall({
      platform: "instagram",
      method: "POST",
      endpoint: `/${input.commentId}/private_replies`,
      body: { message: input.message }
    });
  }

  static async getMediaInsights(input: { mediaId: string; metrics?: string[] }) {
    validatePlatformInput("instagram", "getMediaInsights", input);
    return metaCall({
      platform: "instagram",
      method: "GET",
      endpoint: `/${input.mediaId}/insights`,
      query: { metric: (input.metrics ?? ["impressions", "reach", "saved", "video_views"]).join(",") }
    });
  }

  static async getAccountInsights(input: { igUserId?: string; metrics?: string[]; period?: "day" | "week" | "days_28" }) {
    validatePlatformInput("instagram", "getAccountInsights", input);
    const igUserId = igUserIdOrThrow(input.igUserId);
    return metaCall({
      platform: "instagram",
      method: "GET",
      endpoint: `/${igUserId}/insights`,
      query: {
        metric: (input.metrics ?? ["impressions", "reach", "profile_views"]).join(","),
        period: input.period ?? "day"
      }
    });
  }

  static async getPublishingLimit(input: { igUserId?: string }) {
    validatePlatformInput("instagram", "getPublishingLimit", input);
    const igUserId = igUserIdOrThrow(input.igUserId);
    return metaCall({
      platform: "instagram",
      method: "GET",
      endpoint: `/${igUserId}/content_publishing_limit`,
      query: { fields: "quota_usage,config" }
    });
  }

  static async scheduleReel(input: { igUserId?: string; videoUrl: string; caption?: string; publishAt: Date | string }) {
    validatePlatformInput("instagram", "scheduleReel", input);
    const igUserId = igUserIdOrThrow(input.igUserId);
    return scheduleTask({
      id: `ig-schedule-${Date.now()}`,
      runAt: input.publishAt,
      task: async () =>
        Instagram.uploadReel({
          igUserId,
          videoUrl: input.videoUrl,
          caption: input.caption
        })
    });
  }
}
