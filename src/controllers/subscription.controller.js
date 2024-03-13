import mongoose from "mongoose";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.models.js";
import { apiResponse } from "../utils/apiResponse";

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

export { toogleSubscription };
