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
  youtube: {
    accessToken: process.env.YOUTUBE_ACCESS_TOKEN ?? "",
    channelId: process.env.YOUTUBE_CHANNEL_ID ?? ""
  },
  tiktok: {
    accessToken: process.env.TIKTOK_ACCESS_TOKEN ?? "",
    openId: process.env.TIKTOK_OPEN_ID ?? "",
    advertiserId: process.env.TIKTOK_ADVERTISER_ID ?? ""
  },
  pinterest: {
    accessToken: process.env.PINTEREST_ACCESS_TOKEN ?? "",
    boardId: process.env.PINTEREST_BOARD_ID ?? ""
  },
  bluesky: {
    serviceUrl: process.env.BLUESKY_SERVICE_URL ?? "https://bsky.social",
    identifier: process.env.BLUESKY_IDENTIFIER ?? "",
    appPassword: process.env.BLUESKY_APP_PASSWORD ?? "",
    accessJwt: process.env.BLUESKY_ACCESS_JWT ?? "",
    refreshJwt: process.env.BLUESKY_REFRESH_JWT ?? ""
  },
  mastodon: {
    baseUrl: process.env.MASTODON_BASE_URL ?? "",
    accessToken: process.env.MASTODON_ACCESS_TOKEN ?? "",
    accountId: process.env.MASTODON_ACCOUNT_ID ?? ""
  },
  threads: {
    accessToken: process.env.THREADS_ACCESS_TOKEN ?? "",
    userId: process.env.THREADS_USER_ID ?? ""
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

// src/utils/normalizedResult.ts
function normalizeActionResult(params) {
  return {
    platform: params.platform,
    action: params.action,
    success: true,
    raw: params.raw
  };
}
function normalizeDeleteResult(params) {
  return {
    platform: params.platform,
    targetId: params.targetId,
    deleted: true,
    success: true,
    raw: params.raw
  };
}
function normalizeMutationResult(params) {
  return {
    platform: params.platform,
    resourceId: params.resourceId,
    success: true,
    raw: params.raw
  };
}
function normalizeDetailResult(params) {
  return {
    platform: params.platform,
    success: true,
    raw: params.raw
  };
}

// src/queue/adapters/inMemory.ts
function toEpochMs(value) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}
var InMemoryQueueAdapter = class {
  jobs = /* @__PURE__ */ new Map();
  async enqueue(job) {
    return this.schedule(job, /* @__PURE__ */ new Date());
  }
  async schedule(job, runAt) {
    const targetTime = toEpochMs(runAt);
    const delay = Math.max(0, targetTime - Date.now());
    const result = new Promise((resolve, reject) => {
      const timeout = setTimeout(async () => {
        this.jobs.delete(job.id);
        try {
          resolve(await job.task());
        } catch (error) {
          reject(error);
        }
      }, delay);
      this.jobs.set(job.id, { timeout, reject });
    });
    return {
      id: job.id,
      result
    };
  }
  cancel(jobId) {
    const scheduled = this.jobs.get(jobId);
    if (!scheduled) {
      return false;
    }
    clearTimeout(scheduled.timeout);
    this.jobs.delete(jobId);
    scheduled.reject(new Error(`Queue job cancelled: ${jobId}`));
    return true;
  }
};

// src/queue/adapters/bullmq.ts
var BullMQAdapter = class {
  async enqueue(job) {
    throw new Error(
      `BullMQAdapter.enqueue is a skeleton. Implement integration for job ${job.id}.`
    );
  }
  async schedule(job, _runAt) {
    throw new Error(
      `BullMQAdapter.schedule is a skeleton. Implement integration for job ${job.id}.`
    );
  }
  cancel(_jobId) {
    throw new Error(
      "BullMQAdapter.cancel is a skeleton. Implement cancellation mapping to BullMQ job IDs."
    );
  }
};

// src/queue/adapters/sqs.ts
var SQSAdapter = class {
  async enqueue(job) {
    throw new Error(
      `SQSAdapter.enqueue is a skeleton. Implement integration for job ${job.id}.`
    );
  }
  async schedule(job, _runAt) {
    throw new Error(
      `SQSAdapter.schedule is a skeleton. Implement integration for job ${job.id}.`
    );
  }
  cancel(_jobId) {
    throw new Error(
      "SQSAdapter.cancel is a skeleton. Implement cancellation strategy for queued messages."
    );
  }
};

// src/queue/registry.ts
var queueAdapter = new InMemoryQueueAdapter();
function setQueueAdapter(adapter) {
  queueAdapter = adapter;
}
function getQueueAdapter() {
  return queueAdapter;
}
function resetQueueAdapter() {
  queueAdapter = new InMemoryQueueAdapter();
}

