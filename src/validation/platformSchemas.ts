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
