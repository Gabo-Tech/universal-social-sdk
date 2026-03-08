import axios from "axios";
import { env } from "../config/env.js";
import { SocialError } from "../errors/SocialError.js";
import { normalizeActionResult } from "../utils/normalizedResult.js";
import { withRetries } from "../utils/retry.js";
import { scheduleTask } from "../utils/scheduler.js";
import { validatePlatformInput } from "../validation/platformSchemas.js";
import type {
  BlueskyDeleteResult,
  BlueskyFeedResult,
  BlueskyNotificationsResult,
  BlueskyRecordResult,
  BlueskySearchResult,
  BlueskyThreadResult
} from "../responseTypes.js";

const DEFAULT_SERVICE = "https://bsky.social";

function serviceBase() {
  return `${env.bluesky.serviceUrl || DEFAULT_SERVICE}/xrpc`;
}

let accessJwt = env.bluesky.accessJwt;
let did = "";

async function ensureSession(): Promise<{ accessJwt: string; did: string }> {
  if (accessJwt && did) {
    return { accessJwt, did };
  }
  if (!env.bluesky.identifier || !env.bluesky.appPassword) {
    throw new SocialError({
      platform: "bluesky",
      endpoint: "createSession",
      message:
        "Missing Bluesky session credentials. Set BLUESKY_IDENTIFIER and BLUESKY_APP_PASSWORD, or provide BLUESKY_ACCESS_JWT."
    });
  }
  const response = await axios.post(`${serviceBase()}/com.atproto.server.createSession`, {
    identifier: env.bluesky.identifier,
    password: env.bluesky.appPassword
  });
  accessJwt = response.data.accessJwt as string;
  did = response.data.did as string;
  return { accessJwt, did };
}

async function bskyRequest<T = unknown>(params: {
  endpoint: string;
  method: "GET" | "POST";
  data?: unknown;
  query?: Record<string, unknown>;
}) {
  const session = await ensureSession();
  return withRetries({
    platform: "bluesky",
    endpoint: params.endpoint,
    execute: async () => {
      try {
        const response = await axios.request<T>({
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

async function createRecord(
  collection: string,
  record: Record<string, unknown>
): Promise<BlueskyRecordResult> {
  const session = await ensureSession();
  return bskyRequest<BlueskyRecordResult>({
    endpoint: "/com.atproto.repo.createRecord",
    method: "POST",
    data: {
      repo: session.did,
      collection,
      record
    }
  });
}

export class Bluesky {
  static async postText(input: { text: string }): Promise<BlueskyRecordResult> {
    validatePlatformInput("bluesky", "postText", input);
    return createRecord("app.bsky.feed.post", {
      $type: "app.bsky.feed.post",
      text: input.text,
      createdAt: new Date().toISOString()
    });
  }

  static async postWithLink(input: {
    text: string;
    url: string;
  }): Promise<BlueskyRecordResult> {
    validatePlatformInput("bluesky", "postWithLink", input);
    return createRecord("app.bsky.feed.post", {
      $type: "app.bsky.feed.post",
      text: `${input.text}\n${input.url}`,
      createdAt: new Date().toISOString()
    });
  }

  static async replyToPost(input: {
    text: string;
    rootUri: string;
    rootCid: string;
    parentUri: string;
    parentCid: string;
  }): Promise<BlueskyRecordResult> {
    validatePlatformInput("bluesky", "replyToPost", input);
    return createRecord("app.bsky.feed.post", {
      $type: "app.bsky.feed.post",
      text: input.text,
      createdAt: new Date().toISOString(),
      reply: {
        root: { uri: input.rootUri, cid: input.rootCid },
        parent: { uri: input.parentUri, cid: input.parentCid }
      }
    });
  }

  static async likePost(input: {
    subjectUri: string;
    subjectCid: string;
  }): Promise<BlueskyRecordResult> {
    validatePlatformInput("bluesky", "likePost", input);
    return createRecord("app.bsky.feed.like", {
      $type: "app.bsky.feed.like",
      subject: { uri: input.subjectUri, cid: input.subjectCid },
      createdAt: new Date().toISOString()
    });
  }

  static async repost(input: {
    subjectUri: string;
    subjectCid: string;
  }): Promise<BlueskyRecordResult> {
    validatePlatformInput("bluesky", "repost", input);
    return createRecord("app.bsky.feed.repost", {
      $type: "app.bsky.feed.repost",
      subject: { uri: input.subjectUri, cid: input.subjectCid },
      createdAt: new Date().toISOString()
    });
  }

  static async deleteRecord(
    input: { uri: string }
  ): Promise<BlueskyDeleteResult> {
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

  static async getAuthorFeed(input: {
    actorDidOrHandle: string;
    limit?: number;
  }): Promise<BlueskyFeedResult> {
    validatePlatformInput("bluesky", "getAuthorFeed", input);
    return bskyRequest<BlueskyFeedResult>({
      endpoint: "/app.bsky.feed.getAuthorFeed",
      method: "GET",
      query: {
        actor: input.actorDidOrHandle,
        limit: input.limit ?? 25
      }
    });
  }

  static async searchPosts(input: {
    query: string;
    limit?: number;
  }): Promise<BlueskySearchResult> {
    validatePlatformInput("bluesky", "searchPosts", input);
    return bskyRequest<BlueskySearchResult>({
      endpoint: "/app.bsky.feed.searchPosts",
      method: "GET",
      query: { q: input.query, limit: input.limit ?? 25 }
    });
  }

  static async getPostThread(input: {
    uri: string;
    depth?: number;
  }): Promise<BlueskyThreadResult> {
    validatePlatformInput("bluesky", "getPostThread", input);
    return bskyRequest<BlueskyThreadResult>({
      endpoint: "/app.bsky.feed.getPostThread",
      method: "GET",
      query: { uri: input.uri, depth: input.depth ?? 6 }
    });
  }

  static async getNotificationFeed(input: {
    limit?: number;
  }): Promise<BlueskyNotificationsResult> {
    validatePlatformInput("bluesky", "getNotificationFeed", input);
    return bskyRequest<BlueskyNotificationsResult>({
      endpoint: "/app.bsky.notification.listNotifications",
      method: "GET",
      query: { limit: input.limit ?? 25 }
    });
  }

  static async schedulePost(input: {
    text: string;
    publishAt: Date | string;
  }): Promise<BlueskyRecordResult> {
    validatePlatformInput("bluesky", "schedulePost", input);
    return scheduleTask({
      id: `bluesky-schedule-${Date.now()}`,
      runAt: input.publishAt,
      task: async () => Bluesky.postText({ text: input.text })
    });
  }
}
