import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";

const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!isValidObjectId(userId)) {
    throw new apiError(404, "User not found");
  }

  const videos = await Video.find({
    owner: new mongoose.Types.ObjectId(userId),
  });

  res
    .status(200)
    .json(new apiResponse(200, videos, "All video fetched successfully"));
});

export { getChannelVideos };
