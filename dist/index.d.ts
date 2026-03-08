import * as axios from 'axios';

declare class Instagram {
    static uploadPhoto(input: {
        igUserId?: string;
        imageUrl: string;
        caption?: string;
    }): Promise<unknown>;
    static uploadVideo(input: {
        igUserId?: string;
        videoUrl: string;
        caption?: string;
    }): Promise<unknown>;
    static uploadReel(input: {
        igUserId?: string;
        mediaPath?: string;
        videoUrl: string;
        caption?: string;
    }): Promise<unknown>;
    static uploadStoryPhoto(input: {
        igUserId?: string;
        imageUrl: string;
    }): Promise<unknown>;
    static uploadStoryVideo(input: {
        igUserId?: string;
        videoUrl: string;
    }): Promise<unknown>;
    static publishCarousel(input: {
        igUserId?: string;
        caption?: string;
        items: Array<{
            imageUrl?: string;
            videoUrl?: string;
        }>;
    }): Promise<unknown>;
    static commentOnMedia(input: {
        mediaId: string;
        message: string;
    }): Promise<unknown>;
    static replyToComment(input: {
        commentId: string;
        message: string;
    }): Promise<unknown>;
    static hideComment(input: {
        commentId: string;
        hide: boolean;
    }): Promise<unknown>;
    static deleteComment(input: {
        commentId: string;
    }): Promise<unknown>;
    static deleteMedia(input: {
        mediaId: string;
    }): Promise<unknown>;
    static sendPrivateReply(input: {
        commentId: string;
        message: string;
    }): Promise<unknown>;
    static getMediaInsights(input: {
        mediaId: string;
        metrics?: string[];
    }): Promise<unknown>;
    static getAccountInsights(input: {
        igUserId?: string;
        metrics?: string[];
        period?: "day" | "week" | "days_28";
    }): Promise<unknown>;
    static getPublishingLimit(input: {
        igUserId?: string;
    }): Promise<unknown>;
    static scheduleReel(input: {
        igUserId?: string;
        videoUrl: string;
        caption?: string;
        publishAt: Date | string;
    }): Promise<unknown>;
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
    static postTweet(input: PostTweetInput): Promise<any>;
    static postThread(input: {
        tweets: string[];
    }): Promise<unknown[]>;
    static replyTweet(input: ReplyTweetInput): Promise<any>;
    static quoteTweet(input: QuoteTweetInput): Promise<any>;
    static deleteTweet(input: {
        tweetId: string;
    }): Promise<any>;
    static retweet(input: {
        userId: string;
        tweetId: string;
    }): Promise<any>;
    static unretweet(input: {
        userId: string;
        tweetId: string;
    }): Promise<any>;
    static likeTweet(input: {
        userId: string;
        tweetId: string;
    }): Promise<any>;
    static unlikeTweet(input: {
        userId: string;
        tweetId: string;
    }): Promise<any>;
    static uploadMedia(input: {
        mediaPath: string;
    }): Promise<string>;
    static postPhoto(input: PostMediaInput): Promise<any>;
    static postVideo(input: PostMediaInput): Promise<any>;
    static postPoll(input: PollTweetInput): Promise<any>;
    static sendDirectMessage(input: {
        recipientId: string;
        text: string;
    }): Promise<any>;
    static getTweetAnalytics(input: {
        tweetId: string;
    }): Promise<any>;
    static scheduleTweet(input: {
        text: string;
        publishAt: Date | string;
    }): Promise<any>;
}

