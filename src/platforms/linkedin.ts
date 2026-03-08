import axios from "axios";
import { env } from "../config/env.js";
import { SocialError } from "../errors/SocialError.js";
import { createUploadStream, getFileMeta } from "../utils/file.js";
import {
  normalizeActionResult,
  normalizeDeleteResult
} from "../utils/normalizedResult.js";
import { withRetries } from "../utils/retry.js";
import { scheduleTask } from "../utils/scheduler.js";
import {
  getLinkedInAccessToken,
  getLinkedInHeaders
} from "./shared/linkedinAuth.js";
import { validatePlatformInput } from "../validation/platformSchemas.js";
import type {
  LinkedInActionResult,
  LinkedInAnalyticsResult,
  LinkedInBinaryUploadResult,
  LinkedInDeleteResult,
  LinkedInPostResult,
  LinkedInUploadRegistrationResult
} from "../responseTypes.js";

const BASE_URL = "https://api.linkedin.com/rest";

function authorOrThrow(author?: string): string {
  const resolved = author ?? env.linkedin.orgUrn ?? env.linkedin.personUrn;
  if (!resolved) {
    throw new SocialError({
      platform: "linkedin",
      endpoint: "author",
      message:
        "Missing LinkedIn author URN. Set LINKEDIN_ORG_URN or LINKEDIN_PERSON_URN or pass author."
    });
  }
  return resolved;
}

async function linkedInRequest<T = unknown>(params: {
  endpoint: string;
  method: "GET" | "POST" | "DELETE";
  data?: unknown;
  query?: Record<string, string | number>;
  headers?: Record<string, string>;
}): Promise<T> {
  await getLinkedInAccessToken();
  return withRetries({
    platform: "linkedin",
    endpoint: params.endpoint,
    execute: async () => {
      try {
        const response = await axios.request<T>({
          url: `${BASE_URL}${params.endpoint}`,
          method: params.method,
          params: params.query,
          data: params.data,
          headers: { ...getLinkedInHeaders(), ...(params.headers ?? {}) }
        });
        return response.data;
      } catch (error) {
        throw SocialError.normalize({
          platform: "linkedin",
          endpoint: params.endpoint,
          error
        });
      }
    }
  });
}

export class LinkedIn {
  static async createTextPost(input: {
    author?: string;
    text: string;
    visibility?: "PUBLIC" | "CONNECTIONS";
  }): Promise<LinkedInPostResult> {
    validatePlatformInput("linkedin", "createTextPost", input);
    const author = authorOrThrow(input.author);
    return linkedInRequest({
      endpoint: "/posts",
      method: "POST",
      data: {
        author,
        commentary: input.text,
        visibility: input.visibility ?? "PUBLIC",
        distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false
      }
    });
  }

  static async createImagePost(input: {
    author?: string;
    text: string;
    mediaUrn: string;
  }): Promise<LinkedInPostResult> {
    validatePlatformInput("linkedin", "createImagePost", input);
    const author = authorOrThrow(input.author);
    return linkedInRequest({
      endpoint: "/posts",
      method: "POST",
      data: {
        author,
        commentary: input.text,
        visibility: "PUBLIC",
        content: { media: { id: input.mediaUrn } },
        lifecycleState: "PUBLISHED"
      }
    });
  }

  static async createVideoPost(input: {
    author?: string;
    text: string;
    mediaUrn: string;
  }): Promise<LinkedInPostResult> {
    validatePlatformInput("linkedin", "createVideoPost", input);
    return LinkedIn.createImagePost(input);
  }

  static async createCarouselPost(input: {
    author?: string;
    text: string;
    mediaUrns: string[];
  }): Promise<LinkedInPostResult> {
    validatePlatformInput("linkedin", "createCarouselPost", input);
    const author = authorOrThrow(input.author);
    return linkedInRequest({
      endpoint: "/posts",
      method: "POST",
      data: {
        author,
        commentary: input.text,
        visibility: "PUBLIC",
        content: {
          multiImage: {
            images: input.mediaUrns.map((urn) => ({ id: urn }))
          }
        },
        lifecycleState: "PUBLISHED"
      }
    });
  }

  static async schedulePost(input: {
    author?: string;
    text: string;
    publishAt: Date | string;
  }): Promise<LinkedInPostResult> {
    validatePlatformInput("linkedin", "schedulePost", input);
    return scheduleTask({
      id: `linkedin-schedule-${Date.now()}`,
      runAt: input.publishAt,
      task: async () => LinkedIn.createTextPost({ author: input.author, text: input.text })
    });
  }

  static async commentOnPost(input: {
    actor?: string;
    objectUrn: string;
    message: string;
  }): Promise<LinkedInPostResult> {
    validatePlatformInput("linkedin", "commentOnPost", input);
    const actor = authorOrThrow(input.actor);
    return linkedInRequest({
      endpoint: "/socialActions/comments",
      method: "POST",
      data: {
        actor,
        object: input.objectUrn,
        message: { text: input.message }
      }
    });
  }

  static async replyToComment(input: {
    actor?: string;
    parentCommentUrn: string;
    message: string;
  }): Promise<LinkedInPostResult> {
    validatePlatformInput("linkedin", "replyToComment", input);
    const actor = authorOrThrow(input.actor);
    return linkedInRequest({
      endpoint: "/socialActions/comments",
      method: "POST",
      data: {
        actor,
        object: input.parentCommentUrn,
        message: { text: input.message }
      }
    });
  }

