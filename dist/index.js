// src/config/env.ts
import dotenv from "dotenv";
dotenv.config();
function readNumberEnv(name, fallback) {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
var env = {
  x: {
    apiKey: process.env.X_API_KEY ?? "",
    apiSecret: process.env.X_API_SECRET ?? "",
    accessToken: process.env.X_ACCESS_TOKEN ?? "",
    accessSecret: process.env.X_ACCESS_SECRET ?? "",
    bearerToken: process.env.X_BEARER_TOKEN ?? "",
    clientId: process.env.X_CLIENT_ID ?? "",
    clientSecret: process.env.X_CLIENT_SECRET ?? ""
  },
  meta: {
    appId: process.env.META_APP_ID ?? "",
    appSecret: process.env.META_APP_SECRET ?? "",
    graphVersion: process.env.META_GRAPH_VERSION ?? "v21.0",
    fbPageToken: process.env.FB_PAGE_ACCESS_TOKEN ?? "",
    fbPageId: process.env.FB_PAGE_ID ?? "",
    igToken: process.env.IG_ACCESS_TOKEN ?? "",
    igUserId: process.env.IG_USER_ID ?? ""
  },
  linkedin: {
    accessToken: process.env.LINKEDIN_ACCESS_TOKEN ?? "",
    refreshToken: process.env.LINKEDIN_REFRESH_TOKEN ?? "",
    clientId: process.env.LINKEDIN_CLIENT_ID ?? "",
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
    orgUrn: process.env.LINKEDIN_ORG_URN ?? "",
    personUrn: process.env.LINKEDIN_PERSON_URN ?? "",
    apiVersion: process.env.LINKEDIN_API_VERSION ?? "202510"
  },
  retry: {
    maxRetries: readNumberEnv("SOCIAL_SDK_MAX_RETRIES", 3),
    baseDelayMs: readNumberEnv("SOCIAL_SDK_RETRY_BASE_MS", 500)
  },
  ollama: {
    host: process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434",
    model: process.env.OLLAMA_MODEL ?? "llama3.2:3b"
  }
};

// src/errors/SocialError.ts
var SocialError = class _SocialError extends Error {
  platform;
  endpoint;
  statusCode;
  details;
  cause;
  constructor(params) {
    super(params.message);
    this.name = "SocialError";
    this.platform = params.platform;
    this.endpoint = params.endpoint;
    this.statusCode = params.statusCode;
    this.details = params.details;
    this.cause = params.cause;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      platform: this.platform,
      endpoint: this.endpoint,
      statusCode: this.statusCode,
      details: this.details
    };
  }
  static normalize(params) {
    const { platform, endpoint, error } = params;
    if (error instanceof _SocialError) {
      return error;
    }
    if (error && typeof error === "object") {
      const maybeAny = error;
      const response = maybeAny.response;
      const message = maybeAny.message ?? "Unknown platform SDK error";
      return new _SocialError({
        platform,
        endpoint,
        message,
        statusCode: response?.status,
        details: response && typeof response === "object" ? {
          data: response.data,
          status: response.status,
          headers: maybeAny.response?.headers
        } : error,
        cause: error
      });
    }
    return new _SocialError({
      platform,
      endpoint,
      message: String(error ?? "Unknown error"),
      cause: error
    });
  }
};

// src/platforms/shared/metaClient.ts
import bizSdk from "facebook-nodejs-business-sdk";

// src/utils/retry.ts
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function parseRetryAfterMs(details) {
  if (!details || typeof details !== "object") {
    return null;
  }
  const maybe = details;
  const headers = maybe.headers;
  if (!headers || typeof headers !== "object") {
    return null;
  }
  const retryAfterRaw = headers["retry-after"];
  if (typeof retryAfterRaw !== "string" && typeof retryAfterRaw !== "number") {
    return null;
  }
  const seconds = Number(retryAfterRaw);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 1e3);
  }
  return null;
}
function isRetryableStatus(code) {
  if (!code) {
    return false;
  }
  return code === 429 || code >= 500 && code <= 599;
}
async function withRetries(params) {
  const retries = params.retries ?? env.retry.maxRetries;
  const baseDelayMs = params.baseDelayMs ?? env.retry.baseDelayMs;
  let attempt = 0;
  let lastError;
  while (attempt <= retries) {
    try {
      return await params.execute();
    } catch (error) {
      lastError = error;
      const normalized = SocialError.normalize({
        platform: params.platform,
        endpoint: params.endpoint,
        error
      });
      if (!isRetryableStatus(normalized.statusCode) || attempt === retries) {
        throw normalized;
      }
      const backoffMs = baseDelayMs * 2 ** attempt;
      const jitterMs = Math.floor(Math.random() * Math.max(50, baseDelayMs));
      const retryAfterMs = parseRetryAfterMs(normalized.details) ?? backoffMs + jitterMs;
      await sleep(retryAfterMs);
      attempt += 1;
    }
  }
  throw SocialError.normalize({
    platform: params.platform,
    endpoint: params.endpoint,
    error: lastError
  });
}

