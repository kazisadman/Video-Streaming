import mongoose from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const userId = req.user?._id;

  if (!content || !userId) {
    throw new apiError(400, "Content is empty");
  }

  const tweet = await Tweet.create({
    owner: userId,
    content,
  });

  if (!tweet) {
    throw new apiError(500, "Something went wrong while inserting tweet");
  }

  res.status(200).json(new apiResponse(200, {}, "Tweet posted successfully"));
});

const getTweet = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new apiError(400, "User id missing");
  }

  const tweet = await Tweet.find({
    owner: new mongoose.Types.ObjectId(userId),
  });
  console.log(tweet);

  if (!tweet) {
    throw new apiError(404, "No tweets available");
  }

  res
    .status(200)
    .json(new apiResponse(200, tweet, "Tweet fetched successfully"));
});

export { createTweet, getTweet };