declare class Facebook {
    static publishToPage(input: {
        pageId?: string;
        message: string;
        link?: string;
        photoUrl?: string;
    }): Promise<unknown>;
    static publishPhoto(input: {
        pageId?: string;
        url: string;
        caption?: string;
    }): Promise<unknown>;
    static publishVideo(input: {
        pageId?: string;
        fileUrl: string;
        description?: string;
        title?: string;
    }): Promise<unknown>;
    static publishCarousel(input: {
        pageId?: string;
        message: string;
        photoUrls: string[];
    }): Promise<unknown>;
    static publishStory(input: {
        pageId?: string;
        photoUrl: string;
    }): Promise<unknown>;
    static schedulePost(input: {
        pageId?: string;
        message: string;
        publishAt: Date | string;
    }): Promise<unknown>;
    static commentOnPost(input: {
        postId: string;
        message: string;
    }): Promise<unknown>;
    static replyToComment(input: {
        commentId: string;
        message: string;
    }): Promise<unknown>;
    static likeObject(input: {
        objectId: string;
    }): Promise<unknown>;
    static deletePost(input: {
        objectId: string;
    }): Promise<unknown>;
    static sendPageMessage(input: {
        recipientPsid: string;
        message: string;
        pageId?: string;
    }): Promise<unknown>;
    static getPostInsights(input: {
        postId: string;
        metrics?: string[];
    }): Promise<unknown>;
    static getPageInsights(input: {
        pageId?: string;
        metrics?: string[];
        period?: "day" | "week" | "days_28";
    }): Promise<unknown>;
    static uploadResumableVideo(input: {
        pageId?: string;
        fileSize: number;
        startOffset?: number;
    }): Promise<unknown>;
    static listPublishedPosts(input: {
        pageId?: string;
        limit?: number;
    }): Promise<unknown>;
    static scheduleInProcess(input: {
        publishAt: Date | string;
        action: () => Promise<unknown>;
    }): Promise<unknown>;
}

declare class LinkedIn {
    static createTextPost(input: {
        author?: string;
        text: string;
        visibility?: "PUBLIC" | "CONNECTIONS";
    }): Promise<unknown>;
    static createImagePost(input: {
        author?: string;
        text: string;
        mediaUrn: string;
    }): Promise<unknown>;
    static createVideoPost(input: {
        author?: string;
        text: string;
        mediaUrn: string;
    }): Promise<unknown>;
    static createCarouselPost(input: {
        author?: string;
        text: string;
        mediaUrns: string[];
    }): Promise<unknown>;
    static schedulePost(input: {
        author?: string;
        text: string;
        publishAt: Date | string;
    }): Promise<unknown>;
    static commentOnPost(input: {
        actor?: string;
        objectUrn: string;
        message: string;
    }): Promise<unknown>;
    static replyToComment(input: {
        actor?: string;
        parentCommentUrn: string;
        message: string;
    }): Promise<unknown>;
    static deleteComment(input: {
        encodedCommentUrn: string;
    }): Promise<unknown>;
    static likePost(input: {
        actor?: string;
        objectUrn: string;
    }): Promise<unknown>;
    static unlikePost(input: {
        actorUrn?: string;
        encodedObjectUrn: string;
    }): Promise<unknown>;
    static sendDirectMessage(input: {
        actor?: string;
        recipientUrn: string;
        text: string;
    }): Promise<unknown>;
    static getPostAnalytics(input: {
        postUrn: string;
    }): Promise<unknown>;
    static getOrganizationAnalytics(input: {
        orgUrn?: string;
    }): Promise<unknown>;
    static registerUpload(input: {
        owner?: string;
        mediaType: "image" | "video";
        fileSize: number;
    }): Promise<{
        value: {
            uploadMechanism: Record<string, unknown>;
            asset: string;
        };
    }>;
    static uploadBinary(input: {
        uploadUrl: string;
        mediaPath: string;
    }): Promise<axios.AxiosResponse<any, any, {}>>;
    static deletePost(input: {
        encodedPostUrn: string;
    }): Promise<unknown>;
}