// src/platforms/shared/metaClient.ts
var { FacebookAdsApi } = bizSdk;
var didInit = false;
function ensureInit() {
  if (!didInit) {
    const token = env.meta.fbPageToken || env.meta.igToken;
    if (!token) {
      throw new SocialError({
        platform: "facebook",
        endpoint: "meta:init",
        message: "Missing FB_PAGE_ACCESS_TOKEN or IG_ACCESS_TOKEN for Meta SDK initialization."
      });
    }
    FacebookAdsApi.init(token);
    didInit = true;
  }
}
async function metaCall(params) {
  ensureInit();
  const api = FacebookAdsApi.getDefaultApi();
  const endpointPath = `/${env.meta.graphVersion}${params.endpoint}`;
  return withRetries({
    platform: params.platform,
    endpoint: endpointPath,
    execute: async () => {
      try {
        return await api.call(
          params.method,
          endpointPath,
          params.query ?? {},
          params.body ?? {}
        );
      } catch (error) {
        throw SocialError.normalize({
          platform: params.platform,
          endpoint: endpointPath,
          error
        });
      }
    }
  });
}

// src/utils/scheduler.ts
var scheduledJobs = /* @__PURE__ */ new Map();
function toDate(value) {
  if (value instanceof Date) {
    return value;
  }
  return new Date(value);
}
function scheduleTask(params) {
  const runAt = toDate(params.runAt).getTime();
  const delay = Math.max(0, runAt - Date.now());
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(async () => {
      scheduledJobs.delete(params.id);
      try {
        resolve(await params.task());
      } catch (error) {
        reject(error);
      }
    }, delay);
    scheduledJobs.set(params.id, timeout);
  });
}

