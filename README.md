# universal-social-sdk

TypeScript-first, ESM-only, zero-bloat Node.js SDK that provides one unified interface for X, Facebook Pages, Instagram Graph, and LinkedIn.

[![CI](https://github.com/Gabo-Tech/universal-social-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/Gabo-Tech/universal-social-sdk/actions/workflows/ci.yml)
[![Release](https://github.com/Gabo-Tech/universal-social-sdk/actions/workflows/release.yml/badge.svg)](https://github.com/Gabo-Tech/universal-social-sdk/actions/workflows/release.yml)

## Documentation

- [Project Structure](./docs/PROJECT_STRUCTURE.md)
- [NPM Package Guide](./docs/NPM_PACKAGE_GUIDE.md)
- [Contributing](./docs/CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security Policy](./SECURITY.md)

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

### SDK / Updater

- `SOCIAL_SDK_MAX_RETRIES` (default `3`)
- `SOCIAL_SDK_RETRY_BASE_MS` (default `500`)
- `OLLAMA_HOST` (default `http://127.0.0.1:11434`)
- `OLLAMA_MODEL` (default `llama3.2:3b`)

## CLI

### Bootstrap

```bash
npx universal-social-sdk init
```

Creates `.env.example`, copies it to `.env` if missing, and prints OAuth setup links:

- X Developer Portal: <https://developer.x.com/en/portal/dashboard>
- Meta Developers: <https://developers.facebook.com/apps/>
- LinkedIn Developers: <https://www.linkedin.com/developers/apps>

### Self-updating SDK (Ollama)

```bash
npx universal-social-sdk update
```

```bash
npx universal-social-sdk update --dry-run
npx universal-social-sdk update --model llama3.2
npx universal-social-sdk update --yes
```

Flow:

1. Crawls official docs pages for X, Meta Graph API, Instagram Graph API, and LinkedIn.
2. Extracts clean text and table-like endpoint data with Cheerio.
3. Sends doc snapshots to local Ollama.
4. Requests generated method updates + full TypeScript file content.
5. Shows git-style diffs and asks for confirmation.
6. Applies patches and rebuilds package.

## Supported Methods

<!-- AUTO_METHODS_TABLE_START -->
| Method | Platform | Underlying Endpoint | Required Scopes | Example |
| --- | --- | --- | --- | --- |
| `postTweet` | X | `POST /2/tweets` | `tweet.write` | `X.postTweet({ text })` |
| `postThread` | X | `POST /2/tweets` | `tweet.write` | `X.postThread({ tweets })` |
| `replyTweet` | X | `POST /2/tweets` | `tweet.write` | `X.replyTweet({ text, inReplyToTweetId })` |
| `quoteTweet` | X | `POST /2/tweets` | `tweet.write` | `X.quoteTweet({ text, quoteTweetId })` |
| `deleteTweet` | X | `DELETE /2/tweets/:id` | `tweet.write` | `X.deleteTweet({ tweetId })` |
| `retweet` | X | `POST /2/users/:id/retweets` | `tweet.write` | `X.retweet({ userId, tweetId })` |
| `unretweet` | X | `DELETE /2/users/:id/retweets/:tweet_id` | `tweet.write` | `X.unretweet({ userId, tweetId })` |
| `likeTweet` | X | `POST /2/users/:id/likes` | `like.write` | `X.likeTweet({ userId, tweetId })` |
| `unlikeTweet` | X | `DELETE /2/users/:id/likes/:tweet_id` | `like.write` | `X.unlikeTweet({ userId, tweetId })` |
| `uploadMedia` | X | `POST media/upload` | `tweet.write` | `X.uploadMedia({ mediaPath })` |
| `postPhoto` | X | media upload + `POST /2/tweets` | `tweet.write` | `X.postPhoto({ mediaPath, text })` |
| `postVideo` | X | media upload + `POST /2/tweets` | `tweet.write` | `X.postVideo({ mediaPath, text })` |
| `postPoll` | X | `POST /2/tweets` | `tweet.write` | `X.postPoll({ text, options, durationMinutes })` |
| `sendDirectMessage` | X | DM conversations API | `dm.write` | `X.sendDirectMessage({ recipientId, text })` |
| `getTweetAnalytics` | X | `GET /2/tweets/:id` | `tweet.read` | `X.getTweetAnalytics({ tweetId })` |
| `scheduleTweet` | X | local scheduler + `POST /2/tweets` | `tweet.write` | `X.scheduleTweet({ text, publishAt })` |
| `publishToPage` | Facebook | `POST /{page-id}/feed` | `pages_manage_posts` | `Facebook.publishToPage({ message })` |
| `publishPhoto` | Facebook | `POST /{page-id}/photos` | `pages_manage_posts` | `Facebook.publishPhoto({ url })` |
| `publishVideo` | Facebook | `POST /{page-id}/videos` | `pages_manage_posts` | `Facebook.publishVideo({ fileUrl })` |
| `publishCarousel` | Facebook | `/{page-id}/photos` + `/{page-id}/feed` | `pages_manage_posts` | `Facebook.publishCarousel({ message, photoUrls })` |
| `publishStory` | Facebook | `POST /{page-id}/photo_stories` | `pages_manage_posts` | `Facebook.publishStory({ photoUrl })` |
| `schedulePost` | Facebook | `POST /{page-id}/feed` scheduled | `pages_manage_posts` | `Facebook.schedulePost({ message, publishAt })` |
| `commentOnPost` | Facebook | `POST /{post-id}/comments` | `pages_manage_engagement` | `Facebook.commentOnPost({ postId, message })` |
| `replyToComment` | Facebook | `POST /{comment-id}/comments` | `pages_manage_engagement` | `Facebook.replyToComment({ commentId, message })` |
| `likeObject` | Facebook | `POST /{object-id}/likes` | `pages_manage_engagement` | `Facebook.likeObject({ objectId })` |
| `deletePost` | Facebook | `DELETE /{object-id}` | `pages_manage_posts` | `Facebook.deletePost({ objectId })` |
| `sendPageMessage` | Facebook | `POST /{page-id}/messages` | Messenger scopes | `Facebook.sendPageMessage({ recipientPsid, message })` |
| `getPostInsights` | Facebook | `GET /{post-id}/insights` | `read_insights` | `Facebook.getPostInsights({ postId })` |
| `getPageInsights` | Facebook | `GET /{page-id}/insights` | `read_insights` | `Facebook.getPageInsights({})` |
| `uploadResumableVideo` | Facebook | `POST /{page-id}/videos` upload phases | `pages_manage_posts` | `Facebook.uploadResumableVideo({ fileSize })` |
| `listPublishedPosts` | Facebook | `GET /{page-id}/published_posts` | `pages_read_engagement` | `Facebook.listPublishedPosts({})` |
| `uploadPhoto` | Instagram | `/{ig-user-id}/media` + `/media_publish` | `instagram_content_publish` | `Instagram.uploadPhoto({ imageUrl })` |
| `uploadVideo` | Instagram | `/{ig-user-id}/media` + `/media_publish` | `instagram_content_publish` | `Instagram.uploadVideo({ videoUrl })` |
| `uploadReel` | Instagram | `/{ig-user-id}/media` + `/media_publish` | `instagram_content_publish` | `Instagram.uploadReel({ videoUrl })` |
| `uploadStoryPhoto` | Instagram | `/{ig-user-id}/media` + `/media_publish` | `instagram_content_publish` | `Instagram.uploadStoryPhoto({ imageUrl })` |
| `uploadStoryVideo` | Instagram | `/{ig-user-id}/media` + `/media_publish` | `instagram_content_publish` | `Instagram.uploadStoryVideo({ videoUrl })` |
| `publishCarousel` | Instagram | `/{ig-user-id}/media` + `/media_publish` | `instagram_content_publish` | `Instagram.publishCarousel({ items })` |
| `commentOnMedia` | Instagram | `POST /{media-id}/comments` | `instagram_manage_comments` | `Instagram.commentOnMedia({ mediaId, message })` |
| `replyToComment` | Instagram | `POST /{comment-id}/replies` | `instagram_manage_comments` | `Instagram.replyToComment({ commentId, message })` |
| `hideComment` | Instagram | `POST /{comment-id}` | `instagram_manage_comments` | `Instagram.hideComment({ commentId, hide: true })` |
| `deleteComment` | Instagram | `DELETE /{comment-id}` | `instagram_manage_comments` | `Instagram.deleteComment({ commentId })` |
| `deleteMedia` | Instagram | `DELETE /{media-id}` | `instagram_content_publish` | `Instagram.deleteMedia({ mediaId })` |
| `sendPrivateReply` | Instagram | `POST /{comment-id}/private_replies` | `instagram_manage_messages` | `Instagram.sendPrivateReply({ commentId, message })` |
| `getMediaInsights` | Instagram | `GET /{media-id}/insights` | `instagram_basic` | `Instagram.getMediaInsights({ mediaId })` |
| `getAccountInsights` | Instagram | `GET /{ig-user-id}/insights` | `instagram_basic` | `Instagram.getAccountInsights({})` |
| `getPublishingLimit` | Instagram | `GET /{ig-user-id}/content_publishing_limit` | `instagram_content_publish` | `Instagram.getPublishingLimit({})` |
| `scheduleReel` | Instagram | local scheduler + publish flow | `instagram_content_publish` | `Instagram.scheduleReel({ videoUrl, publishAt })` |
| `createTextPost` | LinkedIn | `POST /posts` | `w_member_social` or `w_organization_social` | `LinkedIn.createTextPost({ text })` |
| `createImagePost` | LinkedIn | `POST /posts` | `w_member_social` or `w_organization_social` | `LinkedIn.createImagePost({ text, mediaUrn })` |
| `createVideoPost` | LinkedIn | `POST /posts` | same as above | `LinkedIn.createVideoPost({ text, mediaUrn })` |
| `createCarouselPost` | LinkedIn | `POST /posts` | same as above | `LinkedIn.createCarouselPost({ text, mediaUrns })` |
| `schedulePost` | LinkedIn | local scheduler + `POST /posts` | posting scopes | `LinkedIn.schedulePost({ text, publishAt })` |
| `commentOnPost` | LinkedIn | `POST /socialActions/comments` | social write scopes | `LinkedIn.commentOnPost({ objectUrn, message })` |
| `replyToComment` | LinkedIn | `POST /socialActions/comments` | social write scopes | `LinkedIn.replyToComment({ parentCommentUrn, message })` |
| `deleteComment` | LinkedIn | `DELETE /socialActions/comments/:id` | social write scopes | `LinkedIn.deleteComment({ encodedCommentUrn })` |
| `likePost` | LinkedIn | `POST /socialActions/likes` | social write scopes | `LinkedIn.likePost({ objectUrn })` |
| `unlikePost` | LinkedIn | `DELETE /socialActions/.../likes/...` | social write scopes | `LinkedIn.unlikePost({ encodedObjectUrn })` |
| `sendDirectMessage` | LinkedIn | `POST /messages` | partner messaging scopes | `LinkedIn.sendDirectMessage({ recipientUrn, text })` |
| `getPostAnalytics` | LinkedIn | stats endpoints | social read scopes | `LinkedIn.getPostAnalytics({ postUrn })` |
| `getOrganizationAnalytics` | LinkedIn | follower stats endpoints | org read scopes | `LinkedIn.getOrganizationAnalytics({})` |
| `registerUpload` | LinkedIn | `POST /assets?action=registerUpload` | write scopes | `LinkedIn.registerUpload({ mediaType, fileSize })` |
| `uploadBinary` | LinkedIn | upload URL from register step | write scopes | `LinkedIn.uploadBinary({ uploadUrl, mediaPath })` |
| `deletePost` | LinkedIn | `DELETE /posts/:id` | write scopes | `LinkedIn.deletePost({ encodedPostUrn })` |
<!-- AUTO_METHODS_TABLE_END -->

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

## GitHub Actions

This repo includes:

- `.github/workflows/ci.yml` for build + unit tests on every push/PR.
- `.github/workflows/release.yml` for npm publish on tag (`v*`) or manual dispatch.

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

Configure this repository secret for publishing:

- `NPM_TOKEN`