declare class YouTube {
    static createVideoUploadSession(input: {
        title: string;
        description?: string;
        privacyStatus?: "private" | "public" | "unlisted";
    }): Promise<unknown>;
    static uploadBinary(input: {
        uploadUrl: string;
        mediaPath: string;
    }): Promise<axios.AxiosResponse<any, any, {}>>;
    static listMyVideos(input: {
        maxResults?: number;
    }): Promise<unknown>;
    static updateVideoMetadata(input: {
        videoId: string;
        title?: string;
        description?: string;
        privacyStatus?: "private" | "public" | "unlisted";
    }): Promise<unknown>;
    static deleteVideo(input: {
        videoId: string;
    }): Promise<unknown>;
    static commentOnVideo(input: {
        videoId: string;
        text: string;
    }): Promise<unknown>;
    static replyToComment(input: {
        parentCommentId: string;
        text: string;
    }): Promise<unknown>;
    static likeVideo(input: {
        videoId: string;
    }): Promise<unknown>;
    static unlikeVideo(input: {
        videoId: string;
    }): Promise<unknown>;
    static createPlaylist(input: {
        title: string;
        description?: string;
        privacyStatus?: "private" | "public" | "unlisted";
    }): Promise<unknown>;
    static addVideoToPlaylist(input: {
        playlistId: string;
        videoId: string;
    }): Promise<unknown>;
    static getChannelAnalytics(input: {
        startDate: string;
        endDate: string;
        metrics?: string;
    }): Promise<any>;
    static scheduleVideoMetadataUpdate(input: {
        videoId: string;
        title?: string;
        description?: string;
        privacyStatus?: "private" | "public" | "unlisted";
        publishAt: Date | string;
    }): Promise<unknown>;
}

declare class TikTok {
    static createPost(input: {
        text: string;
        visibility?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY";
    }): Promise<unknown>;
    static createVideoPost(input: {
        title: string;
        videoUrl: string;
        visibility?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY";
    }): Promise<unknown>;
    static getPostStatus(input: {
        publishId: string;
    }): Promise<unknown>;
    static listVideos(input: {
        maxCount?: number;
    }): Promise<unknown>;
    static deleteVideo(input: {
        videoId: string;
    }): Promise<unknown>;
    static commentOnVideo(input: {
        videoId: string;
        text: string;
    }): Promise<unknown>;
    static replyToComment(input: {
        commentId: string;
        text: string;
    }): Promise<unknown>;
    static likeVideo(input: {
        videoId: string;
    }): Promise<unknown>;
    static unlikeVideo(input: {
        videoId: string;
    }): Promise<unknown>;
    static getVideoAnalytics(input: {
        videoIds: string[];
    }): Promise<unknown>;
    static getProfileAnalytics(input: {
        fields?: string[];
    }): Promise<unknown>;
    static scheduleVideoPost(input: {
        title: string;
        videoUrl: string;
        publishAt: Date | string;
    }): Promise<unknown>;
}

declare class Pinterest {
    static createPin(input: {
        boardId?: string;
        title: string;
        description?: string;
        link?: string;
        mediaSourceUrl: string;
    }): Promise<unknown>;
    static createVideoPin(input: {
        boardId?: string;
        title: string;
        description?: string;
        mediaSourceUrl: string;
    }): Promise<unknown>;
    static updatePin(input: {
        pinId: string;
        title?: string;
        description?: string;
        link?: string;
    }): Promise<unknown>;
    static deletePin(input: {
        pinId: string;
    }): Promise<unknown>;
    static listPins(input: {
        boardId?: string;
        pageSize?: number;
    }): Promise<unknown>;
    static createBoard(input: {
        name: string;
        description?: string;
        privacy?: "PUBLIC" | "PROTECTED" | "SECRET";
    }): Promise<unknown>;
    static listBoards(input: {
        pageSize?: number;
    }): Promise<unknown>;
    static commentOnPin(input: {
        pinId: string;
        text: string;
    }): Promise<unknown>;
    static replyToComment(input: {
        pinId: string;
        commentId: string;
        text: string;
    }): Promise<unknown>;
    static getPinAnalytics(input: {
        pinId: string;
        startDate: string;
        endDate: string;
    }): Promise<unknown>;
    static getAccountAnalytics(input: {
        startDate: string;
        endDate: string;
    }): Promise<unknown>;
    static schedulePin(input: {
        title: string;
        mediaSourceUrl: string;
        boardId?: string;
        publishAt: Date | string;
    }): Promise<unknown>;
}

