import axios from "axios";
import { env } from "../config/env.js";
import { SocialError } from "../errors/SocialError.js";
import { createUploadStream, getFileMeta } from "../utils/file.js";
import { withRetries } from "../utils/retry.js";
import { scheduleTask } from "../utils/scheduler.js";
import {
  getLinkedInAccessToken,
  getLinkedInHeaders
} from "./shared/linkedinAuth.js";
import { validatePlatformInput } from "../validation/platformSchemas.js";

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
  static async createTextPost(input: { author?: string; text: string; visibility?: "PUBLIC" | "CONNECTIONS" }) {
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

  static async createImagePost(input: { author?: string; text: string; mediaUrn: string }) {
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

  static async createVideoPost(input: { author?: string; text: string; mediaUrn: string }) {
    validatePlatformInput("linkedin", "createVideoPost", input);
    return LinkedIn.createImagePost(input);
  }

  static async createCarouselPost(input: { author?: string; text: string; mediaUrns: string[] }) {
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

  static async schedulePost(input: { author?: string; text: string; publishAt: Date | string }) {
    validatePlatformInput("linkedin", "schedulePost", input);
    return scheduleTask({
      id: `linkedin-schedule-${Date.now()}`,
      runAt: input.publishAt,
      task: async () => LinkedIn.createTextPost({ author: input.author, text: input.text })
    });
  }

  static async commentOnPost(input: { actor?: string; objectUrn: string; message: string }) {
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

  static async replyToComment(input: { actor?: string; parentCommentUrn: string; message: string }) {
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

  static async deleteComment(input: { encodedCommentUrn: string }) {
    validatePlatformInput("linkedin", "deleteComment", input);
    return linkedInRequest({
      endpoint: `/socialActions/comments/${encodeURIComponent(input.encodedCommentUrn)}`,
      method: "DELETE"
    });
  }

  static async likePost(input: { actor?: string; objectUrn: string }) {
    validatePlatformInput("linkedin", "likePost", input);
    const actor = authorOrThrow(input.actor);
    return linkedInRequest({
      endpoint: "/socialActions/likes",
      method: "POST",
      data: { actor, object: input.objectUrn }
    });
  }

  static async unlikePost(input: { actorUrn?: string; encodedObjectUrn: string }) {
    validatePlatformInput("linkedin", "unlikePost", input);
    const actorUrn = authorOrThrow(input.actorUrn);
    const encodedActor = encodeURIComponent(actorUrn);
    return linkedInRequest({
      endpoint: `/socialActions/${encodeURIComponent(input.encodedObjectUrn)}/likes/${encodedActor}`,
      method: "DELETE"
    });
  }

  static async sendDirectMessage(input: { actor?: string; recipientUrn: string; text: string }) {
    validatePlatformInput("linkedin", "sendDirectMessage", input);
    const actor = authorOrThrow(input.actor);
    return linkedInRequest({
      endpoint: "/messages",
      method: "POST",
      data: {
        from: actor,
        recipients: [input.recipientUrn],
        body: input.text
      }
    });
  }

  static async getPostAnalytics(input: { postUrn: string }) {
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

  static async getOrganizationAnalytics(input: { orgUrn?: string }) {
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
  }) {
    validatePlatformInput("linkedin", "registerUpload", input);
    const owner = authorOrThrow(input.owner);
    return linkedInRequest<{
      value: {
        uploadMechanism: Record<string, unknown>;
        asset: string;
      };
    }>({
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

  static async uploadBinary(input: { uploadUrl: string; mediaPath: string }) {
    validatePlatformInput("linkedin", "uploadBinary", input);
    const { fileSize } = getFileMeta(input.mediaPath);
    await getLinkedInAccessToken();
    return withRetries({
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
  }

  static async deletePost(input: { encodedPostUrn: string }) {
    validatePlatformInput("linkedin", "deletePost", input);
    return linkedInRequest({
      endpoint: `/posts/${encodeURIComponent(input.encodedPostUrn)}`,
      method: "DELETE"
    });
  }
}
