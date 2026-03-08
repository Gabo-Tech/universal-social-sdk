import { TwitterApi } from "twitter-api-v2";
import { env } from "../config/env.js";
import { SocialError } from "../errors/SocialError.js";
import type {
  XActionResult,
  XDeleteTweetResult,
  XPostResult,
  XThreadResult,
  XTweetAnalyticsResult,
  XUploadMediaResult
} from "../responseTypes.js";
import { createUploadStream } from "../utils/file.js";
import {
  normalizeActionResult,
  normalizeDeleteResult
} from "../utils/normalizedResult.js";
import { withRetries } from "../utils/retry.js";
import { scheduleTask } from "../utils/scheduler.js";
import { validatePlatformInput } from "../validation/platformSchemas.js";

interface PostTweetInput {
  text: string;
  mediaIds?: string[];
}

interface ReplyTweetInput {
  text: string;
  inReplyToTweetId: string;
}

interface QuoteTweetInput {
  text: string;
  quoteTweetId: string;
}

interface PostMediaInput {
  mediaPath: string;
  text: string;
}

interface PollTweetInput {
  text: string;
  options: string[];
  durationMinutes: number;
}

let client: TwitterApi | null = null;

function getClient(): TwitterApi {
  if (client) {
    return client;
  }
  if (!env.x.apiKey || !env.x.apiSecret || !env.x.accessToken || !env.x.accessSecret) {
    throw new SocialError({
      platform: "x",
      endpoint: "auth",
      message:
        "Missing X credentials. Required: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET."
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

async function uploadMediaInternal(mediaPath: string): Promise<string> {
  const rw = getClient().readWrite as any;
  return withRetries({
    platform: "x",
    endpoint: "v1.1/media/upload",
    execute: async () => rw.v1.uploadMedia(createUploadStream(mediaPath))
  });
}

export class X {
  static async postTweet(input: PostTweetInput): Promise<XPostResult> {
    validatePlatformInput("x", "postTweet", input);
    const rw = getClient().readWrite as any;
    return withRetries({
      platform: "x",
      endpoint: "POST /2/tweets",
      execute: async () => rw.v2.tweet({ text: input.text, media: input.mediaIds ? { media_ids: input.mediaIds } : undefined })
    });
  }

  static async postThread(input: { tweets: string[] }): Promise<XThreadResult> {
    validatePlatformInput("x", "postThread", input);
    let previousId: string | undefined;
    const published: XPostResult[] = [];
    for (const text of input.tweets) {
      const payload = previousId ? { text, reply: { in_reply_to_tweet_id: previousId } } : { text };
      const rw = getClient().readWrite as any;
      const result = (await rw.v2.tweet(payload)) as XPostResult;
      published.push(result);
      previousId = result?.data?.id;
    }
    return published;
  }

  static async replyTweet(input: ReplyTweetInput): Promise<XPostResult> {
    validatePlatformInput("x", "replyTweet", input);
    const rw = getClient().readWrite as any;
    return withRetries({
      platform: "x",
      endpoint: "POST /2/tweets",
      execute: async () => rw.v2.tweet({ text: input.text, reply: { in_reply_to_tweet_id: input.inReplyToTweetId } })
    });
  }

  static async quoteTweet(input: QuoteTweetInput): Promise<XPostResult> {
    validatePlatformInput("x", "quoteTweet", input);
    const rw = getClient().readWrite as any;
    return withRetries({
      platform: "x",
      endpoint: "POST /2/tweets",
      execute: async () => rw.v2.tweet({ text: input.text, quote_tweet_id: input.quoteTweetId })
    });
  }

  static async deleteTweet(input: { tweetId: string }): Promise<XDeleteTweetResult> {
    validatePlatformInput("x", "deleteTweet", input);
    const rw = getClient().readWrite as any;
    const raw = await withRetries({
      platform: "x",
      endpoint: "DELETE /2/tweets/:id",
      execute: async () => rw.v2.deleteTweet(input.tweetId)
    });
    return normalizeDeleteResult({ platform: "x", targetId: input.tweetId, raw });
  }

  static async retweet(input: {
    userId: string;
    tweetId: string;
  }): Promise<XActionResult> {
    validatePlatformInput("x", "retweet", input);
    const rw = getClient().readWrite as any;
    const raw = await withRetries({
      platform: "x",
      endpoint: "POST /2/users/:id/retweets",
      execute: async () => rw.v2.retweet(input.userId, input.tweetId)
    });
    return normalizeActionResult({ platform: "x", action: "retweet", raw });
  }

  static async unretweet(input: {
    userId: string;
    tweetId: string;
  }): Promise<XActionResult> {
    validatePlatformInput("x", "unretweet", input);
    const rw = getClient().readWrite as any;
    const raw = await withRetries({
      platform: "x",
      endpoint: "DELETE /2/users/:id/retweets/:tweet_id",
      execute: async () => rw.v2.unretweet(input.userId, input.tweetId)
    });
    return normalizeActionResult({ platform: "x", action: "unretweet", raw });
  }

  static async likeTweet(input: {
    userId: string;
    tweetId: string;
  }): Promise<XActionResult> {
    validatePlatformInput("x", "likeTweet", input);
    const rw = getClient().readWrite as any;
    const raw = await withRetries({
      platform: "x",
      endpoint: "POST /2/users/:id/likes",
      execute: async () => rw.v2.like(input.userId, input.tweetId)
    });
    return normalizeActionResult({ platform: "x", action: "like", raw });
  }

  static async unlikeTweet(input: {
    userId: string;
    tweetId: string;
  }): Promise<XActionResult> {
    validatePlatformInput("x", "unlikeTweet", input);
    const rw = getClient().readWrite as any;
    const raw = await withRetries({
      platform: "x",
      endpoint: "DELETE /2/users/:id/likes/:tweet_id",
      execute: async () => rw.v2.unlike(input.userId, input.tweetId)
    });
    return normalizeActionResult({ platform: "x", action: "unlike", raw });
  }

  static async uploadMedia(
    input: { mediaPath: string }
  ): Promise<XUploadMediaResult> {
    validatePlatformInput("x", "uploadMedia", input);
    return uploadMediaInternal(input.mediaPath);
  }

  static async postPhoto(input: PostMediaInput): Promise<XPostResult> {
    validatePlatformInput("x", "postPhoto", input);
    const mediaId = await uploadMediaInternal(input.mediaPath);
    return X.postTweet({ text: input.text, mediaIds: [mediaId] });
  }

  static async postVideo(input: PostMediaInput): Promise<XPostResult> {
    validatePlatformInput("x", "postVideo", input);
    const mediaId = await uploadMediaInternal(input.mediaPath);
    return X.postTweet({ text: input.text, mediaIds: [mediaId] });
  }

  static async postPoll(input: PollTweetInput): Promise<XPostResult> {
    validatePlatformInput("x", "postPoll", input);
    const rw = getClient().readWrite as any;
    return withRetries({
      platform: "x",
      endpoint: "POST /2/tweets",
      execute: async () =>
        rw.v2.tweet({
          text: input.text,
          poll: {
            options: input.options,
            duration_minutes: input.durationMinutes
          }
        })
    });
  }

  static async sendDirectMessage(input: {
    recipientId: string;
    text: string;
  }): Promise<XActionResult> {
    validatePlatformInput("x", "sendDirectMessage", input);
    const rw = getClient().readWrite as any;
    const raw = await withRetries({
      platform: "x",
      endpoint: "POST /2/dm_conversations/with/:participant_id/messages",
      execute: async () =>
        rw.v2.post(`dm_conversations/with/${input.recipientId}/messages`, {
          text: input.text
        })
    });
    return normalizeActionResult({ platform: "x", action: "sendDirectMessage", raw });
  }

  static async getTweetAnalytics(
    input: { tweetId: string }
  ): Promise<XTweetAnalyticsResult> {
    validatePlatformInput("x", "getTweetAnalytics", input);
    const ro = getClient().readOnly as any;
    return withRetries({
      platform: "x",
      endpoint: "GET /2/tweets/:id",
      execute: async () =>
        ro.v2.singleTweet(input.tweetId, {
          "tweet.fields": ["public_metrics", "created_at", "organic_metrics", "non_public_metrics"]
        })
    });
  }

  static async scheduleTweet(input: {
    text: string;
    publishAt: Date | string;
  }): Promise<XPostResult> {
    validatePlatformInput("x", "scheduleTweet", input);
    const jobId = `x-schedule-${Date.now()}`;
    return scheduleTask({
      id: jobId,
      runAt: input.publishAt,
      task: async () => X.postTweet({ text: input.text })
    });
  }
}
