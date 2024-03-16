import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/fileupload.js";
import mongoose from "mongoose";
import { User } from "../models/user.models.js";

const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (
    [title, description].some((input) => {
      input?.trim() === "";
    })
  ) {
    throw new apiError(400, "Invalid input");
  }

  const videoLocalPath = req.files.video[0]?.path;
  const thumbnailLocalPath = req.files.thumbnail[0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new apiError(400, "File missing");
  }

  const video = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!video.url || !thumbnail.url) {
    throw new apiError(500, "File not uploaded");
  }

  const videoData = await Video.create({
    title: title,
    description: description,
    videoFile: video.url,
    thumbnail: thumbnail.url,
    duration: video?.duration,
    owner: req.user?._id,
  });

  res
    .status(200)
    .json(new apiResponse(200, videoData, "Video uploaded successfully"));
});

const getAllVideo = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, userId } = req.query;
  const pipeline = [];

  if (query) {
    pipeline.push({
      $search: {
        index: "video-search",
        text: {
          query: query,
          path: ["title"],
        },
      },
    });
  }

  if (userId) {
    if (isValidObjectId(userId) === false) {
      throw new apiError(404, "User not found");
    }

    pipeline.push({
      $match: new mongoose.Types.ObjectId(userId),
    });
  }

  pipeline.push([
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerdetails",
        pipeline: [
          {
            $project: {
              userName: 1,
              avatar: 1,
              _id: 0,
            },
          },
        ],
      },
    },
    {
      $unwind: "$ownerdetails",
    },
  ]);

  const videoAggregate = await Video.aggregate(pipeline);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const video = Video.aggregatePaginate(videoAggregate, options);

  res
    .status(200)
    .json(new apiResponse(200, video, "Video fetched successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (mongoose.isValidObjectId(videoId) === false) {
    throw new apiError(404, "Video not found");
  }

  const video = await Video.findById(videoId);

  res
    .status(200)
    .json(new apiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (
    [title, description].some((input) => {
      input?.trim() === "";
    })
  ) {
    throw new apiError(400, "Invalid input");
  }

  if (!isValidObjectId(videoId)) {
    throw new apiError(404, "Video not found");
  }

  const thumbnailLocalPath = req.file?.path;
  let thumbnail;

  if (thumbnailLocalPath) {
    thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
      throw new apiError(500, "Error in thumbnail upload");
    }
  }

  const videoData = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title,
        description: description,
        thumbnail: thumbnail?.url,
      },
    },
    {
      new: true,
    }
    // thumbnail: thumbnail?.url,
  );

  res
    .status(200)
    .json(new apiResponse(200, videoData, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new apiError(404, "Video not found");
  }

  await Video.findByIdAndDelete(videoId);

  res.status(200).json(new apiResponse(200, {}, "Video deleted successfully"));
});

const toogleVideoPublish = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const videoData = await Video.findById(videoId);

  if (!videoData) {
    throw new apiError(404, "Video not found");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !videoData.isPublished,
      },
    },
    {
      new: true,
    }
  );

  res
    .status(200)
    .json(
      new apiResponse(
        200,
        {},
        `Video ${video.isPublished ? "published" : "unpublished"} successfully`
      )
    );
});

export {
  uploadVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  toogleVideoPublish,
  getAllVideo,
};
