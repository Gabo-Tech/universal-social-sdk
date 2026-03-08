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

type Platform = "x" | "facebook" | "instagram" | "linkedin";
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

export { type AnalyticsRange, type BaseResult, Facebook, Instagram, LinkedIn, type MediaUploadOptions, type Platform, type RetryOptions, type ScheduleOptions, SocialError, X };