  static async deleteComment(input: {
    encodedCommentUrn: string;
  }): Promise<LinkedInDeleteResult> {
    validatePlatformInput("linkedin", "deleteComment", input);
    const raw = await linkedInRequest({
      endpoint: `/socialActions/comments/${encodeURIComponent(input.encodedCommentUrn)}`,
      method: "DELETE"
    });
    return normalizeDeleteResult({
      platform: "linkedin",
      targetId: input.encodedCommentUrn,
      raw
    });
  }

  static async likePost(input: {
    actor?: string;
    objectUrn: string;
  }): Promise<LinkedInActionResult> {
    validatePlatformInput("linkedin", "likePost", input);
    const actor = authorOrThrow(input.actor);
    const raw = await linkedInRequest({
      endpoint: "/socialActions/likes",
      method: "POST",
      data: { actor, object: input.objectUrn }
    });
    return normalizeActionResult({ platform: "linkedin", action: "likePost", raw });
  }

  static async unlikePost(input: {
    actorUrn?: string;
    encodedObjectUrn: string;
  }): Promise<LinkedInDeleteResult> {
    validatePlatformInput("linkedin", "unlikePost", input);
    const actorUrn = authorOrThrow(input.actorUrn);
    const encodedActor = encodeURIComponent(actorUrn);
    const raw = await linkedInRequest({
      endpoint: `/socialActions/${encodeURIComponent(input.encodedObjectUrn)}/likes/${encodedActor}`,
      method: "DELETE"
    });
    return normalizeDeleteResult({
      platform: "linkedin",
      targetId: input.encodedObjectUrn,
      raw
    });
  }

  static async sendDirectMessage(input: {
    actor?: string;
    recipientUrn: string;
    text: string;
  }): Promise<LinkedInActionResult> {
    validatePlatformInput("linkedin", "sendDirectMessage", input);
    const actor = authorOrThrow(input.actor);
    const raw = await linkedInRequest({
      endpoint: "/messages",
      method: "POST",
      data: {
        from: actor,
        recipients: [input.recipientUrn],
        body: input.text
      }
    });
    return normalizeActionResult({ platform: "linkedin", action: "sendDirectMessage", raw });
  }

  static async getPostAnalytics(
    input: { postUrn: string }
  ): Promise<LinkedInAnalyticsResult> {
    validatePlatformInput("linkedin", "getPostAnalytics", input);
    return linkedInRequest({
      endpoint: "/organizationalEntityShareStatistics",
      method: "GET",
      query: {
        q: "organizationalEntity",
        organizationalEntity: input.postUrn
      }
    });
  }

  static async getOrganizationAnalytics(
    input: { orgUrn?: string }
  ): Promise<LinkedInAnalyticsResult> {
    validatePlatformInput("linkedin", "getOrganizationAnalytics", input);
    const orgUrn = input.orgUrn ?? env.linkedin.orgUrn;
    if (!orgUrn) {
      throw new SocialError({
        platform: "linkedin",
        endpoint: "organization-analytics",
        message: "Missing LINKEDIN_ORG_URN or orgUrn input."
      });
    }
    return linkedInRequest({
      endpoint: "/organizationalEntityFollowerStatistics",
      method: "GET",
      query: { q: "organizationalEntity", organizationalEntity: orgUrn }
    });
  }

  static async registerUpload(input: {
    owner?: string;
    mediaType: "image" | "video";
    fileSize: number;
  }): Promise<LinkedInUploadRegistrationResult> {
    validatePlatformInput("linkedin", "registerUpload", input);
    const owner = authorOrThrow(input.owner);
    return linkedInRequest<LinkedInUploadRegistrationResult>({
      endpoint: "/assets?action=registerUpload",
      method: "POST",
      data: {
        registerUploadRequest: {
          recipes:
            input.mediaType === "image"
              ? ["urn:li:digitalmediaRecipe:feedshare-image"]
              : ["urn:li:digitalmediaRecipe:feedshare-video"],
          owner,
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent"
            }
          ],
          supportedUploadMechanism: ["SYNCHRONOUS_UPLOAD"]
        }
      }
    });
  }

  static async uploadBinary(input: {
    uploadUrl: string;
    mediaPath: string;
  }): Promise<LinkedInBinaryUploadResult> {
    validatePlatformInput("linkedin", "uploadBinary", input);
    const { fileSize } = getFileMeta(input.mediaPath);
    await getLinkedInAccessToken();
    await withRetries({
      platform: "linkedin",
      endpoint: "uploadBinary",
      execute: async () =>
        axios.put(input.uploadUrl, createUploadStream(input.mediaPath), {
          maxBodyLength: Infinity,
          headers: {
            Authorization: getLinkedInHeaders().Authorization,
            "Content-Length": String(fileSize)
          }
        })
    });
    return { bytesUploaded: fileSize };
  }

  static async deletePost(input: {
    encodedPostUrn: string;
  }): Promise<LinkedInDeleteResult> {
    validatePlatformInput("linkedin", "deletePost", input);
    const raw = await linkedInRequest({
      endpoint: `/posts/${encodeURIComponent(input.encodedPostUrn)}`,
      method: "DELETE"
    });
    return normalizeDeleteResult({
      platform: "linkedin",
      targetId: input.encodedPostUrn,
      raw
    });
  }
}
