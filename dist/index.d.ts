interface XPostResult {
    data: {
        id: string;
        text?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}
interface XTweetAnalyticsResult {
    data?: {
        id?: string;
        public_metrics?: Record<string, number>;
        organic_metrics?: Record<string, number>;
        non_public_metrics?: Record<string, number>;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}
interface GenericPlatformResult {
    [key: string]: unknown;
}
interface GenericActionResult {
    data?: Record<string, unknown>;
    [key: string]: unknown;
}
interface GenericDeleteResult {
    deleted?: boolean;
    success?: boolean;
    [key: string]: unknown;
}
interface XActionResult {
    platform: "x";
    action: string;
    success: boolean;
    raw?: unknown;
}
interface XDeleteTweetResult {
    platform: "x";
    targetId: string;
    deleted: boolean;
    success: boolean;
    raw?: unknown;
}
interface MetaPublishResult {
    id?: string;
    post_id?: string;
    [key: string]: unknown;
}
interface MetaListResult<T = Record<string, unknown>> {
    data?: T[];
    paging?: {
        cursors?: Record<string, string>;
        next?: string;
        previous?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}
interface MetaInsightsResult {
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
interface FacebookActionResult {
    platform: "facebook";
    action: string;
    success: boolean;
    raw?: unknown;
}
interface FacebookDeleteResult {
    platform: "facebook";
    targetId: string;
    deleted: boolean;
    success: boolean;
    raw?: unknown;
}
interface FacebookResumableVideoResult {
    platform: "facebook";
    success: boolean;
    resourceId?: string;
    raw?: unknown;
}
interface InstagramModerationResult {
    platform: "instagram";
    action: string;
    success: boolean;
    raw?: unknown;
}
interface InstagramDeleteResult {
    platform: "instagram";
    targetId: string;
    deleted: boolean;
    success: boolean;
    raw?: unknown;
}
interface InstagramPublishingLimitResult {
    platform: "instagram";
    success: boolean;
    raw?: unknown;
}
interface LinkedInPostResult {
    id?: string;
    urn?: string;
    [key: string]: unknown;
}
interface LinkedInAnalyticsResult {
    elements?: Array<Record<string, unknown>>;
    paging?: Record<string, unknown>;
    [key: string]: unknown;
}
interface LinkedInUploadRegistrationResult {
    value?: Record<string, unknown>;
    [key: string]: unknown;
}
interface LinkedInBinaryUploadResult {
    bytesUploaded: number;
}
interface LinkedInActionResult {
    platform: "linkedin";
    action: string;
    success: boolean;
    raw?: unknown;
}
interface LinkedInDeleteResult {
    platform: "linkedin";
    targetId: string;
    deleted: boolean;
    success: boolean;
    raw?: unknown;
}
interface YouTubeListVideosResult {
    items?: Array<Record<string, unknown>>;
    nextPageToken?: string;
    prevPageToken?: string;
    pageInfo?: Record<string, unknown>;
    [key: string]: unknown;
}
interface YouTubeAnalyticsResult {
    rows?: unknown[][];
    columnHeaders?: Array<Record<string, unknown>>;
    [key: string]: unknown;
}
interface YouTubeUploadBinaryResult {
    bytesUploaded: number;
}
interface YouTubeVideoMetadataResult {
    platform: "youtube";
    success: boolean;
    resourceId?: string;
    raw?: unknown;
}
interface YouTubeDeleteVideoResult {
    platform: "youtube";
    targetId: string;
    deleted: boolean;
    success: boolean;
    raw?: unknown;
}
interface YouTubeCommentResult {
    platform: "youtube";
    success: boolean;
    resourceId?: string;
    raw?: unknown;
}
interface YouTubeRatingResult {
    platform: "youtube";
    action: string;
    success: boolean;
    raw?: unknown;
}
interface TikTokListVideosResult {
    data?: {
        videos?: Array<Record<string, unknown>>;
        cursor?: number | string;
        has_more?: boolean;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}
interface TikTokAnalyticsResult {
    data?: Record<string, unknown>;
    [key: string]: unknown;
}
interface TikTokPostResult {
    data?: Record<string, unknown>;
    [key: string]: unknown;
}
interface TikTokDeleteVideoResult {
    platform: "tiktok";
    targetId: string;
    deleted: boolean;
    success: boolean;
    raw?: unknown;
}
interface TikTokActionResult {
    platform: "tiktok";
    action: string;
    success: boolean;
    raw?: unknown;
}
interface PinterestListBoardsResult {
    items?: Array<Record<string, unknown>>;
    bookmark?: string;
    [key: string]: unknown;
}
interface PinterestAnalyticsResult {
    all?: Record<string, unknown>;
    [key: string]: unknown;
}
interface PinterestListPinsResult {
    items?: Array<Record<string, unknown>>;
    bookmark?: string;
    [key: string]: unknown;
}
interface PinterestMutationResult {
    platform: "pinterest";
    success: boolean;
    resourceId?: string;
    raw?: unknown;
}
interface PinterestDeleteResult {
    platform: "pinterest";
    targetId: string;
    deleted: boolean;
    success: boolean;
    raw?: unknown;
}
interface PinterestActionResult {
    platform: "pinterest";
    action: string;
    success: boolean;
    raw?: unknown;
}
interface BlueskyRecordResult {
    uri?: string;
    cid?: string;
    [key: string]: unknown;
}
interface BlueskyFeedResult {
    feed?: Array<Record<string, unknown>>;
    cursor?: string;
    [key: string]: unknown;
}
interface BlueskySearchResult {
    posts?: Array<Record<string, unknown>>;
    cursor?: string;
    [key: string]: unknown;
}
interface BlueskyThreadResult {
    thread?: Record<string, unknown>;
    [key: string]: unknown;
}
interface BlueskyNotificationsResult {
    notifications?: Array<Record<string, unknown>>;
    cursor?: string;
    [key: string]: unknown;
}
interface BlueskyDeleteResult {
    platform: "bluesky";
    action: string;
    success: boolean;
    raw?: unknown;
}
interface MastodonStatusResult {
    id?: string;
    uri?: string;
    content?: string;
    created_at?: string;
    [key: string]: unknown;
}
type MastodonListStatusesResult = MastodonStatusResult[];
interface MastodonMediaResult {
    id?: string;
    type?: string;
    url?: string;
    [key: string]: unknown;
}
interface MastodonContextResult {
    ancestors?: Array<Record<string, unknown>>;
    descendants?: Array<Record<string, unknown>>;
    [key: string]: unknown;
}
interface MastodonDeleteStatusResult {
    platform: "mastodon";
    targetId: string;
    deleted: boolean;
    success: boolean;
    raw?: unknown;
}
interface MastodonAccountAnalyticsResult {
    platform: "mastodon";
    success: boolean;
    raw?: unknown;
}
interface ThreadsPublishResult {
    id?: string;
    [key: string]: unknown;
}
interface ThreadsListResult {
    data?: Array<Record<string, unknown>>;
    paging?: Record<string, unknown>;
    [key: string]: unknown;
}
interface ThreadsInsightsResult {
    data?: Array<Record<string, unknown>>;
    [key: string]: unknown;
}
interface ThreadsDeleteResult {
    platform: "threads";
    targetId: string;
    deleted: boolean;
    success: boolean;
    raw?: unknown;
}
interface ThreadsActionResult {
    platform: "threads";
    action: string;
    success: boolean;
    raw?: unknown;
}
interface ThreadsThreadResult {
    platform: "threads";
    success: boolean;
    raw?: unknown;
}
type XThreadResult = XPostResult[];
type XUploadMediaResult = string;

declare class Instagram {
    static uploadPhoto(input: {
        igUserId?: string;
        imageUrl: string;
        caption?: string;
    }): Promise<MetaPublishResult>;
    static uploadVideo(input: {
        igUserId?: string;
        videoUrl: string;
        caption?: string;
    }): Promise<MetaPublishResult>;
    static uploadReel(input: {
        igUserId?: string;
        mediaPath?: string;
        videoUrl: string;
        caption?: string;
    }): Promise<MetaPublishResult>;
    static uploadStoryPhoto(input: {
        igUserId?: string;
        imageUrl: string;
    }): Promise<MetaPublishResult>;
    static uploadStoryVideo(input: {
        igUserId?: string;
        videoUrl: string;
    }): Promise<MetaPublishResult>;
    static publishCarousel(input: {
        igUserId?: string;
        caption?: string;
        items: Array<{
            imageUrl?: string;
            videoUrl?: string;
        }>;
    }): Promise<MetaPublishResult>;
    static commentOnMedia(input: {
        mediaId: string;
        message: string;
    }): Promise<MetaPublishResult>;
    static replyToComment(input: {
        commentId: string;
        message: string;
    }): Promise<MetaPublishResult>;
    static hideComment(input: {
        commentId: string;
        hide: boolean;
    }): Promise<InstagramModerationResult>;
    static deleteComment(input: {
        commentId: string;
    }): Promise<InstagramDeleteResult>;
    static deleteMedia(input: {
        mediaId: string;
    }): Promise<InstagramDeleteResult>;
    static sendPrivateReply(input: {
        commentId: string;
        message: string;
    }): Promise<MetaPublishResult>;
    static getMediaInsights(input: {
        mediaId: string;
        metrics?: string[];
    }): Promise<MetaInsightsResult>;
    static getAccountInsights(input: {
        igUserId?: string;
        metrics?: string[];
        period?: "day" | "week" | "days_28";
    }): Promise<MetaInsightsResult>;
    static getPublishingLimit(input: {
        igUserId?: string;
    }): Promise<InstagramPublishingLimitResult>;
    static scheduleReel(input: {
        igUserId?: string;
        videoUrl: string;
        caption?: string;
        publishAt: Date | string;
    }): Promise<MetaPublishResult>;
}

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
declare class X {
    static postTweet(input: PostTweetInput): Promise<XPostResult>;
    static postThread(input: {
        tweets: string[];
    }): Promise<XThreadResult>;
    static replyTweet(input: ReplyTweetInput): Promise<XPostResult>;
    static quoteTweet(input: QuoteTweetInput): Promise<XPostResult>;
    static deleteTweet(input: {
        tweetId: string;
    }): Promise<XDeleteTweetResult>;
    static retweet(input: {
        userId: string;
        tweetId: string;
    }): Promise<XActionResult>;
    static unretweet(input: {
        userId: string;
        tweetId: string;
    }): Promise<XActionResult>;
    static likeTweet(input: {
        userId: string;
        tweetId: string;
    }): Promise<XActionResult>;
    static unlikeTweet(input: {
        userId: string;
        tweetId: string;
    }): Promise<XActionResult>;
    static uploadMedia(input: {
        mediaPath: string;
    }): Promise<XUploadMediaResult>;
    static postPhoto(input: PostMediaInput): Promise<XPostResult>;
    static postVideo(input: PostMediaInput): Promise<XPostResult>;
    static postPoll(input: PollTweetInput): Promise<XPostResult>;
    static sendDirectMessage(input: {
        recipientId: string;
        text: string;
    }): Promise<XActionResult>;
    static getTweetAnalytics(input: {
        tweetId: string;
    }): Promise<XTweetAnalyticsResult>;
    static scheduleTweet(input: {
        text: string;
        publishAt: Date | string;
    }): Promise<XPostResult>;
}

declare class Facebook {
    static publishToPage(input: {
        pageId?: string;
        message: string;
        link?: string;
        photoUrl?: string;
    }): Promise<MetaPublishResult>;
    static publishPhoto(input: {
        pageId?: string;
        url: string;
        caption?: string;
    }): Promise<MetaPublishResult>;
    static publishVideo(input: {
        pageId?: string;
        fileUrl: string;
        description?: string;
        title?: string;
    }): Promise<MetaPublishResult>;
    static publishCarousel(input: {
        pageId?: string;
        message: string;
        photoUrls: string[];
    }): Promise<MetaPublishResult>;
    static publishStory(input: {
        pageId?: string;
        photoUrl: string;
    }): Promise<MetaPublishResult>;
    static schedulePost(input: {
        pageId?: string;
        message: string;
        publishAt: Date | string;
    }): Promise<MetaPublishResult>;
    static commentOnPost(input: {
        postId: string;
        message: string;
    }): Promise<MetaPublishResult>;
    static replyToComment(input: {
        commentId: string;
        message: string;
    }): Promise<MetaPublishResult>;
    static likeObject(input: {
        objectId: string;
    }): Promise<FacebookActionResult>;
    static deletePost(input: {
        objectId: string;
    }): Promise<FacebookDeleteResult>;
    static sendPageMessage(input: {
        recipientPsid: string;
        message: string;
        pageId?: string;
    }): Promise<FacebookActionResult>;
    static getPostInsights(input: {
        postId: string;
        metrics?: string[];
    }): Promise<MetaInsightsResult>;
    static getPageInsights(input: {
        pageId?: string;
        metrics?: string[];
        period?: "day" | "week" | "days_28";
    }): Promise<MetaInsightsResult>;
    static uploadResumableVideo(input: {
        pageId?: string;
        fileSize: number;
        startOffset?: number;
    }): Promise<FacebookResumableVideoResult>;
    static listPublishedPosts(input: {
        pageId?: string;
        limit?: number;
    }): Promise<MetaListResult>;
    static scheduleInProcess<T>(input: {
        publishAt: Date | string;
        action: () => Promise<T>;
    }): Promise<T>;
}

declare class LinkedIn {
    static createTextPost(input: {
        author?: string;
        text: string;
        visibility?: "PUBLIC" | "CONNECTIONS";
    }): Promise<LinkedInPostResult>;
    static createImagePost(input: {
        author?: string;
        text: string;
        mediaUrn: string;
    }): Promise<LinkedInPostResult>;
    static createVideoPost(input: {
        author?: string;
        text: string;
        mediaUrn: string;
    }): Promise<LinkedInPostResult>;
    static createCarouselPost(input: {
        author?: string;
        text: string;
        mediaUrns: string[];
    }): Promise<LinkedInPostResult>;
    static schedulePost(input: {
        author?: string;
        text: string;
        publishAt: Date | string;
    }): Promise<LinkedInPostResult>;
    static commentOnPost(input: {
        actor?: string;
        objectUrn: string;
        message: string;
    }): Promise<LinkedInPostResult>;
    static replyToComment(input: {
        actor?: string;
        parentCommentUrn: string;
        message: string;
    }): Promise<LinkedInPostResult>;
    static deleteComment(input: {
        encodedCommentUrn: string;
    }): Promise<LinkedInDeleteResult>;
    static likePost(input: {
        actor?: string;
        objectUrn: string;
    }): Promise<LinkedInActionResult>;
    static unlikePost(input: {
        actorUrn?: string;
        encodedObjectUrn: string;
    }): Promise<LinkedInDeleteResult>;
    static sendDirectMessage(input: {
        actor?: string;
        recipientUrn: string;
        text: string;
    }): Promise<LinkedInActionResult>;
    static getPostAnalytics(input: {
        postUrn: string;
    }): Promise<LinkedInAnalyticsResult>;
    static getOrganizationAnalytics(input: {
        orgUrn?: string;
    }): Promise<LinkedInAnalyticsResult>;
    static registerUpload(input: {
        owner?: string;
        mediaType: "image" | "video";
        fileSize: number;
    }): Promise<LinkedInUploadRegistrationResult>;
    static uploadBinary(input: {
        uploadUrl: string;
        mediaPath: string;
    }): Promise<LinkedInBinaryUploadResult>;
    static deletePost(input: {
        encodedPostUrn: string;
    }): Promise<LinkedInDeleteResult>;
}

declare class YouTube {
    static createVideoUploadSession(input: {
        title: string;
        description?: string;
        privacyStatus?: "private" | "public" | "unlisted";
    }): Promise<MetaPublishResult>;
    static uploadBinary(input: {
        uploadUrl: string;
        mediaPath: string;
    }): Promise<YouTubeUploadBinaryResult>;
    static listMyVideos(input: {
        maxResults?: number;
    }): Promise<YouTubeListVideosResult>;
    static updateVideoMetadata(input: {
        videoId: string;
        title?: string;
        description?: string;
        privacyStatus?: "private" | "public" | "unlisted";
    }): Promise<YouTubeVideoMetadataResult>;
    static deleteVideo(input: {
        videoId: string;
    }): Promise<YouTubeDeleteVideoResult>;
    static commentOnVideo(input: {
        videoId: string;
        text: string;
    }): Promise<YouTubeCommentResult>;
    static replyToComment(input: {
        parentCommentId: string;
        text: string;
    }): Promise<YouTubeCommentResult>;
    static likeVideo(input: {
        videoId: string;
    }): Promise<YouTubeRatingResult>;
    static unlikeVideo(input: {
        videoId: string;
    }): Promise<YouTubeRatingResult>;
    static createPlaylist(input: {
        title: string;
        description?: string;
        privacyStatus?: "private" | "public" | "unlisted";
    }): Promise<MetaPublishResult>;
    static addVideoToPlaylist(input: {
        playlistId: string;
        videoId: string;
    }): Promise<MetaPublishResult>;
    static getChannelAnalytics(input: {
        startDate: string;
        endDate: string;
        metrics?: string;
    }): Promise<YouTubeAnalyticsResult>;
    static scheduleVideoMetadataUpdate(input: {
        videoId: string;
        title?: string;
        description?: string;
        privacyStatus?: "private" | "public" | "unlisted";
        publishAt: Date | string;
    }): Promise<YouTubeVideoMetadataResult>;
}

declare class TikTok {
    static createPost(input: {
        text: string;
        visibility?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY";
    }): Promise<TikTokPostResult>;
    static createVideoPost(input: {
        title: string;
        videoUrl: string;
        visibility?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY";
    }): Promise<TikTokPostResult>;
    static getPostStatus(input: {
        publishId: string;
    }): Promise<TikTokPostResult>;
    static listVideos(input: {
        maxCount?: number;
    }): Promise<TikTokListVideosResult>;
    static deleteVideo(input: {
        videoId: string;
    }): Promise<TikTokDeleteVideoResult>;
    static commentOnVideo(input: {
        videoId: string;
        text: string;
    }): Promise<TikTokActionResult>;
    static replyToComment(input: {
        commentId: string;
        text: string;
    }): Promise<TikTokActionResult>;
    static likeVideo(input: {
        videoId: string;
    }): Promise<TikTokActionResult>;
    static unlikeVideo(input: {
        videoId: string;
    }): Promise<TikTokActionResult>;
    static getVideoAnalytics(input: {
        videoIds: string[];
    }): Promise<TikTokAnalyticsResult>;
    static getProfileAnalytics(input: {
        fields?: string[];
    }): Promise<TikTokAnalyticsResult>;
    static scheduleVideoPost(input: {
        title: string;
        videoUrl: string;
        publishAt: Date | string;
    }): Promise<TikTokPostResult>;
}

declare class Pinterest {
    static createPin(input: {
        boardId?: string;
        title: string;
        description?: string;
        link?: string;
        mediaSourceUrl: string;
    }): Promise<PinterestMutationResult>;
    static createVideoPin(input: {
        boardId?: string;
        title: string;
        description?: string;
        mediaSourceUrl: string;
    }): Promise<PinterestMutationResult>;
    static updatePin(input: {
        pinId: string;
        title?: string;
        description?: string;
        link?: string;
    }): Promise<PinterestMutationResult>;
    static deletePin(input: {
        pinId: string;
    }): Promise<PinterestDeleteResult>;
    static listPins(input: {
        boardId?: string;
        pageSize?: number;
    }): Promise<PinterestListPinsResult>;
    static createBoard(input: {
        name: string;
        description?: string;
        privacy?: "PUBLIC" | "PROTECTED" | "SECRET";
    }): Promise<PinterestMutationResult>;
    static listBoards(input: {
        pageSize?: number;
    }): Promise<PinterestListBoardsResult>;
    static commentOnPin(input: {
        pinId: string;
        text: string;
    }): Promise<PinterestActionResult>;
    static replyToComment(input: {
        pinId: string;
        commentId: string;
        text: string;
    }): Promise<PinterestActionResult>;
    static getPinAnalytics(input: {
        pinId: string;
        startDate: string;
        endDate: string;
    }): Promise<PinterestAnalyticsResult>;
    static getAccountAnalytics(input: {
        startDate: string;
        endDate: string;
    }): Promise<PinterestAnalyticsResult>;
    static schedulePin(input: {
        title: string;
        mediaSourceUrl: string;
        boardId?: string;
        publishAt: Date | string;
    }): Promise<PinterestMutationResult>;
}

declare class Bluesky {
    static postText(input: {
        text: string;
    }): Promise<BlueskyRecordResult>;
    static postWithLink(input: {
        text: string;
        url: string;
    }): Promise<BlueskyRecordResult>;
    static replyToPost(input: {
        text: string;
        rootUri: string;
        rootCid: string;
        parentUri: string;
        parentCid: string;
    }): Promise<BlueskyRecordResult>;
    static likePost(input: {
        subjectUri: string;
        subjectCid: string;
    }): Promise<BlueskyRecordResult>;
    static repost(input: {
        subjectUri: string;
        subjectCid: string;
    }): Promise<BlueskyRecordResult>;
    static deleteRecord(input: {
        uri: string;
    }): Promise<BlueskyDeleteResult>;
    static getAuthorFeed(input: {
        actorDidOrHandle: string;
        limit?: number;
    }): Promise<BlueskyFeedResult>;
    static searchPosts(input: {
        query: string;
        limit?: number;
    }): Promise<BlueskySearchResult>;
    static getPostThread(input: {
        uri: string;
        depth?: number;
    }): Promise<BlueskyThreadResult>;
    static getNotificationFeed(input: {
        limit?: number;
    }): Promise<BlueskyNotificationsResult>;
    static schedulePost(input: {
        text: string;
        publishAt: Date | string;
    }): Promise<BlueskyRecordResult>;
}

declare class Mastodon {
    static createStatus(input: {
        text: string;
        visibility?: "public" | "unlisted" | "private" | "direct";
    }): Promise<MastodonStatusResult>;
    static uploadMedia(input: {
        mediaPath: string;
        description?: string;
    }): Promise<MastodonMediaResult>;
    static createMediaStatus(input: {
        text: string;
        mediaIds: string[];
        visibility?: "public" | "unlisted" | "private" | "direct";
    }): Promise<MastodonStatusResult>;
    static replyToStatus(input: {
        statusId: string;
        text: string;
    }): Promise<MastodonStatusResult>;
    static deleteStatus(input: {
        statusId: string;
    }): Promise<MastodonDeleteStatusResult>;
    static favouriteStatus(input: {
        statusId: string;
    }): Promise<MastodonStatusResult>;
    static unfavouriteStatus(input: {
        statusId: string;
    }): Promise<MastodonStatusResult>;
    static boostStatus(input: {
        statusId: string;
    }): Promise<MastodonStatusResult>;
    static unboostStatus(input: {
        statusId: string;
    }): Promise<MastodonStatusResult>;
    static listMyStatuses(input: {
        limit?: number;
    }): Promise<MastodonListStatusesResult>;
    static getStatusContext(input: {
        statusId: string;
    }): Promise<MastodonContextResult>;
    static getAccountAnalytics(input: {
        instanceScope?: "day" | "week" | "month";
    }): Promise<MastodonAccountAnalyticsResult>;
    static scheduleStatus(input: {
        text: string;
        publishAt: Date | string;
    }): Promise<MastodonStatusResult>;
}

declare class Threads {
    static postText(input: {
        threadsUserId?: string;
        text: string;
    }): Promise<ThreadsPublishResult>;
    static postImage(input: {
        threadsUserId?: string;
        text?: string;
        imageUrl: string;
    }): Promise<ThreadsPublishResult>;
    static postVideo(input: {
        threadsUserId?: string;
        text?: string;
        videoUrl: string;
    }): Promise<ThreadsPublishResult>;
    static replyToThread(input: {
        threadsUserId?: string;
        threadId: string;
        text: string;
    }): Promise<ThreadsPublishResult>;
    static deleteThread(input: {
        threadId: string;
    }): Promise<ThreadsDeleteResult>;
    static getThread(input: {
        threadId: string;
        fields?: string[];
    }): Promise<ThreadsThreadResult>;
    static listMyThreads(input: {
        threadsUserId?: string;
        limit?: number;
    }): Promise<ThreadsListResult>;
    static getThreadInsights(input: {
        threadId: string;
        metrics?: string[];
    }): Promise<ThreadsInsightsResult>;
    static getAccountInsights(input: {
        threadsUserId?: string;
        metrics?: string[];
        period?: "day" | "week" | "days_28";
    }): Promise<ThreadsInsightsResult>;
    static likeThread(input: {
        threadId: string;
    }): Promise<ThreadsActionResult>;
    static unlikeThread(input: {
        threadId: string;
    }): Promise<ThreadsDeleteResult>;
    static scheduleTextPost(input: {
        threadsUserId?: string;
        text: string;
        publishAt: Date | string;
    }): Promise<ThreadsPublishResult>;
}

declare function verifyMetaWebhookSignature(params: {
    payload: string | Buffer;
    signatureHeader?: string;
    appSecret: string;
}): boolean;
declare function verifyXWebhookSignature(params: {
    payload: string | Buffer;
    signatureHeader?: string;
    consumerSecret: string;
}): boolean;

type WebhookPlatform = "meta" | "x";
interface NormalizedWebhookEvent {
    platform: WebhookPlatform;
    type: string;
    id?: string;
    timestamp?: number;
    payload: unknown;
    raw: unknown;
}
type WebhookHandler = (event: NormalizedWebhookEvent) => void | Promise<void>;

declare function normalizeMetaWebhook(body: unknown): NormalizedWebhookEvent[];
declare function normalizeXWebhook(body: unknown): NormalizedWebhookEvent[];
declare function normalizeWebhook(platform: WebhookPlatform, body: unknown): NormalizedWebhookEvent[];

declare class WebhookRouter {
    private readonly handlers;
    on(type: string, handler: WebhookHandler): this;
    dispatch(events: NormalizedWebhookEvent[]): Promise<void>;
    handle(platform: WebhookPlatform, body: unknown): Promise<void>;
    handleMeta(params: {
        payload: string | Buffer;
        body: unknown;
        signatureHeader?: string;
        appSecret: string;
    }): Promise<void>;
    handleX(params: {
        payload: string | Buffer;
        body: unknown;
        signatureHeader?: string;
        consumerSecret: string;
    }): Promise<void>;
}

interface QueueJob<T = unknown> {
    id: string;
    task: () => Promise<T>;
}
interface QueueJobHandle<T = unknown> {
    id: string;
    result: Promise<T>;
}
interface QueueAdapter {
    enqueue<T>(job: QueueJob<T>): Promise<QueueJobHandle<T>>;
    schedule<T>(job: QueueJob<T>, runAt: Date | string): Promise<QueueJobHandle<T>>;
    cancel(jobId: string): boolean;
}

declare class InMemoryQueueAdapter implements QueueAdapter {
    private readonly jobs;
    enqueue<T>(job: QueueJob<T>): Promise<QueueJobHandle<T>>;
    schedule<T>(job: QueueJob<T>, runAt: Date | string): Promise<QueueJobHandle<T>>;
    cancel(jobId: string): boolean;
}

declare class BullMQAdapter implements QueueAdapter {
    enqueue<T>(job: QueueJob<T>): Promise<QueueJobHandle<T>>;
    schedule<T>(job: QueueJob<T>, _runAt: Date | string): Promise<QueueJobHandle<T>>;
    cancel(_jobId: string): boolean;
}

declare class SQSAdapter implements QueueAdapter {
    enqueue<T>(job: QueueJob<T>): Promise<QueueJobHandle<T>>;
    schedule<T>(job: QueueJob<T>, _runAt: Date | string): Promise<QueueJobHandle<T>>;
    cancel(_jobId: string): boolean;
}

declare function setQueueAdapter(adapter: QueueAdapter): void;
declare function getQueueAdapter(): QueueAdapter;
declare function resetQueueAdapter(): void;

type Platform = "x" | "facebook" | "instagram" | "linkedin" | "youtube" | "tiktok" | "pinterest" | "bluesky" | "mastodon" | "threads";
interface BaseResult<T = unknown> {
    ok: boolean;
    platform: Platform;
    endpoint: string;
    data: T;
}
interface RetryOptions {
    retries?: number;
    baseDelayMs?: number;
}
interface MediaUploadOptions {
    mediaPath: string;
    mimeType?: string;
    fileName?: string;
    onProgress?: (percent: number) => void;
}
interface ScheduleOptions {
    publishAt: Date | string;
}
interface AnalyticsRange {
    since?: string;
    until?: string;
}

declare class SocialError extends Error {
    readonly platform: Platform;
    readonly endpoint: string;
    readonly statusCode?: number;
    readonly details?: unknown;
    readonly cause?: unknown;
    constructor(params: {
        platform: Platform;
        endpoint: string;
        message: string;
        statusCode?: number;
        details?: unknown;
        cause?: unknown;
    });
    toJSON(): {
        name: string;
        message: string;
        platform: Platform;
        endpoint: string;
        statusCode: number | undefined;
        details: unknown;
    };
    static normalize(params: {
        platform: Platform;
        endpoint: string;
        error: unknown;
    }): SocialError;
}

export { type AnalyticsRange, type BaseResult, Bluesky, type BlueskyDeleteResult, type BlueskyFeedResult, type BlueskyNotificationsResult, type BlueskyRecordResult, type BlueskySearchResult, type BlueskyThreadResult, BullMQAdapter, Facebook, type FacebookActionResult, type FacebookDeleteResult, type FacebookResumableVideoResult, type GenericActionResult, type GenericDeleteResult, type GenericPlatformResult, InMemoryQueueAdapter, Instagram, type InstagramDeleteResult, type InstagramModerationResult, type InstagramPublishingLimitResult, LinkedIn, type LinkedInActionResult, type LinkedInAnalyticsResult, type LinkedInBinaryUploadResult, type LinkedInDeleteResult, type LinkedInPostResult, type LinkedInUploadRegistrationResult, Mastodon, type MastodonAccountAnalyticsResult, type MastodonContextResult, type MastodonDeleteStatusResult, type MastodonListStatusesResult, type MastodonMediaResult, type MastodonStatusResult, type MediaUploadOptions, type MetaInsightsResult, type MetaListResult, type MetaPublishResult, type NormalizedWebhookEvent, Pinterest, type PinterestActionResult, type PinterestAnalyticsResult, type PinterestDeleteResult, type PinterestListBoardsResult, type PinterestListPinsResult, type PinterestMutationResult, type Platform, type QueueAdapter, type QueueJob, type QueueJobHandle, type RetryOptions, SQSAdapter, type ScheduleOptions, SocialError, Threads, type ThreadsActionResult, type ThreadsDeleteResult, type ThreadsInsightsResult, type ThreadsListResult, type ThreadsPublishResult, type ThreadsThreadResult, TikTok, type TikTokActionResult, type TikTokAnalyticsResult, type TikTokDeleteVideoResult, type TikTokListVideosResult, type TikTokPostResult, type WebhookHandler, type WebhookPlatform, WebhookRouter, X, type XActionResult, type XDeleteTweetResult, type XPostResult, type XThreadResult, type XTweetAnalyticsResult, type XUploadMediaResult, YouTube, type YouTubeAnalyticsResult, type YouTubeCommentResult, type YouTubeDeleteVideoResult, type YouTubeListVideosResult, type YouTubeRatingResult, type YouTubeUploadBinaryResult, type YouTubeVideoMetadataResult, getQueueAdapter, normalizeMetaWebhook, normalizeWebhook, normalizeXWebhook, resetQueueAdapter, setQueueAdapter, verifyMetaWebhookSignature, verifyXWebhookSignature };