// src/validation/platformSchemas.ts
import { z } from "zod";
var nonEmpty = z.string().min(1);
var optionalNonEmpty = nonEmpty.optional();
var dateLike = z.union([z.date(), z.string().min(1)]);
var schemaMap = {
  x: {
    postTweet: z.object({ text: nonEmpty, mediaIds: z.array(nonEmpty).optional() }),
    postThread: z.object({ tweets: z.array(nonEmpty).min(1) }),
    replyTweet: z.object({ text: nonEmpty, inReplyToTweetId: nonEmpty }),
    quoteTweet: z.object({ text: nonEmpty, quoteTweetId: nonEmpty }),
    deleteTweet: z.object({ tweetId: nonEmpty }),
    retweet: z.object({ userId: nonEmpty, tweetId: nonEmpty }),
    unretweet: z.object({ userId: nonEmpty, tweetId: nonEmpty }),
    likeTweet: z.object({ userId: nonEmpty, tweetId: nonEmpty }),
    unlikeTweet: z.object({ userId: nonEmpty, tweetId: nonEmpty }),
    uploadMedia: z.object({ mediaPath: nonEmpty }),
    postPhoto: z.object({ mediaPath: nonEmpty, text: nonEmpty }),
    postVideo: z.object({ mediaPath: nonEmpty, text: nonEmpty }),
    postPoll: z.object({
      text: nonEmpty,
      options: z.array(nonEmpty).min(2).max(4),
      durationMinutes: z.number().int().min(5).max(10080)
    }),
    sendDirectMessage: z.object({ recipientId: nonEmpty, text: nonEmpty }),
    getTweetAnalytics: z.object({ tweetId: nonEmpty }),
    scheduleTweet: z.object({ text: nonEmpty, publishAt: dateLike })
  },
  facebook: {
    publishToPage: z.object({
      pageId: optionalNonEmpty,
      message: nonEmpty,
      link: optionalNonEmpty,
      photoUrl: optionalNonEmpty
    }),
    publishPhoto: z.object({ pageId: optionalNonEmpty, url: nonEmpty, caption: optionalNonEmpty }),
    publishVideo: z.object({
      pageId: optionalNonEmpty,
      fileUrl: nonEmpty,
      description: optionalNonEmpty,
      title: optionalNonEmpty
    }),
    publishCarousel: z.object({
      pageId: optionalNonEmpty,
      message: nonEmpty,
      photoUrls: z.array(nonEmpty).min(2)
    }),
    publishStory: z.object({ pageId: optionalNonEmpty, photoUrl: nonEmpty }),
    schedulePost: z.object({ pageId: optionalNonEmpty, message: nonEmpty, publishAt: dateLike }),
    commentOnPost: z.object({ postId: nonEmpty, message: nonEmpty }),
    replyToComment: z.object({ commentId: nonEmpty, message: nonEmpty }),
    likeObject: z.object({ objectId: nonEmpty }),
    deletePost: z.object({ objectId: nonEmpty }),
    sendPageMessage: z.object({ recipientPsid: nonEmpty, message: nonEmpty, pageId: optionalNonEmpty }),
    getPostInsights: z.object({ postId: nonEmpty, metrics: z.array(nonEmpty).optional() }),
    getPageInsights: z.object({
      pageId: optionalNonEmpty,
      metrics: z.array(nonEmpty).optional(),
      period: z.enum(["day", "week", "days_28"]).optional()
    }),
    uploadResumableVideo: z.object({
      pageId: optionalNonEmpty,
      fileSize: z.number().int().positive(),
      startOffset: z.number().int().nonnegative().optional()
    }),
    listPublishedPosts: z.object({
      pageId: optionalNonEmpty,
      limit: z.number().int().positive().optional()
    })
  },
  instagram: {
    uploadPhoto: z.object({ igUserId: optionalNonEmpty, imageUrl: nonEmpty, caption: optionalNonEmpty }),
    uploadVideo: z.object({ igUserId: optionalNonEmpty, videoUrl: nonEmpty, caption: optionalNonEmpty }),
    uploadReel: z.object({
      igUserId: optionalNonEmpty,
      mediaPath: optionalNonEmpty,
      videoUrl: nonEmpty,
      caption: optionalNonEmpty
    }),
    uploadStoryPhoto: z.object({ igUserId: optionalNonEmpty, imageUrl: nonEmpty }),
    uploadStoryVideo: z.object({ igUserId: optionalNonEmpty, videoUrl: nonEmpty }),
    publishCarousel: z.object({
      igUserId: optionalNonEmpty,
      caption: optionalNonEmpty,
      items: z.array(z.object({ imageUrl: optionalNonEmpty, videoUrl: optionalNonEmpty })).min(2)
    }),
    commentOnMedia: z.object({ mediaId: nonEmpty, message: nonEmpty }),
    replyToComment: z.object({ commentId: nonEmpty, message: nonEmpty }),
    hideComment: z.object({ commentId: nonEmpty, hide: z.boolean() }),
    deleteComment: z.object({ commentId: nonEmpty }),
    deleteMedia: z.object({ mediaId: nonEmpty }),
    sendPrivateReply: z.object({ commentId: nonEmpty, message: nonEmpty }),
    getMediaInsights: z.object({ mediaId: nonEmpty, metrics: z.array(nonEmpty).optional() }),
    getAccountInsights: z.object({
      igUserId: optionalNonEmpty,
      metrics: z.array(nonEmpty).optional(),
      period: z.enum(["day", "week", "days_28"]).optional()
    }),
    getPublishingLimit: z.object({ igUserId: optionalNonEmpty }),
    scheduleReel: z.object({
      igUserId: optionalNonEmpty,
      videoUrl: nonEmpty,
      caption: optionalNonEmpty,
      publishAt: dateLike
    })
  },
  linkedin: {
    createTextPost: z.object({
      author: optionalNonEmpty,
      text: nonEmpty,
      visibility: z.enum(["PUBLIC", "CONNECTIONS"]).optional()
    }),
    createImagePost: z.object({ author: optionalNonEmpty, text: nonEmpty, mediaUrn: nonEmpty }),
    createVideoPost: z.object({ author: optionalNonEmpty, text: nonEmpty, mediaUrn: nonEmpty }),
    createCarouselPost: z.object({
      author: optionalNonEmpty,
      text: nonEmpty,
      mediaUrns: z.array(nonEmpty).min(2)
    }),
    schedulePost: z.object({ author: optionalNonEmpty, text: nonEmpty, publishAt: dateLike }),
    commentOnPost: z.object({ actor: optionalNonEmpty, objectUrn: nonEmpty, message: nonEmpty }),
    replyToComment: z.object({
      actor: optionalNonEmpty,
      parentCommentUrn: nonEmpty,
      message: nonEmpty
    }),
    deleteComment: z.object({ encodedCommentUrn: nonEmpty }),
    likePost: z.object({ actor: optionalNonEmpty, objectUrn: nonEmpty }),
    unlikePost: z.object({ actorUrn: optionalNonEmpty, encodedObjectUrn: nonEmpty }),
    sendDirectMessage: z.object({
      actor: optionalNonEmpty,
      recipientUrn: nonEmpty,
      text: nonEmpty
    }),
    getPostAnalytics: z.object({ postUrn: nonEmpty }),
    getOrganizationAnalytics: z.object({ orgUrn: optionalNonEmpty }),
    registerUpload: z.object({
      owner: optionalNonEmpty,
      mediaType: z.enum(["image", "video"]),
      fileSize: z.number().int().positive()
    }),
    uploadBinary: z.object({ uploadUrl: nonEmpty, mediaPath: nonEmpty }),
    deletePost: z.object({ encodedPostUrn: nonEmpty })
  }
};
function validatePlatformInput(platform, method, input) {
  const schema = schemaMap[platform][method];
  const result = schema.safeParse(input);
  if (result.success) {
    return result.data;
  }
  throw new SocialError({
    platform,
    endpoint: `${platform}.${method}`,
    message: `Invalid input for ${platform}.${method}`,
    details: result.error.flatten()
  });
}

