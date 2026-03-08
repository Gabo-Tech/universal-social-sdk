export interface XPostResult {
  data: {
    id: string;
    text?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface XTweetAnalyticsResult {
  data?: {
    id?: string;
    public_metrics?: Record<string, number>;
    organic_metrics?: Record<string, number>;
    non_public_metrics?: Record<string, number>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface GenericPlatformResult {
  [key: string]: unknown;
}

export interface GenericActionResult {
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface GenericDeleteResult {
  deleted?: boolean;
  success?: boolean;
  [key: string]: unknown;
}

export interface XActionResult {
  platform: "x";
  action: string;
  success: boolean;
  raw?: unknown;
}

export interface XDeleteTweetResult {
  platform: "x";
  targetId: string;
  deleted: boolean;
  success: boolean;
  raw?: unknown;
}

export interface MetaPublishResult {
  id?: string;
  post_id?: string;
  [key: string]: unknown;
}

export interface MetaListResult<T = Record<string, unknown>> {
  data?: T[];
  paging?: {
    cursors?: Record<string, string>;
    next?: string;
    previous?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface MetaInsightsResult {
  data?: Array<{
    name?: string;
    period?: string;
    values?: unknown[];
    title?: string;
    description?: string;
    id?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export interface FacebookActionResult {
  platform: "facebook";
  action: string;
  success: boolean;
  raw?: unknown;
}

export interface FacebookDeleteResult {
  platform: "facebook";
  targetId: string;
  deleted: boolean;
  success: boolean;
  raw?: unknown;
}

export interface FacebookResumableVideoResult {
  platform: "facebook";
  success: boolean;
  resourceId?: string;
  raw?: unknown;
}

export interface InstagramModerationResult {
  platform: "instagram";
  action: string;
  success: boolean;
  raw?: unknown;
}

export interface InstagramDeleteResult {
  platform: "instagram";
  targetId: string;
  deleted: boolean;
  success: boolean;
  raw?: unknown;
}

export interface InstagramPublishingLimitResult {
  platform: "instagram";
  success: boolean;
  raw?: unknown;
}

export interface LinkedInPostResult {
  id?: string;
  urn?: string;
  [key: string]: unknown;
}

export interface LinkedInAnalyticsResult {
  elements?: Array<Record<string, unknown>>;
  paging?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface LinkedInUploadRegistrationResult {
  value?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface LinkedInBinaryUploadResult {
  bytesUploaded: number;
}

export interface LinkedInActionResult {
  platform: "linkedin";
  action: string;
  success: boolean;
  raw?: unknown;
}

export interface LinkedInDeleteResult {
  platform: "linkedin";
  targetId: string;
  deleted: boolean;
  success: boolean;
  raw?: unknown;
}

export interface YouTubeListVideosResult {
  items?: Array<Record<string, unknown>>;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface YouTubeAnalyticsResult {
  rows?: unknown[][];
  columnHeaders?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface YouTubeUploadBinaryResult {
  bytesUploaded: number;
}

export interface YouTubeVideoMetadataResult {
  platform: "youtube";
  success: boolean;
  resourceId?: string;
  raw?: unknown;
}

export interface YouTubeDeleteVideoResult {
  platform: "youtube";
  targetId: string;
  deleted: boolean;
  success: boolean;
  raw?: unknown;
}

export interface YouTubeCommentResult {
  platform: "youtube";
  success: boolean;
  resourceId?: string;
  raw?: unknown;
}

export interface YouTubeRatingResult {
  platform: "youtube";
  action: string;
  success: boolean;
  raw?: unknown;
}

export interface TikTokListVideosResult {
  data?: {
    videos?: Array<Record<string, unknown>>;
    cursor?: number | string;
    has_more?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface TikTokAnalyticsResult {
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface TikTokPostResult {
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface TikTokDeleteVideoResult {
  platform: "tiktok";
  targetId: string;
  deleted: boolean;
  success: boolean;
  raw?: unknown;
}

export interface TikTokActionResult {
  platform: "tiktok";
  action: string;
  success: boolean;
  raw?: unknown;
}

export interface PinterestListBoardsResult {
  items?: Array<Record<string, unknown>>;
  bookmark?: string;
  [key: string]: unknown;
}

export interface PinterestAnalyticsResult {
  all?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface PinterestListPinsResult {
  items?: Array<Record<string, unknown>>;
  bookmark?: string;
  [key: string]: unknown;
}

export interface PinterestMutationResult {
  platform: "pinterest";
  success: boolean;
  resourceId?: string;
  raw?: unknown;
}

export interface PinterestDeleteResult {
  platform: "pinterest";
  targetId: string;
  deleted: boolean;
  success: boolean;
  raw?: unknown;
}

export interface PinterestActionResult {
  platform: "pinterest";
  action: string;
  success: boolean;
  raw?: unknown;
}

export interface BlueskyRecordResult {
  uri?: string;
  cid?: string;
  [key: string]: unknown;
}

export interface BlueskyFeedResult {
  feed?: Array<Record<string, unknown>>;
  cursor?: string;
  [key: string]: unknown;
}

export interface BlueskySearchResult {
  posts?: Array<Record<string, unknown>>;
  cursor?: string;
  [key: string]: unknown;
}

export interface BlueskyThreadResult {
  thread?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface BlueskyNotificationsResult {
  notifications?: Array<Record<string, unknown>>;
  cursor?: string;
  [key: string]: unknown;
}

export interface BlueskyDeleteResult {
  platform: "bluesky";
  action: string;
  success: boolean;
  raw?: unknown;
}

export interface MastodonStatusResult {
  id?: string;
  uri?: string;
  content?: string;
  created_at?: string;
  [key: string]: unknown;
}

export type MastodonListStatusesResult = MastodonStatusResult[];

export interface MastodonMediaResult {
  id?: string;
  type?: string;
  url?: string;
  [key: string]: unknown;
}

export interface MastodonContextResult {
  ancestors?: Array<Record<string, unknown>>;
  descendants?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface MastodonDeleteStatusResult {
  platform: "mastodon";
  targetId: string;
  deleted: boolean;
  success: boolean;
  raw?: unknown;
}

export interface MastodonAccountAnalyticsResult {
  platform: "mastodon";
  success: boolean;
  raw?: unknown;
}

export interface ThreadsPublishResult {
  id?: string;
  [key: string]: unknown;
}

export interface ThreadsListResult {
  data?: Array<Record<string, unknown>>;
  paging?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ThreadsInsightsResult {
  data?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface ThreadsDeleteResult {
  platform: "threads";
  targetId: string;
  deleted: boolean;
  success: boolean;
  raw?: unknown;
}

export interface ThreadsActionResult {
  platform: "threads";
  action: string;
  success: boolean;
  raw?: unknown;
}

export interface ThreadsThreadResult {
  platform: "threads";
  success: boolean;
  raw?: unknown;
}

export type XThreadResult = XPostResult[];
export type XUploadMediaResult = string;
