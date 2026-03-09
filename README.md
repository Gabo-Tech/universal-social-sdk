# universal-social-sdk

TypeScript-first, ESM-only, zero-bloat Node.js SDK that provides one unified interface for X, Facebook, Instagram, LinkedIn, YouTube, TikTok, Pinterest, Bluesky, Mastodon, and Threads.

[![CI](https://github.com/Gabo-Tech/universal-social-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/Gabo-Tech/universal-social-sdk/actions/workflows/ci.yml)
[![Release](https://github.com/Gabo-Tech/universal-social-sdk/actions/workflows/release.yml/badge.svg)](https://github.com/Gabo-Tech/universal-social-sdk/actions/workflows/release.yml)

## Documentation

- [Project Structure](./docs/PROJECT_STRUCTURE.md)
- [NPM Package Guide](./docs/NPM_PACKAGE_GUIDE.md)
- [Response Contracts](./docs/RESPONSE_CONTRACTS.md)
- [Contributing](./docs/CONTRIBUTING.md)
- [Roadmap v1.1.0](./docs/ROADMAP_v1.1.0.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security Policy](./SECURITY.md)
- [Changelog](./CHANGELOG.md)

## Install

```bash
npm install universal-social-sdk
```

## Quick Start

```ts
import { Instagram, X, Facebook, LinkedIn } from "universal-social-sdk";

await X.postTweet({ text: "Hello from universal SDK!" });
await Instagram.uploadReel({
  videoUrl: "https://example.com/reel.mp4",
  caption: "Hello world"
});
await Facebook.publishToPage({
  message: "Shipping updates from one SDK"
});
await LinkedIn.createTextPost({
  text: "Cross-platform publishing with one API"
});

import { YouTube, TikTok, Pinterest, Bluesky, Mastodon, Threads } from "universal-social-sdk";

await YouTube.listMyVideos({ maxResults: 5 });
await TikTok.listVideos({ maxCount: 10 });
await Pinterest.listBoards({});
await Bluesky.postText({ text: "Hello AT Protocol!" });
await Mastodon.createStatus({ text: "Hello Fediverse!" });
await Threads.postText({ text: "Hello Threads!" });
```

## Examples

Run bundled examples:

```bash
npm run example:x
npm run example:instagram
npm run example:bluesky
npm run example:queue
```

Files:

- `examples/x-post.mjs`
- `examples/instagram-reel.mjs`
- `examples/bluesky-post.mjs`
- `examples/queue-in-memory.mjs`

## Queue Adapters

The scheduler uses a queue adapter. By default it uses an in-memory adapter.

```ts
import { InMemoryQueueAdapter, setQueueAdapter } from "universal-social-sdk";

setQueueAdapter(new InMemoryQueueAdapter());
```

Adapter exports:

- `InMemoryQueueAdapter` (default behavior)
- `BullMQAdapter` (skeleton)
- `SQSAdapter` (skeleton)

The scheduler APIs (for example `X.scheduleTweet`) will use the active adapter automatically.

## Typed Responses

All public SDK methods now return concrete TypeScript interfaces, including platform-specific action/delete aliases for clearer contracts.
Action/delete/mutation/detail responses are normalized into stable contracts (`success`, `action`/`targetId`/`resourceId`, `raw`) so provider endpoint changes are isolated to SDK internals.

```ts
import { X } from "universal-social-sdk";
import type { XPostResult } from "universal-social-sdk";

const result: XPostResult = await X.postTweet({ text: "typed response" });
console.log(result.data.id);
```

## Webhooks

The SDK includes webhook utilities for Meta-style and X-style signatures, normalized event parsing, and a lightweight router.

```ts
import {
  WebhookRouter,
  verifyMetaWebhookSignature,
  verifyXWebhookSignature
} from "universal-social-sdk";

const router = new WebhookRouter();

router.on("meta.feed", async (event) => {
  console.log("Meta feed event", event.payload);
});

router.on("x.tweet_create_events", async (event) => {
  console.log("X tweet event", event.payload);
});
```

## Required Environment Variables

`universal-social-sdk` auto-loads `.env` with `dotenv`.

### X / Twitter

- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_SECRET`
- `X_BEARER_TOKEN` (optional for some read-only operations)
- `X_CLIENT_ID` (OAuth 2 workflows)
- `X_CLIENT_SECRET` (OAuth 2 workflows)

### Meta (Facebook Pages + Instagram Graph)

- `META_APP_ID`
- `META_APP_SECRET`
- `FB_PAGE_ACCESS_TOKEN`
- `FB_PAGE_ID`
- `IG_ACCESS_TOKEN`
- `IG_USER_ID`
- `META_GRAPH_VERSION` (default `v21.0`)

### LinkedIn

- `LINKEDIN_ACCESS_TOKEN`
- `LINKEDIN_REFRESH_TOKEN` (recommended for long-running apps)
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_ORG_URN` or `LINKEDIN_PERSON_URN`
- `LINKEDIN_API_VERSION` (default `202510`)

### YouTube

- `YOUTUBE_ACCESS_TOKEN`
- `YOUTUBE_CHANNEL_ID`

### TikTok

- `TIKTOK_ACCESS_TOKEN`
- `TIKTOK_OPEN_ID`
- `TIKTOK_ADVERTISER_ID`

### Pinterest

- `PINTEREST_ACCESS_TOKEN`
- `PINTEREST_BOARD_ID`

### Bluesky

- `BLUESKY_SERVICE_URL` (default `https://bsky.social`)
- `BLUESKY_IDENTIFIER`
- `BLUESKY_APP_PASSWORD`
- `BLUESKY_ACCESS_JWT`
- `BLUESKY_REFRESH_JWT`

### Mastodon

- `MASTODON_BASE_URL`
- `MASTODON_ACCESS_TOKEN`
- `MASTODON_ACCOUNT_ID`

### Threads

- `THREADS_ACCESS_TOKEN`
- `THREADS_USER_ID`

### SDK / Updater

- `SOCIAL_SDK_MAX_RETRIES` (default `3`)
- `SOCIAL_SDK_RETRY_BASE_MS` (default `500`)
- `UPDATER_LLM_PROVIDER` (`openrouter` or `ollama`, default `openrouter` when API key is present, otherwise `ollama`)
- `UPDATER_LLM_BASE_URL` (default `https://openrouter.ai/api/v1`)
- `UPDATER_LLM_API_KEY` (or `OPENROUTER_API_KEY`)
- `UPDATER_LLM_MODEL` (or `OPENROUTER_MODEL`, default `google/gemma-3-4b-it:free` for OpenRouter, `llama3.2:3b` for Ollama)
- `UPDATER_LLM_APP_NAME` (optional request metadata)
- `UPDATER_LLM_APP_URL` (optional request metadata)
- `UPDATER_LLM_MAX_TOKENS` (default `1200`)
- `UPDATER_LLM_MAX_DOC_CHARS_PER_PAGE` (default `6000`)
- `UPDATER_LLM_MAX_ENDPOINT_ROWS_PER_PAGE` (default `40`)
- `UPDATER_LLM_MAX_MODEL_ATTEMPTS` (default `4`)
- `UPDATER_LLM_FALLBACK_MODELS` (comma-separated OpenRouter model IDs used after primary model fails)
- `OLLAMA_HOST` (legacy local runtime support, default `http://127.0.0.1:11434`)
- `OLLAMA_MODEL` (legacy local runtime support)

## CLI

### Bootstrap

```bash
npx universal-social-sdk init
```

Creates `.env.example`, copies it to `.env` if missing, and prints OAuth setup links:

- X Developer Portal: <https://developer.x.com/en/portal/dashboard>
- Meta Developers: <https://developers.facebook.com/apps/>
- LinkedIn Developers: <https://www.linkedin.com/developers/apps>

### Documentation Updater

```bash
npx universal-social-sdk update
```

```bash
npx universal-social-sdk update --dry-run
npx universal-social-sdk update --model llama3.2
npx universal-social-sdk update --fallback-models "google/gemma-3-4b-it:free,qwen/qwen3-4b:free"
npx universal-social-sdk update --max-model-attempts 5
npx universal-social-sdk update --yes
npx universal-social-sdk update --ci --open-pr --base main --branch-prefix chore/updater
```

Flow:

1. Crawls official docs pages for X, Meta Graph API, Instagram Graph API, and LinkedIn.
2. Extracts clean text and table-like endpoint data with Cheerio.
3. Sends doc snapshots to your configured LLM provider (OpenRouter or local runtime).
   - In OpenRouter mode, retries across a fallback model chain for `402/404/408/429` model-level failures with a short backoff between attempts.
4. Requests generated method updates + full TypeScript file content.
5. Runs safety checks to reject suspicious placeholder rewrites or destructive class replacements.
6. Shows git-style diffs and asks for confirmation.
7. Applies patches and rebuilds package.

CI/PR mode writes deterministic artifacts in `.artifacts/`:

- `update-plan.json`
- `update-diff-summary.json`
- `pr-title.txt`
- `pr-body.md`

## Supported Methods

Method coverage by platform:

- `X`: posting, threads, replies, quote posts, likes, retweets, DMs, analytics, scheduling
- `Facebook`: page publishing, stories, comments, reactions, insights, scheduled posts
- `Instagram`: media/reels/stories, carousels, comments, moderation, insights
- `LinkedIn`: text/image/video/carousel posts, comments, likes, analytics, media upload
- `YouTube`: upload sessions, metadata updates, playlists, comments, channel analytics
- `TikTok`: video publish flow, comments/replies, likes, status checks, analytics
- `Pinterest`: pin/board management, comments/replies, pin/account analytics
- `Bluesky`: text posts, links, replies, likes/reposts, feed/search/thread retrieval
- `Mastodon`: statuses, media posts, favourites/boosts, context, scheduling
- `Threads`: text/image/video posts, replies, likes, thread/account insights

Complete method list is maintained in `supported-methods.json`.

## OAuth Setup Guide

### X

1. Open <https://developer.x.com/en/portal/dashboard>.
2. Create a Project and App.
3. Enable OAuth 1.0a and OAuth 2.0, then generate user tokens.
4. Add credentials into `.env`.
5. Screenshot to keep: App keys and user token generation page.

### Meta (Facebook + Instagram Graph)

1. Open <https://developers.facebook.com/apps/>.
2. Create app, add Facebook Login + Instagram Graph API products.
3. Get Page access token (`pages_manage_posts`, `pages_read_engagement`, etc.).
4. Map Page to Instagram professional account and capture `IG_USER_ID`.
5. Screenshot to keep: App Review permissions and Access Token Debugger output.

### LinkedIn

1. Open <https://www.linkedin.com/developers/apps>.
2. Create app and add Marketing APIs / Community Management products.
3. Configure OAuth 2.0 redirect URLs and request required scopes.
4. Exchange auth code for access token (and refresh token if enabled).
5. Screenshot to keep: Products enabled page + OAuth scopes configuration.

### YouTube

1. Open <https://console.cloud.google.com/apis/library/youtube.googleapis.com>.
2. Enable YouTube Data API v3 for your project.
3. Configure OAuth consent and create OAuth client credentials.
4. Exchange user authorization for `YOUTUBE_ACCESS_TOKEN`.

### TikTok

1. Open <https://developers.tiktok.com/>.
2. Create app, configure login scopes and redirect URI.
3. Complete OAuth flow and store long-lived `TIKTOK_ACCESS_TOKEN`.

### Pinterest

1. Open <https://developers.pinterest.com/>.
2. Create app and configure OAuth redirect URI/scopes.
3. Obtain `PINTEREST_ACCESS_TOKEN` and target `PINTEREST_BOARD_ID`.

### Bluesky

1. Open <https://bsky.app/settings/app-passwords>.
2. Create an app password for your account.
3. Set `BLUESKY_IDENTIFIER` and `BLUESKY_APP_PASSWORD`.

### Mastodon

1. Register an application on your Mastodon instance.
2. Generate an access token with write/read scopes.
3. Set `MASTODON_BASE_URL`, `MASTODON_ACCESS_TOKEN`, and `MASTODON_ACCOUNT_ID`.

### Threads

1. Open <https://developers.facebook.com/docs/threads>.
2. Create app, request Threads API scopes, and generate user token.
3. Set `THREADS_ACCESS_TOKEN` and `THREADS_USER_ID`.

## Error Handling

All errors are normalized to `SocialError`.

```ts
import { SocialError, X } from "universal-social-sdk";

try {
  await X.postTweet({ text: "hello" });
} catch (error) {
  if (error instanceof SocialError) {
    console.error(error.platform, error.endpoint, error.message, error.statusCode);
  }
}
```

## Rate Limit Handling

- Automatic retries on `429` and `5xx`.
- Exponential backoff defaults: `500ms`, `1000ms`, `2000ms`.
- Configure with:
  - `SOCIAL_SDK_MAX_RETRIES`
  - `SOCIAL_SDK_RETRY_BASE_MS`

## Legal / Terms Notes

- You must comply with each platform’s Terms of Use, policy docs, and display requirements.
- Some actions require app review, partner approval, business verification, or specific account types.
- Messaging APIs (especially DMs) are often restricted to approved use cases.

## Testing

```bash
npm run test:unit
npm run test:integration
```

Integration tests are environment-gated. Create `.env.test` from `.env.test.example` and use sandbox credentials.

### Integration Test Env Matrix

| Platform | Required `.env.test` keys | Required CI secrets |
| --- | --- | --- |
| X | `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`, `X_TEST_TWEET_ID` | `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`, `X_TEST_TWEET_ID` |
| Facebook | `FB_PAGE_ACCESS_TOKEN`, `FB_PAGE_ID` | `FB_PAGE_ACCESS_TOKEN`, `FB_PAGE_ID` |
| Instagram | `IG_ACCESS_TOKEN`, `IG_USER_ID` | `IG_ACCESS_TOKEN`, `IG_USER_ID` |
| LinkedIn | `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_ORG_URN` | `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_ORG_URN` |
| YouTube | `YOUTUBE_ACCESS_TOKEN`, `YOUTUBE_CHANNEL_ID` | `YOUTUBE_ACCESS_TOKEN`, `YOUTUBE_CHANNEL_ID` |
| TikTok | `TIKTOK_ACCESS_TOKEN` | `TIKTOK_ACCESS_TOKEN` |
| Pinterest | `PINTEREST_ACCESS_TOKEN`, `PINTEREST_BOARD_ID` | `PINTEREST_ACCESS_TOKEN`, `PINTEREST_BOARD_ID` |
| Bluesky | `BLUESKY_IDENTIFIER`, `BLUESKY_APP_PASSWORD` (`BLUESKY_TEST_ACTOR` optional) | `BLUESKY_IDENTIFIER`, `BLUESKY_APP_PASSWORD`, `BLUESKY_TEST_ACTOR` |
| Mastodon | `MASTODON_BASE_URL`, `MASTODON_ACCESS_TOKEN`, `MASTODON_ACCOUNT_ID` | `MASTODON_BASE_URL`, `MASTODON_ACCESS_TOKEN`, `MASTODON_ACCOUNT_ID` |
| Threads | `THREADS_ACCESS_TOKEN`, `THREADS_USER_ID` | `THREADS_ACCESS_TOKEN`, `THREADS_USER_ID` |

## GitHub Actions

This repo includes:

- `.github/workflows/ci.yml` for build + unit tests on every push/PR.
- `.github/workflows/release.yml` for npm publish on tag (`v*`) or manual dispatch.
- `.github/workflows/auto-update-pr.yml` for scheduled doc crawling + updater PR generation.
  - Generates `.artifacts/*` for PR metadata during the run but does not commit artifact files.

Manual dry-run option for updater workflow:

- In **Actions -> Auto Update PR -> Run workflow**, set `dry_run=true` to run detection and artifact generation only (no branch/PR).

Configure these repository secrets to enable integration CI:

- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_SECRET`
- `X_TEST_TWEET_ID`
- `FB_PAGE_ACCESS_TOKEN`
- `FB_PAGE_ID`
- `IG_ACCESS_TOKEN`
- `IG_USER_ID`
- `LINKEDIN_ACCESS_TOKEN`
- `LINKEDIN_ORG_URN`
- `YOUTUBE_ACCESS_TOKEN`
- `YOUTUBE_CHANNEL_ID`
- `TIKTOK_ACCESS_TOKEN`
- `PINTEREST_ACCESS_TOKEN`
- `PINTEREST_BOARD_ID`
- `BLUESKY_IDENTIFIER`
- `BLUESKY_APP_PASSWORD`
- `BLUESKY_TEST_ACTOR` (optional; defaults to `BLUESKY_IDENTIFIER` when omitted)
- `MASTODON_BASE_URL`
- `MASTODON_ACCESS_TOKEN`
- `MASTODON_ACCOUNT_ID`
- `THREADS_ACCESS_TOKEN`
- `THREADS_USER_ID`

Configure this repository secret for publishing:

- `NPM_TOKEN`

Configure this repository secret for scheduled updater PRs:

- `UPDATER_LLM_PROVIDER` (`openrouter` or `ollama`)
- `UPDATER_LLM_API_KEY` (required for `openrouter`; or use `OPENROUTER_API_KEY`)
- `UPDATER_LLM_MODEL` (optional)
- `UPDATER_LLM_BASE_URL` (optional; defaults to OpenRouter URL)
- `UPDATER_LLM_MAX_TOKENS` (optional; cap completion size/cost)
- `UPDATER_LLM_MAX_MODEL_ATTEMPTS` (optional)
- `UPDATER_LLM_FALLBACK_MODELS` (optional comma-separated model chain)

Alternative OpenRouter-compatible secret names also supported:

- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
