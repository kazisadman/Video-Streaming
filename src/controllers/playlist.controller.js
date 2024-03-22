import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlayList = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (name === "") {
    throw new apiError(400, "Playlist name not found");
  }

  const playlist = await Playlist.create({
    name,
    description: description || "",
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new apiError(500, "Something went wrong while creating playlist");
  }

  res
    .status(200)
    .json(new apiResponse(200, playlist, "Playlist created successfully"));
});

const getUserPlaylist = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const playlist = await Playlist.find({
    owner: userId,
  });

  if (!playlist) {
    throw new apiError(404, "playlist not found");
  }

  res
    .status(200)
    .json(new apiResponse(200, playlist, "Playlist fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new apiError(404, "playlist not found");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },
    {
      $match: {
        "video.isPublished": true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        video: {
          _id: 1,
          title: 1,
          description: 1,
          thumbnail: 1,
          duration: 1,
          videoFile: 1,
        },
        owner: {
          userName: 1,
          fullName: 1,
          avatar: 1,
        },
      },
    },
  ]);

  res
    .status(200)
    .json(new apiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { videoId, playlistId } = req.params;

  if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
    throw new apiError(404, "Video or Playlist not found");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist.owner.equals(userId)) {
    throw new apiError(401, "Unauthorized request");
  }

  const selectedVideoExist = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
        _id: new mongoose.Types.ObjectId(playlistId),
        video: {
          $in: [new mongoose.Types.ObjectId(videoId)],
        },
      },
    },
  ]);
  if (selectedVideoExist.length > 0) {
    throw new apiError(400, "Video already exist");
  }

  const addVideo = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: {
        video: videoId,
      },
    },
    {
      new: true,
    }
  );

  res
    .status(200)
    .json(
      new apiResponse(200, addVideo, "Video added to playlist successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
    throw new apiError(404, "Video or Playlist not found");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist.owner.equals(userId)) {
    throw new apiError(401, "Unauthorized request");
  }

  await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { video: videoId },
    },
    {
      new: true,
    }
  );

  res
    .status(200)
    .json(new apiResponse(200, {}, "Video deleted from playlist successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(playlistId)) {
    throw new apiError(404, " Playlist not found");
  }

  const playlist = Playlist.findById(playlist);

  if (!playlist.owner.equals(userId)) {
    throw new apiError(401, "Unauthorized request");
  }

  await Playlist.findByIdAndDelete(playlistId);

  res
    .status(200)
    .json(new apiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { playlistId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(playlistId)) {
    throw new apiError(404, " Playlist not found");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist.owner.equals(userId)) {
    throw new apiError(401, "Unauthorized request");
  }

  if (name === "" && description === "") {
    throw new apiError(400, "Title and description is empty");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name: name,
        description: description,
      },
    },
    {
      new: true,
    }
  );

  res
    .status(200)
    .json(
      new apiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
});

export {
  createPlayList,
  getUserPlaylist,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
