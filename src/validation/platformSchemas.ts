import { z } from "zod";
import { SocialError } from "../errors/SocialError.js";
import type { Platform } from "../types.js";

const nonEmpty = z.string().min(1);
const optionalNonEmpty = nonEmpty.optional();
const dateLike = z.union([z.date(), z.string().min(1)]);

const schemaMap = {
  x: {
    postTweet: z.object({ text: nonEmpty, mediaIds: z.array(nonEmpty).optional() }),
    postThread: z.object({ tweets: z.array(nonEmpty).min(1) }),
    replyTweet: z.object({ text: nonEmpty, inReplyToTweetId: nonEmpty }),
    quoteTweet: z.object({ text: nonEmpty, quoteTweetId: nonEmpty }),
    deleteTweet: z.object({ tweetId: nonEmpty }),
    retweet: z.object({ userId: nonEmpty, tweetId: nonEmpty }),
    unretweet: z.object({ userId: nonEmpty, tweetId: nonEmpty }),
    likeTweet: z.object({ userId: nonEmpty, tweetId: nonEmpty }),
    unlikeTweet: z.object({ userId: nonEmpty, tweetId: nonEmpty }),
    uploadMedia: z.object({ mediaPath: nonEmpty }),
    postPhoto: z.object({ mediaPath: nonEmpty, text: nonEmpty }),
    postVideo: z.object({ mediaPath: nonEmpty, text: nonEmpty }),
    postPoll: z.object({
      text: nonEmpty,
      options: z.array(nonEmpty).min(2).max(4),
      durationMinutes: z.number().int().min(5).max(10080)
    }),
    sendDirectMessage: z.object({ recipientId: nonEmpty, text: nonEmpty }),
    getTweetAnalytics: z.object({ tweetId: nonEmpty }),
    scheduleTweet: z.object({ text: nonEmpty, publishAt: dateLike })
  },
  facebook: {
    publishToPage: z.object({
      pageId: optionalNonEmpty,
      message: nonEmpty,
      link: optionalNonEmpty,
      photoUrl: optionalNonEmpty
    }),
    publishPhoto: z.object({ pageId: optionalNonEmpty, url: nonEmpty, caption: optionalNonEmpty }),
    publishVideo: z.object({
      pageId: optionalNonEmpty,
      fileUrl: nonEmpty,
      description: optionalNonEmpty,
      title: optionalNonEmpty
    }),
    publishCarousel: z.object({
      pageId: optionalNonEmpty,
      message: nonEmpty,
      photoUrls: z.array(nonEmpty).min(2)
    }),
    publishStory: z.object({ pageId: optionalNonEmpty, photoUrl: nonEmpty }),
    schedulePost: z.object({ pageId: optionalNonEmpty, message: nonEmpty, publishAt: dateLike }),
    commentOnPost: z.object({ postId: nonEmpty, message: nonEmpty }),
    replyToComment: z.object({ commentId: nonEmpty, message: nonEmpty }),
    likeObject: z.object({ objectId: nonEmpty }),
    deletePost: z.object({ objectId: nonEmpty }),
    sendPageMessage: z.object({ recipientPsid: nonEmpty, message: nonEmpty, pageId: optionalNonEmpty }),
    getPostInsights: z.object({ postId: nonEmpty, metrics: z.array(nonEmpty).optional() }),
    getPageInsights: z.object({
      pageId: optionalNonEmpty,
      metrics: z.array(nonEmpty).optional(),
      period: z.enum(["day", "week", "days_28"]).optional()
    }),
    uploadResumableVideo: z.object({
      pageId: optionalNonEmpty,
      fileSize: z.number().int().positive(),
      startOffset: z.number().int().nonnegative().optional()
    }),
    listPublishedPosts: z.object({
      pageId: optionalNonEmpty,
      limit: z.number().int().positive().optional()
    })
  },
  instagram: {
    uploadPhoto: z.object({ igUserId: optionalNonEmpty, imageUrl: nonEmpty, caption: optionalNonEmpty }),
    uploadVideo: z.object({ igUserId: optionalNonEmpty, videoUrl: nonEmpty, caption: optionalNonEmpty }),
    uploadReel: z.object({
      igUserId: optionalNonEmpty,
      mediaPath: optionalNonEmpty,
      videoUrl: nonEmpty,
      caption: optionalNonEmpty
    }),
    uploadStoryPhoto: z.object({ igUserId: optionalNonEmpty, imageUrl: nonEmpty }),
    uploadStoryVideo: z.object({ igUserId: optionalNonEmpty, videoUrl: nonEmpty }),
    publishCarousel: z.object({
      igUserId: optionalNonEmpty,
      caption: optionalNonEmpty,
      items: z.array(z.object({ imageUrl: optionalNonEmpty, videoUrl: optionalNonEmpty })).min(2)
    }),
    commentOnMedia: z.object({ mediaId: nonEmpty, message: nonEmpty }),
    replyToComment: z.object({ commentId: nonEmpty, message: nonEmpty }),
    hideComment: z.object({ commentId: nonEmpty, hide: z.boolean() }),
    deleteComment: z.object({ commentId: nonEmpty }),
    deleteMedia: z.object({ mediaId: nonEmpty }),
    sendPrivateReply: z.object({ commentId: nonEmpty, message: nonEmpty }),
    getMediaInsights: z.object({ mediaId: nonEmpty, metrics: z.array(nonEmpty).optional() }),
    getAccountInsights: z.object({
      igUserId: optionalNonEmpty,
      metrics: z.array(nonEmpty).optional(),
      period: z.enum(["day", "week", "days_28"]).optional()
    }),
    getPublishingLimit: z.object({ igUserId: optionalNonEmpty }),
    scheduleReel: z.object({
      igUserId: optionalNonEmpty,
      videoUrl: nonEmpty,
      caption: optionalNonEmpty,
      publishAt: dateLike
    })
  },
  linkedin: {
    createTextPost: z.object({
      author: optionalNonEmpty,
      text: nonEmpty,
      visibility: z.enum(["PUBLIC", "CONNECTIONS"]).optional()
    }),
    createImagePost: z.object({ author: optionalNonEmpty, text: nonEmpty, mediaUrn: nonEmpty }),
    createVideoPost: z.object({ author: optionalNonEmpty, text: nonEmpty, mediaUrn: nonEmpty }),
    createCarouselPost: z.object({
      author: optionalNonEmpty,
      text: nonEmpty,
      mediaUrns: z.array(nonEmpty).min(2)
    }),
    schedulePost: z.object({ author: optionalNonEmpty, text: nonEmpty, publishAt: dateLike }),
    commentOnPost: z.object({ actor: optionalNonEmpty, objectUrn: nonEmpty, message: nonEmpty }),
    replyToComment: z.object({
      actor: optionalNonEmpty,
      parentCommentUrn: nonEmpty,
      message: nonEmpty
    }),
    deleteComment: z.object({ encodedCommentUrn: nonEmpty }),
    likePost: z.object({ actor: optionalNonEmpty, objectUrn: nonEmpty }),
    unlikePost: z.object({ actorUrn: optionalNonEmpty, encodedObjectUrn: nonEmpty }),
    sendDirectMessage: z.object({
      actor: optionalNonEmpty,
      recipientUrn: nonEmpty,
      text: nonEmpty
    }),
    getPostAnalytics: z.object({ postUrn: nonEmpty }),
    getOrganizationAnalytics: z.object({ orgUrn: optionalNonEmpty }),
    registerUpload: z.object({
      owner: optionalNonEmpty,
      mediaType: z.enum(["image", "video"]),
      fileSize: z.number().int().positive()
    }),
    uploadBinary: z.object({ uploadUrl: nonEmpty, mediaPath: nonEmpty }),
    deletePost: z.object({ encodedPostUrn: nonEmpty })
  },
  youtube: {
    createVideoUploadSession: z.object({
      title: nonEmpty,
      description: optionalNonEmpty,
      privacyStatus: z.enum(["private", "public", "unlisted"]).optional()
    }),
    uploadBinary: z.object({ uploadUrl: nonEmpty, mediaPath: nonEmpty }),
    listMyVideos: z.object({ maxResults: z.number().int().positive().optional() }),
    updateVideoMetadata: z.object({
      videoId: nonEmpty,
      title: optionalNonEmpty,
      description: optionalNonEmpty,
      privacyStatus: z.enum(["private", "public", "unlisted"]).optional()
    }),
    deleteVideo: z.object({ videoId: nonEmpty }),
    commentOnVideo: z.object({ videoId: nonEmpty, text: nonEmpty }),
    replyToComment: z.object({ parentCommentId: nonEmpty, text: nonEmpty }),
    likeVideo: z.object({ videoId: nonEmpty }),
    unlikeVideo: z.object({ videoId: nonEmpty }),
    createPlaylist: z.object({
      title: nonEmpty,
      description: optionalNonEmpty,
      privacyStatus: z.enum(["private", "public", "unlisted"]).optional()
    }),
    addVideoToPlaylist: z.object({ playlistId: nonEmpty, videoId: nonEmpty }),
    getChannelAnalytics: z.object({
      startDate: nonEmpty,
      endDate: nonEmpty,
      metrics: optionalNonEmpty
    }),
    scheduleVideoMetadataUpdate: z.object({
      videoId: nonEmpty,
      title: optionalNonEmpty,
      description: optionalNonEmpty,
      privacyStatus: z.enum(["private", "public", "unlisted"]).optional(),
      publishAt: dateLike
    })
  },
  tiktok: {
    createPost: z.object({
      text: nonEmpty,
      visibility: z
        .enum(["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY"])
        .optional()
    }),
    createVideoPost: z.object({
      title: nonEmpty,
      videoUrl: nonEmpty,
      visibility: z
        .enum(["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY"])
        .optional()
    }),
    getPostStatus: z.object({ publishId: nonEmpty }),
    listVideos: z.object({ maxCount: z.number().int().positive().optional() }),
    deleteVideo: z.object({ videoId: nonEmpty }),
    commentOnVideo: z.object({ videoId: nonEmpty, text: nonEmpty }),
    replyToComment: z.object({ commentId: nonEmpty, text: nonEmpty }),
    likeVideo: z.object({ videoId: nonEmpty }),
    unlikeVideo: z.object({ videoId: nonEmpty }),
    getVideoAnalytics: z.object({ videoIds: z.array(nonEmpty).min(1) }),
    getProfileAnalytics: z.object({ fields: z.array(nonEmpty).optional() }),
    scheduleVideoPost: z.object({
      title: nonEmpty,
      videoUrl: nonEmpty,
      publishAt: dateLike
    })
  },
  pinterest: {
    createPin: z.object({
      boardId: optionalNonEmpty,
      title: nonEmpty,
      description: optionalNonEmpty,
      link: optionalNonEmpty,
      mediaSourceUrl: nonEmpty
    }),
    createVideoPin: z.object({
      boardId: optionalNonEmpty,
      title: nonEmpty,
      description: optionalNonEmpty,
      mediaSourceUrl: nonEmpty
    }),
    updatePin: z.object({
      pinId: nonEmpty,
      title: optionalNonEmpty,
      description: optionalNonEmpty,
      link: optionalNonEmpty
    }),
    deletePin: z.object({ pinId: nonEmpty }),
    listPins: z.object({
      boardId: optionalNonEmpty,
      pageSize: z.number().int().positive().optional()
    }),
    createBoard: z.object({
      name: nonEmpty,
      description: optionalNonEmpty,
      privacy: z.enum(["PUBLIC", "PROTECTED", "SECRET"]).optional()
    }),
    listBoards: z.object({ pageSize: z.number().int().positive().optional() }),
    commentOnPin: z.object({ pinId: nonEmpty, text: nonEmpty }),
    replyToComment: z.object({
      pinId: nonEmpty,
      commentId: nonEmpty,
      text: nonEmpty
    }),
    getPinAnalytics: z.object({
      pinId: nonEmpty,
      startDate: nonEmpty,
      endDate: nonEmpty
    }),
    getAccountAnalytics: z.object({ startDate: nonEmpty, endDate: nonEmpty }),
    schedulePin: z.object({
      title: nonEmpty,
      mediaSourceUrl: nonEmpty,
      boardId: optionalNonEmpty,
      publishAt: dateLike
    })
  },
  bluesky: {
    postText: z.object({ text: nonEmpty }),
    postWithLink: z.object({ text: nonEmpty, url: nonEmpty }),
    replyToPost: z.object({
      text: nonEmpty,
      rootUri: nonEmpty,
      rootCid: nonEmpty,
      parentUri: nonEmpty,
      parentCid: nonEmpty
    }),
    likePost: z.object({ subjectUri: nonEmpty, subjectCid: nonEmpty }),
    repost: z.object({ subjectUri: nonEmpty, subjectCid: nonEmpty }),
    deleteRecord: z.object({ uri: nonEmpty }),
    getAuthorFeed: z.object({
      actorDidOrHandle: nonEmpty,
      limit: z.number().int().positive().optional()
    }),
    searchPosts: z.object({
      query: nonEmpty,
      limit: z.number().int().positive().optional()
    }),
    getPostThread: z.object({
      uri: nonEmpty,
      depth: z.number().int().positive().optional()
    }),
    getNotificationFeed: z.object({
      limit: z.number().int().positive().optional()
    }),
    schedulePost: z.object({ text: nonEmpty, publishAt: dateLike })
  },
  mastodon: {
    createStatus: z.object({
      text: nonEmpty,
      visibility: z.enum(["public", "unlisted", "private", "direct"]).optional()
    }),
    uploadMedia: z.object({ mediaPath: nonEmpty, description: optionalNonEmpty }),
    createMediaStatus: z.object({
      text: nonEmpty,
      mediaIds: z.array(nonEmpty).min(1),
      visibility: z.enum(["public", "unlisted", "private", "direct"]).optional()
    }),
    replyToStatus: z.object({ statusId: nonEmpty, text: nonEmpty }),
    deleteStatus: z.object({ statusId: nonEmpty }),
    favouriteStatus: z.object({ statusId: nonEmpty }),
    unfavouriteStatus: z.object({ statusId: nonEmpty }),
    boostStatus: z.object({ statusId: nonEmpty }),
    unboostStatus: z.object({ statusId: nonEmpty }),
    listMyStatuses: z.object({ limit: z.number().int().positive().optional() }),
    getStatusContext: z.object({ statusId: nonEmpty }),
    getAccountAnalytics: z.object({
      instanceScope: z.enum(["day", "week", "month"]).optional()
    }),
    scheduleStatus: z.object({ text: nonEmpty, publishAt: dateLike })
  },
  threads: {
    postText: z.object({ threadsUserId: optionalNonEmpty, text: nonEmpty }),
    postImage: z.object({
      threadsUserId: optionalNonEmpty,
      text: optionalNonEmpty,
      imageUrl: nonEmpty
    }),
    postVideo: z.object({
      threadsUserId: optionalNonEmpty,
      text: optionalNonEmpty,
      videoUrl: nonEmpty
    }),
    replyToThread: z.object({
      threadsUserId: optionalNonEmpty,
      threadId: nonEmpty,
      text: nonEmpty
    }),
    deleteThread: z.object({ threadId: nonEmpty }),
    getThread: z.object({
      threadId: nonEmpty,
      fields: z.array(nonEmpty).optional()
    }),
    listMyThreads: z.object({
      threadsUserId: optionalNonEmpty,
      limit: z.number().int().positive().optional()
    }),
    getThreadInsights: z.object({
      threadId: nonEmpty,
      metrics: z.array(nonEmpty).optional()
    }),
    getAccountInsights: z.object({
      threadsUserId: optionalNonEmpty,
      metrics: z.array(nonEmpty).optional(),
      period: z.enum(["day", "week", "days_28"]).optional()
    }),
    likeThread: z.object({ threadId: nonEmpty }),
    unlikeThread: z.object({ threadId: nonEmpty }),
    scheduleTextPost: z.object({
      threadsUserId: optionalNonEmpty,
      text: nonEmpty,
      publishAt: dateLike
    })
  }
} as const;

type MethodFor<P extends Platform> = keyof (typeof schemaMap)[P] & string;

export function validatePlatformInput<P extends Platform, M extends MethodFor<P>>(
  platform: P,
  method: M,
  input: unknown
): z.infer<(typeof schemaMap)[P][M]> {
  const schema = schemaMap[platform][method];
  const result = schema.safeParse(input);
  if (result.success) {
    return result.data;
  }

  throw new SocialError({
    platform,
    endpoint: `${platform}.${method}`,
    message: `Invalid input for ${platform}.${method}`,
    details: result.error.flatten()
  });
}
