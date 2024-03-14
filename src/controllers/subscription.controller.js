import mongoose, { isValidObjectId } from "mongoose";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.models.js";
import { apiResponse } from "../utils/apiResponse";
import { User } from "../models/user.models.js";

const toogleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new apiError(401, "Channel not found");
  }

  const isSubscribed = await Subscription.find({
    subscriber: userId,
    channel: channelId,
  });

  if (isSubscribed) {
    Subscription.findByIdAndDelete(isSubscribed?._id);
    res.status(200).json(new apiResponse(200, {}, "Channel unsubscribed"));
  }

  await Subscription.create({
    subscriber: userId,
    channel: channelId,
  });

  res.status(200).json(200, {}, "Channel subscribed");
});

const getChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new apiError(404, "Channel not found");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribers",
      },
    },
    {
      $unwind: "$subscribers",
    },
    {
      $project: {
        _id: 0,
        subscriber: {
          userName: 1,
          avatar: 1,
          _id: 1,
          fullName: 1,
        },
      },
    },
  ]);

  res
    .status(200)
    .apiResponse(200, subscribers, "Subscribers fetched successfully");
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new apiError(404, "Channel not found");
  }

  const subscribedTo = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedTo",
      },
    },
    {
      $unwind: "$subscribedTo",
    },
    {
      $project: {
        _id: 0,
        subscribedTo: {
          fullName: 1,
          userName: 1,
          avatar: 1,
          _id: 1,
        },
      },
    },
  ]);

  res.status(200).json(200, subscribedTo, "Subscribed channel info fetched");
});

export { toogleSubscription, getChannelSubscribers, getSubscribedChannels };