declare class Bluesky {
    static postText(input: {
        text: string;
    }): Promise<unknown>;
    static postWithLink(input: {
        text: string;
        url: string;
    }): Promise<unknown>;
    static replyToPost(input: {
        text: string;
        rootUri: string;
        rootCid: string;
        parentUri: string;
        parentCid: string;
    }): Promise<unknown>;
    static likePost(input: {
        subjectUri: string;
        subjectCid: string;
    }): Promise<unknown>;
    static repost(input: {
        subjectUri: string;
        subjectCid: string;
    }): Promise<unknown>;
    static deleteRecord(input: {
        uri: string;
    }): Promise<unknown>;
    static getAuthorFeed(input: {
        actorDidOrHandle: string;
        limit?: number;
    }): Promise<unknown>;
    static searchPosts(input: {
        query: string;
        limit?: number;
    }): Promise<unknown>;
    static getPostThread(input: {
        uri: string;
        depth?: number;
    }): Promise<unknown>;
    static getNotificationFeed(input: {
        limit?: number;
    }): Promise<unknown>;
    static schedulePost(input: {
        text: string;
        publishAt: Date | string;
    }): Promise<unknown>;
}

declare class Mastodon {
    static createStatus(input: {
        text: string;
        visibility?: "public" | "unlisted" | "private" | "direct";
    }): Promise<unknown>;
    static uploadMedia(input: {
        mediaPath: string;
        description?: string;
    }): Promise<axios.AxiosResponse<any, any, {}>>;
    static createMediaStatus(input: {
        text: string;
        mediaIds: string[];
        visibility?: "public" | "unlisted" | "private" | "direct";
    }): Promise<unknown>;
    static replyToStatus(input: {
        statusId: string;
        text: string;
    }): Promise<unknown>;
    static deleteStatus(input: {
        statusId: string;
    }): Promise<unknown>;
    static favouriteStatus(input: {
        statusId: string;
    }): Promise<unknown>;
    static unfavouriteStatus(input: {
        statusId: string;
    }): Promise<unknown>;
    static boostStatus(input: {
        statusId: string;
    }): Promise<unknown>;
    static unboostStatus(input: {
        statusId: string;
    }): Promise<unknown>;
    static listMyStatuses(input: {
        limit?: number;
    }): Promise<unknown>;
    static getStatusContext(input: {
        statusId: string;
    }): Promise<unknown>;
    static getAccountAnalytics(input: {
        instanceScope?: "day" | "week" | "month";
    }): Promise<unknown>;
    static scheduleStatus(input: {
        text: string;
        publishAt: Date | string;
    }): Promise<unknown>;
}

declare class Threads {
    static postText(input: {
        threadsUserId?: string;
        text: string;
    }): Promise<unknown>;
    static postImage(input: {
        threadsUserId?: string;
        text?: string;
        imageUrl: string;
    }): Promise<unknown>;
    static postVideo(input: {
        threadsUserId?: string;
        text?: string;
        videoUrl: string;
    }): Promise<unknown>;
    static replyToThread(input: {
        threadsUserId?: string;
        threadId: string;
        text: string;
    }): Promise<unknown>;
    static deleteThread(input: {
        threadId: string;
    }): Promise<unknown>;
    static getThread(input: {
        threadId: string;
        fields?: string[];
    }): Promise<unknown>;
    static listMyThreads(input: {
        threadsUserId?: string;
        limit?: number;
    }): Promise<unknown>;
    static getThreadInsights(input: {
        threadId: string;
        metrics?: string[];
    }): Promise<unknown>;
    static getAccountInsights(input: {
        threadsUserId?: string;
        metrics?: string[];
        period?: "day" | "week" | "days_28";
    }): Promise<unknown>;
    static likeThread(input: {
        threadId: string;
    }): Promise<unknown>;
    static unlikeThread(input: {
        threadId: string;
    }): Promise<unknown>;
    static scheduleTextPost(input: {
        threadsUserId?: string;
        text: string;
        publishAt: Date | string;
    }): Promise<unknown>;
}

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

export { type AnalyticsRange, type BaseResult, Bluesky, Facebook, Instagram, LinkedIn, Mastodon, type MediaUploadOptions, Pinterest, type Platform, type RetryOptions, type ScheduleOptions, SocialError, Threads, TikTok, X, YouTube };