// src/platforms/instagram.ts
function igUserIdOrThrow(inputUserId) {
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
async function createMediaContainer(params) {
  return metaCall({
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
async function publishContainer(igUserId, creationId) {
  return metaCall({
    platform: "instagram",
    method: "POST",
    endpoint: `/${igUserId}/media_publish`,
    body: { creation_id: creationId }
  });
}
var Instagram = class _Instagram {
  static async uploadPhoto(input) {
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
  static async uploadVideo(input) {
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
  static async uploadReel(input) {
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
  static async uploadStoryPhoto(input) {
    validatePlatformInput("instagram", "uploadStoryPhoto", input);
    const igUserId = igUserIdOrThrow(input.igUserId);
    const container = await createMediaContainer({
      igUserId,
      imageUrl: input.imageUrl,
      mediaType: "STORIES"
    });
    return publishContainer(igUserId, container.id);
  }
  static async uploadStoryVideo(input) {
    validatePlatformInput("instagram", "uploadStoryVideo", input);
    const igUserId = igUserIdOrThrow(input.igUserId);
    const container = await createMediaContainer({
      igUserId,
      videoUrl: input.videoUrl,
      mediaType: "STORIES"
    });
    return publishContainer(igUserId, container.id);
  }
  static async publishCarousel(input) {
    validatePlatformInput("instagram", "publishCarousel", input);
    const igUserId = igUserIdOrThrow(input.igUserId);
    const children = [];
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
  static async commentOnMedia(input) {
    validatePlatformInput("instagram", "commentOnMedia", input);
    return metaCall({
      platform: "instagram",
      method: "POST",
      endpoint: `/${input.mediaId}/comments`,
      body: { message: input.message }
    });
  }
  static async replyToComment(input) {
    validatePlatformInput("instagram", "replyToComment", input);
    return metaCall({
      platform: "instagram",
      method: "POST",
      endpoint: `/${input.commentId}/replies`,
      body: { message: input.message }
    });
  }
  static async hideComment(input) {
    validatePlatformInput("instagram", "hideComment", input);
    return metaCall({
      platform: "instagram",
      method: "POST",
      endpoint: `/${input.commentId}`,
      body: { hidden: input.hide }
    });
  }
  static async deleteComment(input) {
    validatePlatformInput("instagram", "deleteComment", input);
    return metaCall({
      platform: "instagram",
      method: "DELETE",
      endpoint: `/${input.commentId}`
    });
  }
  static async deleteMedia(input) {
    validatePlatformInput("instagram", "deleteMedia", input);
    return metaCall({
      platform: "instagram",
      method: "DELETE",
      endpoint: `/${input.mediaId}`
    });
  }
  static async sendPrivateReply(input) {
    validatePlatformInput("instagram", "sendPrivateReply", input);
    return metaCall({
      platform: "instagram",
      method: "POST",
      endpoint: `/${input.commentId}/private_replies`,
      body: { message: input.message }
    });
  }
  static async getMediaInsights(input) {
    validatePlatformInput("instagram", "getMediaInsights", input);
    return metaCall({
      platform: "instagram",
      method: "GET",
      endpoint: `/${input.mediaId}/insights`,
      query: { metric: (input.metrics ?? ["impressions", "reach", "saved", "video_views"]).join(",") }
    });
  }
  static async getAccountInsights(input) {
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
  static async getPublishingLimit(input) {
    validatePlatformInput("instagram", "getPublishingLimit", input);
    const igUserId = igUserIdOrThrow(input.igUserId);
    return metaCall({
      platform: "instagram",
      method: "GET",
      endpoint: `/${igUserId}/content_publishing_limit`,
      query: { fields: "quota_usage,config" }
    });
  }
  static async scheduleReel(input) {
    validatePlatformInput("instagram", "scheduleReel", input);
    const igUserId = igUserIdOrThrow(input.igUserId);
    return scheduleTask({
      id: `ig-schedule-${Date.now()}`,
      runAt: input.publishAt,
      task: async () => _Instagram.uploadReel({
        igUserId,
        videoUrl: input.videoUrl,
        caption: input.caption
      })
    });
  }
};

// src/platforms/x.ts
import { TwitterApi } from "twitter-api-v2";

// src/utils/file.ts
import { createReadStream, statSync } from "fs";
import path from "path";
function getFileMeta(filePath) {
  const stat = statSync(filePath);
  return {
    fileName: path.basename(filePath),
    fileSize: stat.size
  };
}
function createUploadStream(filePath) {
  return createReadStream(filePath);
}

// src/platforms/x.ts
var client = null;
function getClient() {
  if (client) {
    return client;
  }
  if (!env.x.apiKey || !env.x.apiSecret || !env.x.accessToken || !env.x.accessSecret) {
    throw new SocialError({
      platform: "x",
      endpoint: "auth",
      message: "Missing X credentials. Required: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET."
    });
  }
  client = new TwitterApi({
    appKey: env.x.apiKey,
    appSecret: env.x.apiSecret,
    accessToken: env.x.accessToken,
    accessSecret: env.x.accessSecret
  });
  return client;
}
async function uploadMediaInternal(mediaPath) {
  const rw = getClient().readWrite;
  return withRetries({
    platform: "x",
    endpoint: "v1.1/media/upload",
    execute: async () => rw.v1.uploadMedia(createUploadStream(mediaPath))
  });
}
var X = class _X {
  static async postTweet(input) {
    validatePlatformInput("x", "postTweet", input);
    const rw = getClient().readWrite;
    return withRetries({
      platform: "x",
      endpoint: "POST /2/tweets",
      execute: async () => rw.v2.tweet({ text: input.text, media: input.mediaIds ? { media_ids: input.mediaIds } : void 0 })
    });
  }
  static async postThread(input) {
    validatePlatformInput("x", "postThread", input);
    let previousId;
    const published = [];
    for (const text of input.tweets) {
      const payload = previousId ? { text, reply: { in_reply_to_tweet_id: previousId } } : { text };
      const rw = getClient().readWrite;
      const result = await rw.v2.tweet(payload);
      published.push(result);
      previousId = result?.data?.id;
    }
    return published;
  }
  static async replyTweet(input) {
    validatePlatformInput("x", "replyTweet", input);
    const rw = getClient().readWrite;
    return withRetries({
      platform: "x",
      endpoint: "POST /2/tweets",
      execute: async () => rw.v2.tweet({ text: input.text, reply: { in_reply_to_tweet_id: input.inReplyToTweetId } })
    });
  }
  static async quoteTweet(input) {
    validatePlatformInput("x", "quoteTweet", input);
    const rw = getClient().readWrite;
    return withRetries({
      platform: "x",
      endpoint: "POST /2/tweets",
      execute: async () => rw.v2.tweet({ text: input.text, quote_tweet_id: input.quoteTweetId })
    });
  }
  static async deleteTweet(input) {
    validatePlatformInput("x", "deleteTweet", input);
    const rw = getClient().readWrite;
    return withRetries({
      platform: "x",
      endpoint: "DELETE /2/tweets/:id",
      execute: async () => rw.v2.deleteTweet(input.tweetId)
    });
  }
  static async retweet(input) {
    validatePlatformInput("x", "retweet", input);
    const rw = getClient().readWrite;
    return withRetries({
      platform: "x",
      endpoint: "POST /2/users/:id/retweets",
      execute: async () => rw.v2.retweet(input.userId, input.tweetId)
    });
  }
  static async unretweet(input) {
    validatePlatformInput("x", "unretweet", input);
    const rw = getClient().readWrite;
    return withRetries({
      platform: "x",
      endpoint: "DELETE /2/users/:id/retweets/:tweet_id",
      execute: async () => rw.v2.unretweet(input.userId, input.tweetId)
    });
  }
  static async likeTweet(input) {
    validatePlatformInput("x", "likeTweet", input);
    const rw = getClient().readWrite;
    return withRetries({
      platform: "x",
      endpoint: "POST /2/users/:id/likes",
      execute: async () => rw.v2.like(input.userId, input.tweetId)
    });
  }
  static async unlikeTweet(input) {
    validatePlatformInput("x", "unlikeTweet", input);
    const rw = getClient().readWrite;
    return withRetries({
      platform: "x",
      endpoint: "DELETE /2/users/:id/likes/:tweet_id",
      execute: async () => rw.v2.unlike(input.userId, input.tweetId)
    });
  }
  static async uploadMedia(input) {
    validatePlatformInput("x", "uploadMedia", input);
    return uploadMediaInternal(input.mediaPath);
  }
  static async postPhoto(input) {
    validatePlatformInput("x", "postPhoto", input);
    const mediaId = await uploadMediaInternal(input.mediaPath);
    return _X.postTweet({ text: input.text, mediaIds: [mediaId] });
  }
  static async postVideo(input) {
    validatePlatformInput("x", "postVideo", input);
    const mediaId = await uploadMediaInternal(input.mediaPath);
    return _X.postTweet({ text: input.text, mediaIds: [mediaId] });
  }
  static async postPoll(input) {
    validatePlatformInput("x", "postPoll", input);
    const rw = getClient().readWrite;
    return withRetries({
      platform: "x",
      endpoint: "POST /2/tweets",
      execute: async () => rw.v2.tweet({
        text: input.text,
        poll: {
          options: input.options,
          duration_minutes: input.durationMinutes
        }
      })
    });
  }
  static async sendDirectMessage(input) {
    validatePlatformInput("x", "sendDirectMessage", input);
    const rw = getClient().readWrite;
    return withRetries({
      platform: "x",
      endpoint: "POST /2/dm_conversations/with/:participant_id/messages",
      execute: async () => rw.v2.post(`dm_conversations/with/${input.recipientId}/messages`, {
        text: input.text
      })
    });
  }
  static async getTweetAnalytics(input) {
    validatePlatformInput("x", "getTweetAnalytics", input);
    const ro = getClient().readOnly;
    return withRetries({
      platform: "x",
      endpoint: "GET /2/tweets/:id",
      execute: async () => ro.v2.singleTweet(input.tweetId, {
        "tweet.fields": ["public_metrics", "created_at", "organic_metrics", "non_public_metrics"]
      })
    });
  }
  static async scheduleTweet(input) {
    validatePlatformInput("x", "scheduleTweet", input);
    const jobId = `x-schedule-${Date.now()}`;
    return scheduleTask({
      id: jobId,
      runAt: input.publishAt,
      task: async () => _X.postTweet({ text: input.text })
    });
  }
};

// src/platforms/facebook.ts
function pageIdOrThrow(inputPageId) {
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
var Facebook = class {
  static async publishToPage(input) {
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
  static async publishPhoto(input) {
    validatePlatformInput("facebook", "publishPhoto", input);
    const pageId = pageIdOrThrow(input.pageId);
    return metaCall({
      platform: "facebook",
      method: "POST",
      endpoint: `/${pageId}/photos`,
      body: { url: input.url, caption: input.caption }
    });
  }
  static async publishVideo(input) {
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
  static async publishCarousel(input) {
    validatePlatformInput("facebook", "publishCarousel", input);
    const pageId = pageIdOrThrow(input.pageId);
    const mediaIds = [];
    for (const url of input.photoUrls) {
      const media = await metaCall({
        platform: "facebook",
        method: "POST",
        endpoint: `/${pageId}/photos`,
        body: { url, published: false }
      });
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
  static async publishStory(input) {
    validatePlatformInput("facebook", "publishStory", input);
    const pageId = pageIdOrThrow(input.pageId);
    return metaCall({
      platform: "facebook",
      method: "POST",
      endpoint: `/${pageId}/photo_stories`,
      body: { url: input.photoUrl }
    });
  }
  static async schedulePost(input) {
    validatePlatformInput("facebook", "schedulePost", input);
    const pageId = pageIdOrThrow(input.pageId);
    const publishTime = Math.floor(new Date(input.publishAt).getTime() / 1e3);
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
  static async commentOnPost(input) {
    validatePlatformInput("facebook", "commentOnPost", input);
    return metaCall({
      platform: "facebook",
      method: "POST",
      endpoint: `/${input.postId}/comments`,
      body: { message: input.message }
    });
  }
  static async replyToComment(input) {
    validatePlatformInput("facebook", "replyToComment", input);
    return metaCall({
      platform: "facebook",
      method: "POST",
      endpoint: `/${input.commentId}/comments`,
      body: { message: input.message }
    });
  }
  static async likeObject(input) {
    validatePlatformInput("facebook", "likeObject", input);
    return metaCall({
      platform: "facebook",
      method: "POST",
      endpoint: `/${input.objectId}/likes`
    });
  }
  static async deletePost(input) {
    validatePlatformInput("facebook", "deletePost", input);
    return metaCall({
      platform: "facebook",
      method: "DELETE",
      endpoint: `/${input.objectId}`
    });
  }
  static async sendPageMessage(input) {
    validatePlatformInput("facebook", "sendPageMessage", input);
    const pageId = pageIdOrThrow(input.pageId);
    return metaCall({
      platform: "facebook",
      method: "POST",
      endpoint: `/${pageId}/messages`,
      body: {
        recipient: { id: input.recipientPsid },
        message: { text: input.message },
        messaging_type: "RESPONSE"
      }
    });
  }
  static async getPostInsights(input) {
    validatePlatformInput("facebook", "getPostInsights", input);
    return metaCall({
      platform: "facebook",
      method: "GET",
      endpoint: `/${input.postId}/insights`,
      query: { metric: (input.metrics ?? ["post_impressions", "post_engaged_users"]).join(",") }
    });
  }
  static async getPageInsights(input) {
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
  static async uploadResumableVideo(input) {
    validatePlatformInput("facebook", "uploadResumableVideo", input);
    const pageId = pageIdOrThrow(input.pageId);
    return metaCall({
      platform: "facebook",
      method: "POST",
      endpoint: `/${pageId}/videos`,
      body: {
        upload_phase: "start",
        file_size: input.fileSize,
        start_offset: input.startOffset ?? 0
      }
    });
  }
  static async listPublishedPosts(input) {
    validatePlatformInput("facebook", "listPublishedPosts", input);
    const pageId = pageIdOrThrow(input.pageId);
    return metaCall({
      platform: "facebook",
      method: "GET",
      endpoint: `/${pageId}/published_posts`,
      query: { limit: input.limit ?? 25 }
    });
  }
  static async scheduleInProcess(input) {
    return scheduleTask({
      id: `facebook-schedule-${Date.now()}`,
      runAt: input.publishAt,
      task: input.action
    });
  }
};

// src/platforms/linkedin.ts
import axios2 from "axios";

// src/platforms/shared/linkedinAuth.ts
import axios from "axios";
var LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
var accessTokenCache = env.linkedin.accessToken;
var expiryEpochMs = 0;
function getLinkedInHeaders() {
  return {
    Authorization: `Bearer ${accessTokenCache}`,
    "Content-Type": "application/json",
    "Linkedin-Version": env.linkedin.apiVersion,
    "X-Restli-Protocol-Version": "2.0.0"
  };
}
async function getLinkedInAccessToken() {
  const stillValid = accessTokenCache.length > 0 && Date.now() < expiryEpochMs - 3e4;
  if (stillValid) {
    return accessTokenCache;
  }
  if (!env.linkedin.refreshToken) {
    if (!accessTokenCache) {
      throw new SocialError({
        platform: "linkedin",
        endpoint: "oauth/token",
        message: "Missing LinkedIn credentials. Provide LINKEDIN_ACCESS_TOKEN or refresh-token credentials."
      });
    }
    return accessTokenCache;
  }
  if (!env.linkedin.clientId || !env.linkedin.clientSecret) {
    throw new SocialError({
      platform: "linkedin",
      endpoint: "oauth/token",
      message: "Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET for token refresh."
    });
  }
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: env.linkedin.refreshToken,
    client_id: env.linkedin.clientId,
    client_secret: env.linkedin.clientSecret
  });
  try {
    const response = await axios.post(LINKEDIN_TOKEN_URL, body.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
    accessTokenCache = response.data.access_token;
    expiryEpochMs = Date.now() + response.data.expires_in * 1e3;
    return accessTokenCache;
  } catch (error) {
    throw SocialError.normalize({
      platform: "linkedin",
      endpoint: "oauth/token",
      error
    });
  }
}

// src/platforms/linkedin.ts
var BASE_URL = "https://api.linkedin.com/rest";
function authorOrThrow(author) {
  const resolved = author ?? env.linkedin.orgUrn ?? env.linkedin.personUrn;
  if (!resolved) {
    throw new SocialError({
      platform: "linkedin",
      endpoint: "author",
      message: "Missing LinkedIn author URN. Set LINKEDIN_ORG_URN or LINKEDIN_PERSON_URN or pass author."
    });
  }
  return resolved;
}
async function linkedInRequest(params) {
  await getLinkedInAccessToken();
  return withRetries({
    platform: "linkedin",
    endpoint: params.endpoint,
    execute: async () => {
      try {
        const response = await axios2.request({
          url: `${BASE_URL}${params.endpoint}`,
          method: params.method,
          params: params.query,
          data: params.data,
          headers: { ...getLinkedInHeaders(), ...params.headers ?? {} }
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
var LinkedIn = class _LinkedIn {
  static async createTextPost(input) {
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
  static async createImagePost(input) {
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
  static async createVideoPost(input) {
    validatePlatformInput("linkedin", "createVideoPost", input);
    return _LinkedIn.createImagePost(input);
  }
  static async createCarouselPost(input) {
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
  static async schedulePost(input) {
    validatePlatformInput("linkedin", "schedulePost", input);
    return scheduleTask({
      id: `linkedin-schedule-${Date.now()}`,
      runAt: input.publishAt,
      task: async () => _LinkedIn.createTextPost({ author: input.author, text: input.text })
    });
  }
  static async commentOnPost(input) {
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
  static async replyToComment(input) {
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
  static async deleteComment(input) {
    validatePlatformInput("linkedin", "deleteComment", input);
    return linkedInRequest({
      endpoint: `/socialActions/comments/${encodeURIComponent(input.encodedCommentUrn)}`,
      method: "DELETE"
    });
  }
  static async likePost(input) {
    validatePlatformInput("linkedin", "likePost", input);
    const actor = authorOrThrow(input.actor);
    return linkedInRequest({
      endpoint: "/socialActions/likes",
      method: "POST",
      data: { actor, object: input.objectUrn }
    });
  }
  static async unlikePost(input) {
    validatePlatformInput("linkedin", "unlikePost", input);
    const actorUrn = authorOrThrow(input.actorUrn);
    const encodedActor = encodeURIComponent(actorUrn);
    return linkedInRequest({
      endpoint: `/socialActions/${encodeURIComponent(input.encodedObjectUrn)}/likes/${encodedActor}`,
      method: "DELETE"
    });
  }
  static async sendDirectMessage(input) {
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
  static async getPostAnalytics(input) {
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
  static async getOrganizationAnalytics(input) {
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
  static async registerUpload(input) {
    validatePlatformInput("linkedin", "registerUpload", input);
    const owner = authorOrThrow(input.owner);
    return linkedInRequest({
      endpoint: "/assets?action=registerUpload",
      method: "POST",
      data: {
        registerUploadRequest: {
          recipes: input.mediaType === "image" ? ["urn:li:digitalmediaRecipe:feedshare-image"] : ["urn:li:digitalmediaRecipe:feedshare-video"],
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
  static async uploadBinary(input) {
    validatePlatformInput("linkedin", "uploadBinary", input);
    const { fileSize } = getFileMeta(input.mediaPath);
    await getLinkedInAccessToken();
    return withRetries({
      platform: "linkedin",
      endpoint: "uploadBinary",
      execute: async () => axios2.put(input.uploadUrl, createUploadStream(input.mediaPath), {
        maxBodyLength: Infinity,
        headers: {
          Authorization: getLinkedInHeaders().Authorization,
          "Content-Length": String(fileSize)
        }
      })
    });
  }
  static async deletePost(input) {
    validatePlatformInput("linkedin", "deletePost", input);
    return linkedInRequest({
      endpoint: `/posts/${encodeURIComponent(input.encodedPostUrn)}`,
      method: "DELETE"
    });
  }
};
export {
  Facebook,
  Instagram,
  LinkedIn,
  SocialError,
  X
};
//# sourceMappingURL=index.js.map