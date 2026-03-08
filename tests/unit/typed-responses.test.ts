import { describe, expect, it } from "vitest";
import type {
  BlueskyFeedResult,
  LinkedInAnalyticsResult,
  MastodonStatusResult,
  MetaInsightsResult,
  ThreadsListResult,
  XPostResult,
  YouTubeListVideosResult
} from "../../src/responseTypes.js";

describe("typed response interfaces", () => {
  it("supports key response shapes", () => {
    const xPost: XPostResult = { data: { id: "1", text: "hello" } };
    const metaInsights: MetaInsightsResult = { data: [{ name: "reach" }] };
    const linkedInAnalytics: LinkedInAnalyticsResult = { elements: [] };
    const youtubeList: YouTubeListVideosResult = { items: [] };
    const blueskyFeed: BlueskyFeedResult = { feed: [] };
    const mastodonStatus: MastodonStatusResult = { id: "abc" };
    const threadsList: ThreadsListResult = { data: [] };

    expect(xPost.data.id).toBe("1");
    expect(metaInsights.data?.[0]?.name).toBe("reach");
    expect(linkedInAnalytics.elements).toBeDefined();
    expect(youtubeList.items).toBeDefined();
    expect(blueskyFeed.feed).toBeDefined();
    expect(mastodonStatus.id).toBe("abc");
    expect(threadsList.data).toBeDefined();
  });
});
