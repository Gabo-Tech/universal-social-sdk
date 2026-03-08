# Response Contracts

This SDK returns **stable, normalized result contracts** for action, delete, mutation, and detail operations so provider payload changes do not break integration code.

## Contract Model

### Action contract

Used by operations like like/unlike, retweet/unretweet, DM send, moderation actions.

```ts
{
  platform: string;
  action: string;
  success: boolean;
  raw?: unknown;
}
```

### Delete contract

Used by delete operations.

```ts
{
  platform: string;
  targetId: string;
  deleted: boolean;
  success: boolean;
  raw?: unknown;
}
```

### Mutation contract

Used by create/update mutation flows where a resource may be returned.

```ts
{
  platform: string;
  success: boolean;
  resourceId?: string;
  raw?: unknown;
}
```

### Detail contract

Used for detail/inspection reads that are normalized but not transformed into a custom field model.

```ts
{
  platform: string;
  success: boolean;
  raw?: unknown;
}
```

## Platform aliases

These aliases map platform methods to one of the normalized contract models:

- `XActionResult`, `XDeleteTweetResult`
- `FacebookActionResult`, `FacebookDeleteResult`, `FacebookResumableVideoResult`
- `InstagramModerationResult`, `InstagramDeleteResult`, `InstagramPublishingLimitResult`
- `LinkedInActionResult`, `LinkedInDeleteResult`
- `YouTubeVideoMetadataResult`, `YouTubeDeleteVideoResult`, `YouTubeCommentResult`, `YouTubeRatingResult`
- `TikTokActionResult`, `TikTokDeleteVideoResult`
- `PinterestMutationResult`, `PinterestActionResult`, `PinterestDeleteResult`
- `BlueskyDeleteResult`
- `MastodonDeleteStatusResult`, `MastodonAccountAnalyticsResult`
- `ThreadsActionResult`, `ThreadsDeleteResult`, `ThreadsThreadResult`

## Method to contract examples

```ts
import {
  Bluesky,
  Facebook,
  Instagram,
  LinkedIn,
  Mastodon,
  Pinterest,
  Threads,
  TikTok,
  X,
  YouTube
} from "universal-social-sdk";
import type {
  BlueskyDeleteResult,
  FacebookDeleteResult,
  InstagramPublishingLimitResult,
  LinkedInActionResult,
  MastodonAccountAnalyticsResult,
  PinterestMutationResult,
  ThreadsThreadResult,
  TikTokActionResult,
  XActionResult,
  YouTubeVideoMetadataResult
} from "universal-social-sdk";

const xLike: XActionResult = await X.likeTweet({ userId: "u1", tweetId: "t1" });
const fbDelete: FacebookDeleteResult = await Facebook.deletePost({ objectId: "p1" });
const igLimit: InstagramPublishingLimitResult = await Instagram.getPublishingLimit({});
const liMessage: LinkedInActionResult = await LinkedIn.sendDirectMessage({
  recipientUrn: "urn:li:person:abc",
  text: "hello"
});
const ytUpdate: YouTubeVideoMetadataResult = await YouTube.updateVideoMetadata({
  videoId: "v1",
  title: "Updated title"
});
const ttLike: TikTokActionResult = await TikTok.likeVideo({ videoId: "vid-1" });
const pinCreate: PinterestMutationResult = await Pinterest.createPin({
  title: "Pin",
  mediaSourceUrl: "https://example.com/img.jpg"
});
const bskyDelete: BlueskyDeleteResult = await Bluesky.deleteRecord({ uri: "at://did/app.bsky.feed.post/rkey" });
const mastodonStats: MastodonAccountAnalyticsResult = await Mastodon.getAccountAnalytics({});
const threadDetail: ThreadsThreadResult = await Threads.getThread({ threadId: "thr_1" });

if (xLike.success) {
  console.log(xLike.action); // stable top-level contract
}
```

## Backward compatibility strategy

- Integrations should rely on normalized top-level fields (`success`, `action`, `targetId`, `deleted`, `resourceId`) instead of provider-specific nested keys.
- `raw` is preserved for debugging and advanced use-cases.
- If providers change endpoint payload shape, the SDK only updates internal mappers while preserving the same contract.
