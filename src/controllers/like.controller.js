import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { Like } from "../models/like.models.js";
import { apiResponse } from "../utils/apiResponse.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(videoId)) {
    throw new apiError(401, "Video not found");
  }

  const matchedLike = await Like.find({
    video: videoId,
    likedBy: userId,
  });

  if (matchedLike.length === 1) {
    await Like.findByIdAndDelete(matchedLike[0]._id);
    res
      .status(200)
      .json(new apiResponse(200, {}, "Video unliked successfully"));
  } else {
    const like = await Like.create({
      video: videoId,
      likedBy: userId,
    });

    if (!like) {
      throw new apiError(500, "Something went wrong while video like");
    }

    res
      .status(200)
      .json(new apiResponse(200, like, "Video Liked successfully"));
  }
});
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { tweet } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(commentId)) {
    throw new apiError(401, "Comment not found");
  }

  const matchedLike = await Like.find({
    comment: commentId,
    likedBy: userId,
  });

  if (matchedLike.length === 1) {
    await Like.findByIdAndDelete(matchedLike[0]._id);
    res
      .status(200)
      .json(new apiResponse(200, {}, "Comment unliked successfully"));
  } else {
    const like = await Like.create({
      comment: commentId,
      likedBy: userId,
    });

    if (!like) {
      throw new apiError(500, "Something went wrong while comment like");
    }

    res
      .status(200)
      .json(new apiResponse(200, like, "Comment Liked successfully"));
  }
});
const toggleTwitterLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(tweetId)) {
    throw new apiError(401, "Tweet not found");
  }

  const matchedLike = await Like.find({
    tweet: tweetId,
    likedBy: userId,
  });

  if (matchedLike.length === 1) {
    await Like.findByIdAndDelete(matchedLike[0]._id);
    res
      .status(200)
      .json(new apiResponse(200, {}, "Tweet unliked successfully"));
  } else {
    const like = await Like.create({
      tweet: tweetId,
      likedBy: userId,
    });

    if (!like) {
      throw new apiError(500, "Something went wrong while tweet like");
    }

    res
      .status(200)
      .json(new apiResponse(200, like, "Tweet Liked successfully"));
  }
});

const getAllLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const likedVideo = await Like.aggregate([
    {
      $match: {
        likedBy: userId,
        video: { $exists: "true" },
      },
    },
  ]);

  res.status(200).json(new apiResponse(200, likedVideo, "Liked video fetched"));
});

export { toggleVideoLike, toggleCommentLike, toggleTwitterLike,getAllLikedVideos };
