import dotenv from "dotenv";

dotenv.config();

function readNumberEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readListEnv(name: string): string[] {
  const value = process.env[name];
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveLlmProvider(): "ollama" | "openrouter" {
  const provider = process.env.UPDATER_LLM_PROVIDER;
  if (provider === "openrouter" || provider === "ollama") {
    return provider;
  }
  return process.env.UPDATER_LLM_API_KEY || process.env.OPENROUTER_API_KEY
    ? "openrouter"
    : "ollama";
}

const llmProvider = resolveLlmProvider();

export const env = {
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
  llm: {
    provider: llmProvider,
    baseUrl: process.env.UPDATER_LLM_BASE_URL ?? "https://openrouter.ai/api/v1",
    apiKey: process.env.UPDATER_LLM_API_KEY ?? process.env.OPENROUTER_API_KEY ?? "",
    model:
      process.env.UPDATER_LLM_MODEL ??
      process.env.OPENROUTER_MODEL ??
      process.env.OLLAMA_MODEL ??
      (llmProvider === "openrouter"
        ? "google/gemma-3-4b-it:free"
        : "llama3.2:3b"),
    appName:
      process.env.UPDATER_LLM_APP_NAME ??
      "universal-social-sdk-updater",
    appUrl:
      process.env.UPDATER_LLM_APP_URL ??
      "https://github.com/Gabo-Tech/universal-social-sdk",
    maxTokens: readNumberEnv("UPDATER_LLM_MAX_TOKENS", 1200),
    maxDocCharsPerPage: readNumberEnv("UPDATER_LLM_MAX_DOC_CHARS_PER_PAGE", 6000),
    maxEndpointRowsPerPage: readNumberEnv(
      "UPDATER_LLM_MAX_ENDPOINT_ROWS_PER_PAGE",
      40
    ),
    fallbackModels: readListEnv("UPDATER_LLM_FALLBACK_MODELS"),
    maxModelAttempts: readNumberEnv("UPDATER_LLM_MAX_MODEL_ATTEMPTS", 4)
  },
  ollama: {
    host: process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434",
    model: process.env.OLLAMA_MODEL ?? "llama3.2:3b"
  }
};

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
