import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { Comment } from "../models/comment.models.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";

const getAllComment = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { videoId } = req.params;


  if (!isValidObjectId(videoId) ) {
    throw new apiError(404, "Video not found");
  }

  const commentAggregate = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
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

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const comment = await Comment.aggregatePaginate(commentAggregate, options);

  res
    .status(200)
    .json(new apiResponse(200, comment, "Comment fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { videoId } = req.params;

  if (isValidObjectId(videoId) === false) {
    throw new apiError(404, "Video not found");
  }

  if (content === "") {
    throw new apiError(401, "Conent is empty");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new apiError(500, "Something went wrong while comment insertion");
  }

  res
    .status(200)
    .json(new apiResponse(200, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { commentId } = req.params;

  if (isValidObjectId(commentId) === false) {
    throw new apiError(404, "Comment not found");
  }

  if (content === "") {
    throw new apiError(400, "Content is empty");
  }

  const matchedComment = await Comment.findById(commentId);

  if (!matchedComment.owner.equals(req.user?._id)) {
    throw new apiError(401, "Unauthorized request");
  }

  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: content,
      },
    },
    {
      new: true,
    }
  );

  if (!comment) {
    throw new apiError(500, "Something went wrong while comment updating");
  }

  res
    .status(200)
    .json(new apiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (isValidObjectId(commentId) === false) {
    throw new apiError(404, "Comment not found");
  }

  const matchedComment = await Comment.findById(commentId);

  if (!matchedComment.owner.equals(req.user?._id)) {
    throw new apiError(401, "Unauthorized request");
  }

  const comment = await Comment.findByIdAndDelete(commentId);

  if (!comment) {
    throw new apiError(500, "Something went wrong while deleting comment");
  }

  res
    .status(200)
    .json(new apiResponse(200, {}, "Comment deleted successfully"));
});

export { addComment, updateComment, deleteComment, getAllComment };
