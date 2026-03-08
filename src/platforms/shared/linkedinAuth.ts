import axios from "axios";
import { env } from "../../config/env.js";
import { SocialError } from "../../errors/SocialError.js";

const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";

let accessTokenCache = env.linkedin.accessToken;
let expiryEpochMs = 0;

export function getLinkedInHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${accessTokenCache}`,
    "Content-Type": "application/json",
    "Linkedin-Version": env.linkedin.apiVersion,
    "X-Restli-Protocol-Version": "2.0.0"
  };
}

export async function getLinkedInAccessToken(): Promise<string> {
  const stillValid =
    accessTokenCache.length > 0 && Date.now() < expiryEpochMs - 30_000;

  if (stillValid) {
    return accessTokenCache;
  }

  if (!env.linkedin.refreshToken) {
    if (!accessTokenCache) {
      throw new SocialError({
        platform: "linkedin",
        endpoint: "oauth/token",
        message:
          "Missing LinkedIn credentials. Provide LINKEDIN_ACCESS_TOKEN or refresh-token credentials."
      });
    }
    return accessTokenCache;
  }

  if (!env.linkedin.clientId || !env.linkedin.clientSecret) {
    throw new SocialError({
      platform: "linkedin",
      endpoint: "oauth/token",
      message:
        "Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET for token refresh."
    });
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: env.linkedin.refreshToken,
    client_id: env.linkedin.clientId,
    client_secret: env.linkedin.clientSecret
  });

  try {
    const response = await axios.post<{
      access_token: string;
      expires_in: number;
    }>(LINKEDIN_TOKEN_URL, body.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    accessTokenCache = response.data.access_token;
    expiryEpochMs = Date.now() + response.data.expires_in * 1000;
    return accessTokenCache;
  } catch (error) {
    throw SocialError.normalize({
      platform: "linkedin",
      endpoint: "oauth/token",
      error
    });
  }
}
