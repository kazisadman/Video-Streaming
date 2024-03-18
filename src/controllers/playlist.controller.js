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

  const playlist = await Playlist.findById(playlistId);

  res
    .status(200)
    .json(new apiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { videoId, playlistId } = req.params;

  const selectedVideoExist = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
        video: {
          $in: [mongoose.Types.ObjectId(videoId)],
        },
      },
    },
  ]);

  if (selectedVideoExist.length > 0) {
    throw new apiError(400, "Video already exist");
  }

  
});

//65f45403af89a4b8f2f599c2

export { createPlayList, getUserPlaylist, getPlaylistById };
