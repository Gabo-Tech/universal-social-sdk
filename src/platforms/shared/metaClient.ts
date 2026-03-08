import bizSdk from "facebook-nodejs-business-sdk";
import { env } from "../../config/env.js";
import { SocialError } from "../../errors/SocialError.js";
import { withRetries } from "../../utils/retry.js";

const { FacebookAdsApi } = bizSdk;

let didInit = false;

function ensureInit(): void {
  if (!didInit) {
    const token = env.meta.fbPageToken || env.meta.igToken;
    if (!token) {
      throw new SocialError({
        platform: "facebook",
        endpoint: "meta:init",
        message:
          "Missing FB_PAGE_ACCESS_TOKEN or IG_ACCESS_TOKEN for Meta SDK initialization."
      });
    }
    FacebookAdsApi.init(token);
    didInit = true;
  }
}

export async function metaCall<T = unknown>(params: {
  endpoint: string;
  method: "GET" | "POST" | "DELETE";
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  platform: "facebook" | "instagram";
}): Promise<T> {
  ensureInit();
  const api = FacebookAdsApi.getDefaultApi();
  const endpointPath = `/${env.meta.graphVersion}${params.endpoint}`;

  return withRetries({
    platform: params.platform,
    endpoint: endpointPath,
    execute: async () => {
      try {
        return (await api.call(
          params.method,
          endpointPath,
          params.query ?? {},
          params.body ?? {}
        )) as T;
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