// src/utils/scheduler.ts
function scheduleTask(params) {
  return getQueueAdapter().schedule(
    {
      id: params.id,
      task: params.task
    },
    params.runAt
  ).then((handle) => handle.result);
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
  },
  youtube: {
    createVideoUploadSession: z.object({
      title: nonEmpty,
      description: optionalNonEmpty,
      privacyStatus: z.enum(["private", "public", "unlisted"]).optional()
    }),
    uploadBinary: z.object({ uploadUrl: nonEmpty, mediaPath: nonEmpty }),
    listMyVideos: z.object({ maxResults: z.number().int().positive().optional() }),
    updateVideoMetadata: z.object({
      videoId: nonEmpty,
      title: optionalNonEmpty,
      description: optionalNonEmpty,
      privacyStatus: z.enum(["private", "public", "unlisted"]).optional()
    }),
    deleteVideo: z.object({ videoId: nonEmpty }),
    commentOnVideo: z.object({ videoId: nonEmpty, text: nonEmpty }),
    replyToComment: z.object({ parentCommentId: nonEmpty, text: nonEmpty }),
    likeVideo: z.object({ videoId: nonEmpty }),
    unlikeVideo: z.object({ videoId: nonEmpty }),
    createPlaylist: z.object({
      title: nonEmpty,
      description: optionalNonEmpty,
      privacyStatus: z.enum(["private", "public", "unlisted"]).optional()
    }),
    addVideoToPlaylist: z.object({ playlistId: nonEmpty, videoId: nonEmpty }),
    getChannelAnalytics: z.object({
      startDate: nonEmpty,
      endDate: nonEmpty,
      metrics: optionalNonEmpty
    }),
    scheduleVideoMetadataUpdate: z.object({
      videoId: nonEmpty,
      title: optionalNonEmpty,
      description: optionalNonEmpty,
      privacyStatus: z.enum(["private", "public", "unlisted"]).optional(),
      publishAt: dateLike
    })
  },
  tiktok: {
    createPost: z.object({
      text: nonEmpty,
      visibility: z.enum(["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY"]).optional()
    }),
    createVideoPost: z.object({
      title: nonEmpty,
      videoUrl: nonEmpty,
      visibility: z.enum(["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY"]).optional()
    }),
    getPostStatus: z.object({ publishId: nonEmpty }),
    listVideos: z.object({ maxCount: z.number().int().positive().optional() }),
    deleteVideo: z.object({ videoId: nonEmpty }),
    commentOnVideo: z.object({ videoId: nonEmpty, text: nonEmpty }),
    replyToComment: z.object({ commentId: nonEmpty, text: nonEmpty }),
    likeVideo: z.object({ videoId: nonEmpty }),
    unlikeVideo: z.object({ videoId: nonEmpty }),
    getVideoAnalytics: z.object({ videoIds: z.array(nonEmpty).min(1) }),
    getProfileAnalytics: z.object({ fields: z.array(nonEmpty).optional() }),
    scheduleVideoPost: z.object({
      title: nonEmpty,
      videoUrl: nonEmpty,
      publishAt: dateLike
    })
  },
  pinterest: {
    createPin: z.object({
      boardId: optionalNonEmpty,
      title: nonEmpty,
      description: optionalNonEmpty,
      link: optionalNonEmpty,
      mediaSourceUrl: nonEmpty
    }),
    createVideoPin: z.object({
      boardId: optionalNonEmpty,
      title: nonEmpty,
      description: optionalNonEmpty,
      mediaSourceUrl: nonEmpty
    }),
    updatePin: z.object({
      pinId: nonEmpty,
      title: optionalNonEmpty,
      description: optionalNonEmpty,
      link: optionalNonEmpty
    }),
    deletePin: z.object({ pinId: nonEmpty }),
    listPins: z.object({
      boardId: optionalNonEmpty,
      pageSize: z.number().int().positive().optional()
    }),
    createBoard: z.object({
      name: nonEmpty,
      description: optionalNonEmpty,
      privacy: z.enum(["PUBLIC", "PROTECTED", "SECRET"]).optional()
    }),
    listBoards: z.object({ pageSize: z.number().int().positive().optional() }),
    commentOnPin: z.object({ pinId: nonEmpty, text: nonEmpty }),
    replyToComment: z.object({
      pinId: nonEmpty,
      commentId: nonEmpty,
      text: nonEmpty
    }),
    getPinAnalytics: z.object({
      pinId: nonEmpty,
      startDate: nonEmpty,
      endDate: nonEmpty
    }),
    getAccountAnalytics: z.object({ startDate: nonEmpty, endDate: nonEmpty }),
    schedulePin: z.object({
      title: nonEmpty,
      mediaSourceUrl: nonEmpty,
      boardId: optionalNonEmpty,
      publishAt: dateLike
    })
  },
  bluesky: {
    postText: z.object({ text: nonEmpty }),
    postWithLink: z.object({ text: nonEmpty, url: nonEmpty }),
    replyToPost: z.object({
      text: nonEmpty,
      rootUri: nonEmpty,
      rootCid: nonEmpty,
      parentUri: nonEmpty,
      parentCid: nonEmpty
    }),
    likePost: z.object({ subjectUri: nonEmpty, subjectCid: nonEmpty }),
    repost: z.object({ subjectUri: nonEmpty, subjectCid: nonEmpty }),
    deleteRecord: z.object({ uri: nonEmpty }),
    getAuthorFeed: z.object({
      actorDidOrHandle: nonEmpty,
      limit: z.number().int().positive().optional()
    }),
    searchPosts: z.object({
      query: nonEmpty,
      limit: z.number().int().positive().optional()
    }),
    getPostThread: z.object({
      uri: nonEmpty,
      depth: z.number().int().positive().optional()
    }),
    getNotificationFeed: z.object({
      limit: z.number().int().positive().optional()
    }),
    schedulePost: z.object({ text: nonEmpty, publishAt: dateLike })
  },
  mastodon: {
    createStatus: z.object({
      text: nonEmpty,
      visibility: z.enum(["public", "unlisted", "private", "direct"]).optional()
    }),
    uploadMedia: z.object({ mediaPath: nonEmpty, description: optionalNonEmpty }),
    createMediaStatus: z.object({
      text: nonEmpty,
      mediaIds: z.array(nonEmpty).min(1),
      visibility: z.enum(["public", "unlisted", "private", "direct"]).optional()
    }),
    replyToStatus: z.object({ statusId: nonEmpty, text: nonEmpty }),
    deleteStatus: z.object({ statusId: nonEmpty }),
    favouriteStatus: z.object({ statusId: nonEmpty }),
    unfavouriteStatus: z.object({ statusId: nonEmpty }),
    boostStatus: z.object({ statusId: nonEmpty }),
    unboostStatus: z.object({ statusId: nonEmpty }),
    listMyStatuses: z.object({ limit: z.number().int().positive().optional() }),
    getStatusContext: z.object({ statusId: nonEmpty }),
    getAccountAnalytics: z.object({
      instanceScope: z.enum(["day", "week", "month"]).optional()
    }),
    scheduleStatus: z.object({ text: nonEmpty, publishAt: dateLike })
  },
  threads: {
    postText: z.object({ threadsUserId: optionalNonEmpty, text: nonEmpty }),
    postImage: z.object({
      threadsUserId: optionalNonEmpty,
      text: optionalNonEmpty,
      imageUrl: nonEmpty
    }),
    postVideo: z.object({
      threadsUserId: optionalNonEmpty,
      text: optionalNonEmpty,
      videoUrl: nonEmpty
    }),
    replyToThread: z.object({
      threadsUserId: optionalNonEmpty,
      threadId: nonEmpty,
      text: nonEmpty
    }),
    deleteThread: z.object({ threadId: nonEmpty }),
    getThread: z.object({
      threadId: nonEmpty,
      fields: z.array(nonEmpty).optional()
    }),
    listMyThreads: z.object({
      threadsUserId: optionalNonEmpty,
      limit: z.number().int().positive().optional()
    }),
    getThreadInsights: z.object({
      threadId: nonEmpty,
      metrics: z.array(nonEmpty).optional()
    }),
    getAccountInsights: z.object({
      threadsUserId: optionalNonEmpty,
      metrics: z.array(nonEmpty).optional(),
      period: z.enum(["day", "week", "days_28"]).optional()
    }),
    likeThread: z.object({ threadId: nonEmpty }),
    unlikeThread: z.object({ threadId: nonEmpty }),
    scheduleTextPost: z.object({
      threadsUserId: optionalNonEmpty,
      text: nonEmpty,
      publishAt: dateLike
    })
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
    const raw = await metaCall({
      platform: "instagram",
      method: "POST",
      endpoint: `/${input.commentId}`,
      body: { hidden: input.hide }
    });
    return normalizeActionResult({ platform: "instagram", action: "hideComment", raw });
  }
  static async deleteComment(input) {
    validatePlatformInput("instagram", "deleteComment", input);
    const raw = await metaCall({
      platform: "instagram",
      method: "DELETE",
      endpoint: `/${input.commentId}`
    });
    return normalizeDeleteResult({ platform: "instagram", targetId: input.commentId, raw });
  }
  static async deleteMedia(input) {
    validatePlatformInput("instagram", "deleteMedia", input);
    const raw = await metaCall({
      platform: "instagram",
      method: "DELETE",
      endpoint: `/${input.mediaId}`
    });
    return normalizeDeleteResult({ platform: "instagram", targetId: input.mediaId, raw });
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
    const raw = await metaCall({
      platform: "instagram",
      method: "GET",
      endpoint: `/${igUserId}/content_publishing_limit`,
      query: { fields: "quota_usage,config" }
    });
    return normalizeDetailResult({ platform: "instagram", raw });
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
    const raw = await withRetries({
      platform: "x",
      endpoint: "DELETE /2/tweets/:id",
      execute: async () => rw.v2.deleteTweet(input.tweetId)
    });
    return normalizeDeleteResult({ platform: "x", targetId: input.tweetId, raw });
  }
  static async retweet(input) {
    validatePlatformInput("x", "retweet", input);
    const rw = getClient().readWrite;
    const raw = await withRetries({
      platform: "x",
      endpoint: "POST /2/users/:id/retweets",
      execute: async () => rw.v2.retweet(input.userId, input.tweetId)
    });
    return normalizeActionResult({ platform: "x", action: "retweet", raw });
  }
  static async unretweet(input) {
    validatePlatformInput("x", "unretweet", input);
    const rw = getClient().readWrite;
    const raw = await withRetries({
      platform: "x",
      endpoint: "DELETE /2/users/:id/retweets/:tweet_id",
      execute: async () => rw.v2.unretweet(input.userId, input.tweetId)
    });
    return normalizeActionResult({ platform: "x", action: "unretweet", raw });
  }
  static async likeTweet(input) {
    validatePlatformInput("x", "likeTweet", input);
    const rw = getClient().readWrite;
    const raw = await withRetries({
      platform: "x",
      endpoint: "POST /2/users/:id/likes",
      execute: async () => rw.v2.like(input.userId, input.tweetId)
    });
    return normalizeActionResult({ platform: "x", action: "like", raw });
  }
  static async unlikeTweet(input) {
    validatePlatformInput("x", "unlikeTweet", input);
    const rw = getClient().readWrite;
    const raw = await withRetries({
      platform: "x",
      endpoint: "DELETE /2/users/:id/likes/:tweet_id",
      execute: async () => rw.v2.unlike(input.userId, input.tweetId)
    });
    return normalizeActionResult({ platform: "x", action: "unlike", raw });
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
    const raw = await withRetries({
      platform: "x",
      endpoint: "POST /2/dm_conversations/with/:participant_id/messages",
      execute: async () => rw.v2.post(`dm_conversations/with/${input.recipientId}/messages`, {
        text: input.text
      })
    });
    return normalizeActionResult({ platform: "x", action: "sendDirectMessage", raw });
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
    const raw = await metaCall({
      platform: "facebook",
      method: "POST",
      endpoint: `/${input.objectId}/likes`
    });
    return normalizeActionResult({ platform: "facebook", action: "likeObject", raw });
  }
  static async deletePost(input) {
    validatePlatformInput("facebook", "deletePost", input);
    const raw = await metaCall({
      platform: "facebook",
      method: "DELETE",
      endpoint: `/${input.objectId}`
    });
    return normalizeDeleteResult({ platform: "facebook", targetId: input.objectId, raw });
  }
  static async sendPageMessage(input) {
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
  static async likePost(input) {
    validatePlatformInput("linkedin", "likePost", input);
    const actor = authorOrThrow(input.actor);
    const raw = await linkedInRequest({
      endpoint: "/socialActions/likes",
      method: "POST",
      data: { actor, object: input.objectUrn }
    });
    return normalizeActionResult({ platform: "linkedin", action: "likePost", raw });
  }
  static async unlikePost(input) {
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
  static async sendDirectMessage(input) {
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
    await withRetries({
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
    return { bytesUploaded: fileSize };
  }
  static async deletePost(input) {
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
};

// src/platforms/youtube.ts
import axios3 from "axios";
var YT_API_BASE = "https://www.googleapis.com/youtube/v3";
var YT_UPLOAD_BASE = "https://www.googleapis.com/upload/youtube/v3";
var YT_ANALYTICS_BASE = "https://youtubeanalytics.googleapis.com/v2";
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
async function youtubeRequest(params) {
  return withRetries({
    platform: "youtube",
    endpoint: params.endpoint,
    execute: async () => {
      try {
        const response = await axios3.request({
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
var YouTube = class _YouTube {
  static async createVideoUploadSession(input) {
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
  static async uploadBinary(input) {
    validatePlatformInput("youtube", "uploadBinary", input);
    const { fileSize } = getFileMeta(input.mediaPath);
    await withRetries({
      platform: "youtube",
      endpoint: "uploadBinary",
      execute: async () => axios3.put(input.uploadUrl, createUploadStream(input.mediaPath), {
        maxBodyLength: Infinity,
        headers: {
          ...authHeader(),
          "Content-Length": String(fileSize),
          "Content-Type": "application/octet-stream"
        }
      })
    });
    return { bytesUploaded: fileSize };
  }
  static async listMyVideos(input) {
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
  static async updateVideoMetadata(input) {
    validatePlatformInput("youtube", "updateVideoMetadata", input);
    const raw = await youtubeRequest({
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
    return normalizeMutationResult({
      platform: "youtube",
      resourceId: input.videoId,
      raw
    });
  }
  static async deleteVideo(input) {
    validatePlatformInput("youtube", "deleteVideo", input);
    const raw = await youtubeRequest({
      endpoint: "/videos",
      method: "DELETE",
      query: { id: input.videoId }
    });
    return normalizeDeleteResult({ platform: "youtube", targetId: input.videoId, raw });
  }
  static async commentOnVideo(input) {
    validatePlatformInput("youtube", "commentOnVideo", input);
    const raw = await youtubeRequest({
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
    return normalizeMutationResult({ platform: "youtube", resourceId: input.videoId, raw });
  }
  static async replyToComment(input) {
    validatePlatformInput("youtube", "replyToComment", input);
    const raw = await youtubeRequest({
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
    return normalizeMutationResult({
      platform: "youtube",
      resourceId: input.parentCommentId,
      raw
    });
  }
  static async likeVideo(input) {
    validatePlatformInput("youtube", "likeVideo", input);
    const raw = await youtubeRequest({
      endpoint: "/videos/rate",
      method: "POST",
      query: { id: input.videoId, rating: "like" }
    });
    return normalizeActionResult({ platform: "youtube", action: "likeVideo", raw });
  }
  static async unlikeVideo(input) {
    validatePlatformInput("youtube", "unlikeVideo", input);
    const raw = await youtubeRequest({
      endpoint: "/videos/rate",
      method: "POST",
      query: { id: input.videoId, rating: "none" }
    });
    return normalizeActionResult({ platform: "youtube", action: "unlikeVideo", raw });
  }
  static async createPlaylist(input) {
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
  static async addVideoToPlaylist(input) {
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
  static async getChannelAnalytics(input) {
    validatePlatformInput("youtube", "getChannelAnalytics", input);
    return withRetries({
      platform: "youtube",
      endpoint: "/reports",
      execute: async () => {
        const response = await axios3.get(`${YT_ANALYTICS_BASE}/reports`, {
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
  static async scheduleVideoMetadataUpdate(input) {
    validatePlatformInput("youtube", "scheduleVideoMetadataUpdate", input);
    return scheduleTask({
      id: `youtube-schedule-${Date.now()}`,
      runAt: input.publishAt,
      task: async () => _YouTube.updateVideoMetadata({
        videoId: input.videoId,
        title: input.title,
        description: input.description,
        privacyStatus: input.privacyStatus
      })
    });
  }
};

// src/platforms/tiktok.ts
import axios4 from "axios";
var TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";
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
async function tikTokRequest(params) {
  return withRetries({
    platform: "tiktok",
    endpoint: params.endpoint,
    execute: async () => {
      try {
        const response = await axios4.request({
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
var TikTok = class _TikTok {
  static async createPost(input) {
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
  static async createVideoPost(input) {
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
  static async getPostStatus(input) {
    validatePlatformInput("tiktok", "getPostStatus", input);
    return tikTokRequest({
      endpoint: "/post/publish/status/fetch/",
      method: "POST",
      data: { publish_id: input.publishId }
    });
  }
  static async listVideos(input) {
    validatePlatformInput("tiktok", "listVideos", input);
    return tikTokRequest({
      endpoint: "/video/list/",
      method: "POST",
      data: { max_count: input.maxCount ?? 20 }
    });
  }
  static async deleteVideo(input) {
    validatePlatformInput("tiktok", "deleteVideo", input);
    const raw = await tikTokRequest({
      endpoint: "/video/delete/",
      method: "POST",
      data: { video_id: input.videoId }
    });
    return normalizeDeleteResult({ platform: "tiktok", targetId: input.videoId, raw });
  }
  static async commentOnVideo(input) {
    validatePlatformInput("tiktok", "commentOnVideo", input);
    const raw = await tikTokRequest({
      endpoint: "/video/comment/create/",
      method: "POST",
      data: { video_id: input.videoId, text: input.text }
    });
    return normalizeActionResult({ platform: "tiktok", action: "commentOnVideo", raw });
  }
  static async replyToComment(input) {
    validatePlatformInput("tiktok", "replyToComment", input);
    const raw = await tikTokRequest({
      endpoint: "/video/comment/reply/",
      method: "POST",
      data: { comment_id: input.commentId, text: input.text }
    });
    return normalizeActionResult({ platform: "tiktok", action: "replyToComment", raw });
  }
  static async likeVideo(input) {
    validatePlatformInput("tiktok", "likeVideo", input);
    const raw = await tikTokRequest({
      endpoint: "/video/like/",
      method: "POST",
      data: { video_id: input.videoId }
    });
    return normalizeActionResult({ platform: "tiktok", action: "likeVideo", raw });
  }
  static async unlikeVideo(input) {
    validatePlatformInput("tiktok", "unlikeVideo", input);
    const raw = await tikTokRequest({
      endpoint: "/video/unlike/",
      method: "POST",
      data: { video_id: input.videoId }
    });
    return normalizeActionResult({ platform: "tiktok", action: "unlikeVideo", raw });
  }
  static async getVideoAnalytics(input) {
    validatePlatformInput("tiktok", "getVideoAnalytics", input);
    return tikTokRequest({
      endpoint: "/research/video/query/",
      method: "POST",
      data: { filters: { video_ids: input.videoIds } }
    });
  }
  static async getProfileAnalytics(input) {
    validatePlatformInput("tiktok", "getProfileAnalytics", input);
    return tikTokRequest({
      endpoint: "/user/info/",
      method: "GET",
      query: {
        fields: (input.fields ?? ["display_name", "follower_count", "video_count"]).join(",")
      }
    });
  }
  static async scheduleVideoPost(input) {
    validatePlatformInput("tiktok", "scheduleVideoPost", input);
    return scheduleTask({
      id: `tiktok-schedule-${Date.now()}`,
      runAt: input.publishAt,
      task: async () => _TikTok.createVideoPost({
        title: input.title,
        videoUrl: input.videoUrl
      })
    });
  }
};

// src/platforms/pinterest.ts
import axios5 from "axios";
var PINTEREST_BASE = "https://api.pinterest.com/v5";
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
async function pinterestRequest(params) {
  return withRetries({
    platform: "pinterest",
    endpoint: params.endpoint,
    execute: async () => {
      try {
        const response = await axios5.request({
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
var Pinterest = class _Pinterest {
  static async createPin(input) {
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
  static async createVideoPin(input) {
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
  static async updatePin(input) {
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
  static async deletePin(input) {
    validatePlatformInput("pinterest", "deletePin", input);
    const raw = await pinterestRequest({
      endpoint: `/pins/${input.pinId}`,
      method: "DELETE"
    });
    return normalizeDeleteResult({ platform: "pinterest", targetId: input.pinId, raw });
  }
  static async listPins(input) {
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
  static async createBoard(input) {
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
  static async listBoards(input) {
    validatePlatformInput("pinterest", "listBoards", input);
    return pinterestRequest({
      endpoint: "/boards",
      method: "GET",
      query: { page_size: input.pageSize ?? 25 }
    });
  }
  static async commentOnPin(input) {
    validatePlatformInput("pinterest", "commentOnPin", input);
    const raw = await pinterestRequest({
      endpoint: `/pins/${input.pinId}/comments`,
      method: "POST",
      data: { text: input.text }
    });
    return normalizeActionResult({ platform: "pinterest", action: "commentOnPin", raw });
  }
  static async replyToComment(input) {
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
  static async getPinAnalytics(input) {
    validatePlatformInput("pinterest", "getPinAnalytics", input);
    return pinterestRequest({
      endpoint: `/pins/${input.pinId}/analytics`,
      method: "GET",
      query: { start_date: input.startDate, end_date: input.endDate }
    });
  }
  static async getAccountAnalytics(input) {
    validatePlatformInput("pinterest", "getAccountAnalytics", input);
    return pinterestRequest({
      endpoint: "/user_account/analytics",
      method: "GET",
      query: { start_date: input.startDate, end_date: input.endDate }
    });
  }
  static async schedulePin(input) {
    validatePlatformInput("pinterest", "schedulePin", input);
    const raw = await scheduleTask({
      id: `pinterest-schedule-${Date.now()}`,
      runAt: input.publishAt,
      task: async () => _Pinterest.createPin({
        title: input.title,
        mediaSourceUrl: input.mediaSourceUrl,
        boardId: input.boardId
      })
    });
    return normalizeMutationResult({ platform: "pinterest", raw });
  }
};

// src/platforms/bluesky.ts
import axios6 from "axios";
var DEFAULT_SERVICE = "https://bsky.social";
function serviceBase() {
  return `${env.bluesky.serviceUrl || DEFAULT_SERVICE}/xrpc`;
}
var accessJwt = env.bluesky.accessJwt;
var did = "";
async function ensureSession() {
  if (accessJwt && did) {
    return { accessJwt, did };
  }
  if (!env.bluesky.identifier || !env.bluesky.appPassword) {
    throw new SocialError({
      platform: "bluesky",
      endpoint: "createSession",
      message: "Missing Bluesky session credentials. Set BLUESKY_IDENTIFIER and BLUESKY_APP_PASSWORD, or provide BLUESKY_ACCESS_JWT."
    });
  }
  const response = await axios6.post(`${serviceBase()}/com.atproto.server.createSession`, {
    identifier: env.bluesky.identifier,
    password: env.bluesky.appPassword
  });
  accessJwt = response.data.accessJwt;
  did = response.data.did;
  return { accessJwt, did };
}
async function bskyRequest(params) {
  const session = await ensureSession();
  return withRetries({
    platform: "bluesky",
    endpoint: params.endpoint,
    execute: async () => {
      try {
        const response = await axios6.request({
          baseURL: serviceBase(),
          url: params.endpoint,
          method: params.method,
          params: params.query,
          data: params.data,
          headers: {
            Authorization: `Bearer ${session.accessJwt}`,
            "Content-Type": "application/json"
          }
        });
        return response.data;
      } catch (error) {
        throw SocialError.normalize({
          platform: "bluesky",
          endpoint: params.endpoint,
          error
        });
      }
    }
  });
}
async function createRecord(collection, record) {
  const session = await ensureSession();
  return bskyRequest({
    endpoint: "/com.atproto.repo.createRecord",
    method: "POST",
    data: {
      repo: session.did,
      collection,
      record
    }
  });
}
var Bluesky = class _Bluesky {
  static async postText(input) {
    validatePlatformInput("bluesky", "postText", input);
    return createRecord("app.bsky.feed.post", {
      $type: "app.bsky.feed.post",
      text: input.text,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  static async postWithLink(input) {
    validatePlatformInput("bluesky", "postWithLink", input);
    return createRecord("app.bsky.feed.post", {
      $type: "app.bsky.feed.post",
      text: `${input.text}
${input.url}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  static async replyToPost(input) {
    validatePlatformInput("bluesky", "replyToPost", input);
    return createRecord("app.bsky.feed.post", {
      $type: "app.bsky.feed.post",
      text: input.text,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      reply: {
        root: { uri: input.rootUri, cid: input.rootCid },
        parent: { uri: input.parentUri, cid: input.parentCid }
      }
    });
  }
  static async likePost(input) {
    validatePlatformInput("bluesky", "likePost", input);
    return createRecord("app.bsky.feed.like", {
      $type: "app.bsky.feed.like",
      subject: { uri: input.subjectUri, cid: input.subjectCid },
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  static async repost(input) {
    validatePlatformInput("bluesky", "repost", input);
    return createRecord("app.bsky.feed.repost", {
      $type: "app.bsky.feed.repost",
      subject: { uri: input.subjectUri, cid: input.subjectCid },
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  static async deleteRecord(input) {
    validatePlatformInput("bluesky", "deleteRecord", input);
    const session = await ensureSession();
    const parsed = new URL(input.uri.replace("at://", "https://"));
    const parts = parsed.pathname.split("/").filter(Boolean);
    const [collection, rkey] = parts.slice(-2);
    const raw = await bskyRequest({
      endpoint: "/com.atproto.repo.deleteRecord",
      method: "POST",
      data: {
        repo: session.did,
        collection,
        rkey
      }
    });
    return normalizeActionResult({ platform: "bluesky", action: "deleteRecord", raw });
  }
  static async getAuthorFeed(input) {
    validatePlatformInput("bluesky", "getAuthorFeed", input);
    return bskyRequest({
      endpoint: "/app.bsky.feed.getAuthorFeed",
      method: "GET",
      query: {
        actor: input.actorDidOrHandle,
        limit: input.limit ?? 25
      }
    });
  }
  static async searchPosts(input) {
    validatePlatformInput("bluesky", "searchPosts", input);
    return bskyRequest({
      endpoint: "/app.bsky.feed.searchPosts",
      method: "GET",
      query: { q: input.query, limit: input.limit ?? 25 }
    });
  }
  static async getPostThread(input) {
    validatePlatformInput("bluesky", "getPostThread", input);
    return bskyRequest({
      endpoint: "/app.bsky.feed.getPostThread",
      method: "GET",
      query: { uri: input.uri, depth: input.depth ?? 6 }
    });
  }
  static async getNotificationFeed(input) {
    validatePlatformInput("bluesky", "getNotificationFeed", input);
    return bskyRequest({
      endpoint: "/app.bsky.notification.listNotifications",
      method: "GET",
      query: { limit: input.limit ?? 25 }
    });
  }
  static async schedulePost(input) {
    validatePlatformInput("bluesky", "schedulePost", input);
    return scheduleTask({
      id: `bluesky-schedule-${Date.now()}`,
      runAt: input.publishAt,
      task: async () => _Bluesky.postText({ text: input.text })
    });
  }
};

// src/platforms/mastodon.ts
import axios7 from "axios";
function baseUrl() {
  if (!env.mastodon.baseUrl) {
    throw new SocialError({
      platform: "mastodon",
      endpoint: "baseUrl",
      message: "Missing MASTODON_BASE_URL."
    });
  }
  return env.mastodon.baseUrl.replace(/\/$/, "");
}
function mastodonHeaders(extra) {
  if (!env.mastodon.accessToken) {
    throw new SocialError({
      platform: "mastodon",
      endpoint: "auth",
      message: "Missing MASTODON_ACCESS_TOKEN."
    });
  }
  return {
    Authorization: `Bearer ${env.mastodon.accessToken}`,
    ...extra
  };
}
async function mastodonRequest(params) {
  return withRetries({
    platform: "mastodon",
    endpoint: params.endpoint,
    execute: async () => {
      try {
        const response = await axios7.request({
          baseURL: `${baseUrl()}/api/v1`,
          url: params.endpoint,
          method: params.method,
          params: params.query,
          data: params.data,
          headers: mastodonHeaders(params.headers)
        });
        return response.data;
      } catch (error) {
        throw SocialError.normalize({
          platform: "mastodon",
          endpoint: params.endpoint,
          error
        });
      }
    }
  });
}
var Mastodon = class _Mastodon {
  static async createStatus(input) {
    validatePlatformInput("mastodon", "createStatus", input);
    return mastodonRequest({
      endpoint: "/statuses",
      method: "POST",
      data: {
        status: input.text,
        visibility: input.visibility ?? "public"
      }
    });
  }
  static async uploadMedia(input) {
    validatePlatformInput("mastodon", "uploadMedia", input);
    const { fileSize } = getFileMeta(input.mediaPath);
    return withRetries({
      platform: "mastodon",
      endpoint: "/media",
      execute: async () => {
        const response = await axios7.post(
          `${baseUrl()}/api/v2/media`,
          createUploadStream(input.mediaPath),
          {
            headers: mastodonHeaders({
              "Content-Length": String(fileSize),
              "Content-Type": "application/octet-stream"
            }),
            maxBodyLength: Infinity
          }
        );
        return response.data;
      }
    });
  }
  static async createMediaStatus(input) {
    validatePlatformInput("mastodon", "createMediaStatus", input);
    return mastodonRequest({
      endpoint: "/statuses",
      method: "POST",
      data: {
        status: input.text,
        media_ids: input.mediaIds,
        visibility: input.visibility ?? "public"
      }
    });
  }
  static async replyToStatus(input) {
    validatePlatformInput("mastodon", "replyToStatus", input);
    return mastodonRequest({
      endpoint: "/statuses",
      method: "POST",
      data: {
        status: input.text,
        in_reply_to_id: input.statusId
      }
    });
  }
  static async deleteStatus(input) {
    validatePlatformInput("mastodon", "deleteStatus", input);
    const raw = await mastodonRequest({
      endpoint: `/statuses/${input.statusId}`,
      method: "DELETE"
    });
    return normalizeDeleteResult({ platform: "mastodon", targetId: input.statusId, raw });
  }
  static async favouriteStatus(input) {
    validatePlatformInput("mastodon", "favouriteStatus", input);
    return mastodonRequest({
      endpoint: `/statuses/${input.statusId}/favourite`,
      method: "POST"
    });
  }
  static async unfavouriteStatus(input) {
    validatePlatformInput("mastodon", "unfavouriteStatus", input);
    return mastodonRequest({
      endpoint: `/statuses/${input.statusId}/unfavourite`,
      method: "POST"
    });
  }
  static async boostStatus(input) {
    validatePlatformInput("mastodon", "boostStatus", input);
    return mastodonRequest({
      endpoint: `/statuses/${input.statusId}/reblog`,
      method: "POST"
    });
  }
  static async unboostStatus(input) {
    validatePlatformInput("mastodon", "unboostStatus", input);
    return mastodonRequest({
      endpoint: `/statuses/${input.statusId}/unreblog`,
      method: "POST"
    });
  }
  static async listMyStatuses(input) {
    validatePlatformInput("mastodon", "listMyStatuses", input);
    const accountId = env.mastodon.accountId;
    if (!accountId) {
      throw new SocialError({
        platform: "mastodon",
        endpoint: "accountId",
        message: "Missing MASTODON_ACCOUNT_ID."
      });
    }
    return mastodonRequest({
      endpoint: `/accounts/${accountId}/statuses`,
      method: "GET",
      query: { limit: input.limit ?? 20 }
    });
  }
  static async getStatusContext(input) {
    validatePlatformInput("mastodon", "getStatusContext", input);
    return mastodonRequest({
      endpoint: `/statuses/${input.statusId}/context`,
      method: "GET"
    });
  }
  static async getAccountAnalytics(input) {
    validatePlatformInput("mastodon", "getAccountAnalytics", input);
    const raw = await mastodonRequest({
      endpoint: "/accounts/verify_credentials",
      method: "GET",
      query: { scope: input.instanceScope ?? "day" }
    });
    return normalizeDetailResult({ platform: "mastodon", raw });
  }
  static async scheduleStatus(input) {
    validatePlatformInput("mastodon", "scheduleStatus", input);
    return scheduleTask({
      id: `mastodon-schedule-${Date.now()}`,
      runAt: input.publishAt,
      task: async () => _Mastodon.createStatus({ text: input.text })
    });
  }
};

// src/platforms/threads.ts
import axios8 from "axios";
function graphBase() {
  return `https://graph.facebook.com/${env.meta.graphVersion}`;
}
function threadsUserIdOrThrow(inputUserId) {
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
async function threadsRequest(params) {
  return withRetries({
    platform: "threads",
    endpoint: params.endpoint,
    execute: async () => {
      try {
        const response = await axios8.request({
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
async function createContainer(params) {
  return threadsRequest({
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
async function publishContainer2(threadsUserId, creationId) {
  return threadsRequest({
    endpoint: `/${threadsUserId}/threads_publish`,
    method: "POST",
    data: { creation_id: creationId }
  });
}
var Threads = class _Threads {
  static async postText(input) {
    validatePlatformInput("threads", "postText", input);
    const threadsUserId = threadsUserIdOrThrow(input.threadsUserId);
    const container = await createContainer({
      threadsUserId,
      mediaType: "TEXT",
      text: input.text
    });
    return publishContainer2(threadsUserId, container.id);
  }
  static async postImage(input) {
    validatePlatformInput("threads", "postImage", input);
    const threadsUserId = threadsUserIdOrThrow(input.threadsUserId);
    const container = await createContainer({
      threadsUserId,
      mediaType: "IMAGE",
      text: input.text,
      imageUrl: input.imageUrl
    });
    return publishContainer2(threadsUserId, container.id);
  }
  static async postVideo(input) {
    validatePlatformInput("threads", "postVideo", input);
    const threadsUserId = threadsUserIdOrThrow(input.threadsUserId);
    const container = await createContainer({
      threadsUserId,
      mediaType: "VIDEO",
      text: input.text,
      videoUrl: input.videoUrl
    });
    return publishContainer2(threadsUserId, container.id);
  }
  static async replyToThread(input) {
    validatePlatformInput("threads", "replyToThread", input);
    const threadsUserId = threadsUserIdOrThrow(input.threadsUserId);
    const container = await createContainer({
      threadsUserId,
      mediaType: "TEXT",
      text: input.text,
      replyToId: input.threadId
    });
    return publishContainer2(threadsUserId, container.id);
  }
  static async deleteThread(input) {
    validatePlatformInput("threads", "deleteThread", input);
    const raw = await threadsRequest({
      endpoint: `/${input.threadId}`,
      method: "DELETE"
    });
    return normalizeDeleteResult({ platform: "threads", targetId: input.threadId, raw });
  }
  static async getThread(input) {
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
  static async listMyThreads(input) {
    validatePlatformInput("threads", "listMyThreads", input);
    const threadsUserId = threadsUserIdOrThrow(input.threadsUserId);
    return threadsRequest({
      endpoint: `/${threadsUserId}/threads`,
      method: "GET",
      query: { limit: input.limit ?? 25 }
    });
  }
  static async getThreadInsights(input) {
    validatePlatformInput("threads", "getThreadInsights", input);
    return threadsRequest({
      endpoint: `/${input.threadId}/insights`,
      method: "GET",
      query: {
        metric: (input.metrics ?? ["views", "likes", "replies", "reposts"]).join(",")
      }
    });
  }
  static async getAccountInsights(input) {
    validatePlatformInput("threads", "getAccountInsights", input);
    const threadsUserId = threadsUserIdOrThrow(input.threadsUserId);
    return threadsRequest({
      endpoint: `/${threadsUserId}/threads_insights`,
      method: "GET",
      query: {
        metric: (input.metrics ?? ["views", "followers_count", "likes"]).join(","),
        period: input.period ?? "day"
      }
    });
  }
  static async likeThread(input) {
    validatePlatformInput("threads", "likeThread", input);
    const raw = await threadsRequest({
      endpoint: `/${input.threadId}/likes`,
      method: "POST"
    });
    return normalizeActionResult({ platform: "threads", action: "likeThread", raw });
  }
  static async unlikeThread(input) {
    validatePlatformInput("threads", "unlikeThread", input);
    const raw = await threadsRequest({
      endpoint: `/${input.threadId}/likes`,
      method: "DELETE"
    });
    return normalizeDeleteResult({ platform: "threads", targetId: input.threadId, raw });
  }
  static async scheduleTextPost(input) {
    validatePlatformInput("threads", "scheduleTextPost", input);
    return scheduleTask({
      id: `threads-schedule-${Date.now()}`,
      runAt: input.publishAt,
      task: async () => _Threads.postText({
        threadsUserId: input.threadsUserId,
        text: input.text
      })
    });
  }
};

// src/webhooks/signature.ts
import { createHmac, timingSafeEqual } from "crypto";
function toBuffer(value) {
  return Buffer.from(value, "utf8");
}
function safeCompare(a, b) {
  const aBuf = toBuffer(a);
  const bBuf = toBuffer(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}
function normalizePayload(payload) {
  return typeof payload === "string" ? payload : payload.toString("utf8");
}
function verifyMetaWebhookSignature(params) {
  if (!params.signatureHeader || !params.appSecret) {
    return false;
  }
  const payload = normalizePayload(params.payload);
  const digest = createHmac("sha256", params.appSecret).update(payload).digest("hex");
  const expected = `sha256=${digest}`;
  return safeCompare(expected, params.signatureHeader.trim());
}
function verifyXWebhookSignature(params) {
  if (!params.signatureHeader || !params.consumerSecret) {
    return false;
  }
  const payload = normalizePayload(params.payload);
  const digest = createHmac("sha256", params.consumerSecret).update(payload).digest("base64");
  const header = params.signatureHeader.trim().replace(/^sha256=/i, "");
  return safeCompare(digest, header);
}

// src/webhooks/normalize.ts
function asRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value;
}
function normalizeMetaWebhook(body) {
  const root = asRecord(body);
  const entries = Array.isArray(root?.entry) ? root?.entry : [];
  const events = [];
  for (const entry of entries) {
    const entryRecord = asRecord(entry);
    const entryId = typeof entryRecord?.id === "string" ? entryRecord.id : void 0;
    const timestamp = typeof entryRecord?.time === "number" ? entryRecord.time : void 0;
    const changes = Array.isArray(entryRecord?.changes) ? entryRecord.changes : [];
    for (const change of changes) {
      const changeRecord = asRecord(change);
      const field = typeof changeRecord?.field === "string" ? changeRecord.field : "change";
      events.push({
        platform: "meta",
        type: `meta.${field}`,
        id: entryId,
        timestamp,
        payload: changeRecord?.value ?? changeRecord,
        raw: body
      });
    }
    const messaging = Array.isArray(entryRecord?.messaging) ? entryRecord.messaging : [];
    for (const item of messaging) {
      events.push({
        platform: "meta",
        type: "meta.messaging",
        id: entryId,
        timestamp,
        payload: item,
        raw: body
      });
    }
  }
  if (events.length === 0) {
    events.push({
      platform: "meta",
      type: "meta.unknown",
      payload: body,
      raw: body
    });
  }
  return events;
}
function normalizeXWebhook(body) {
  const root = asRecord(body);
  if (!root) {
    return [
      {
        platform: "x",
        type: "x.unknown",
        payload: body,
        raw: body
      }
    ];
  }
  const events = [];
  for (const [key, value] of Object.entries(root)) {
    if (key === "for_user_id") {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        events.push({
          platform: "x",
          type: `x.${key}`,
          payload: item,
          raw: body
        });
      }
      continue;
    }
    events.push({
      platform: "x",
      type: `x.${key}`,
      payload: value,
      raw: body
    });
  }
  if (events.length === 0) {
    events.push({
      platform: "x",
      type: "x.unknown",
      payload: body,
      raw: body
    });
  }
  return events;
}
function normalizeWebhook(platform, body) {
  if (platform === "meta") {
    return normalizeMetaWebhook(body);
  }
  return normalizeXWebhook(body);
}

// src/webhooks/router.ts
var WebhookRouter = class {
  handlers = /* @__PURE__ */ new Map();
  on(type, handler) {
    const existing = this.handlers.get(type) ?? [];
    existing.push(handler);
    this.handlers.set(type, existing);
    return this;
  }
  async dispatch(events) {
    for (const event of events) {
      const typedHandlers = this.handlers.get(event.type) ?? [];
      const wildcardHandlers = this.handlers.get("*") ?? [];
      for (const handler of [...typedHandlers, ...wildcardHandlers]) {
        await handler(event);
      }
    }
  }
  async handle(platform, body) {
    const events = normalizeWebhook(platform, body);
    await this.dispatch(events);
  }
  async handleMeta(params) {
    const valid = verifyMetaWebhookSignature({
      payload: params.payload,
      signatureHeader: params.signatureHeader,
      appSecret: params.appSecret
    });
    if (!valid) {
      throw new SocialError({
        platform: "facebook",
        endpoint: "webhooks.meta.verify",
        message: "Invalid Meta webhook signature."
      });
    }
    await this.handle("meta", params.body);
  }
  async handleX(params) {
    const valid = verifyXWebhookSignature({
      payload: params.payload,
      signatureHeader: params.signatureHeader,
      consumerSecret: params.consumerSecret
    });
    if (!valid) {
      throw new SocialError({
        platform: "x",
        endpoint: "webhooks.x.verify",
        message: "Invalid X webhook signature."
      });
    }
    await this.handle("x", params.body);
  }
};
export {
  Bluesky,
  BullMQAdapter,
  Facebook,
  InMemoryQueueAdapter,
  Instagram,
  LinkedIn,
  Mastodon,
  Pinterest,
  SQSAdapter,
  SocialError,
  Threads,
  TikTok,
  WebhookRouter,
  X,
  YouTube,
  getQueueAdapter,
  normalizeMetaWebhook,
  normalizeWebhook,
  normalizeXWebhook,
  resetQueueAdapter,
  setQueueAdapter,
  verifyMetaWebhookSignature,
  verifyXWebhookSignature
};
//# sourceMappingURL=index.js.map