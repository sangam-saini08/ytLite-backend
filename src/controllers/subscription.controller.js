import asyncHandler from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscribe.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiRespones } from "../utils/ApiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user._id;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel Id"); // check if channelId is valid
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(400, "User not found in this channel Id");
  }

  const subscribe = await Subscription.create({
    subscriber: new mongoose.types.objectId(subscriberId),
    channel: new mongoose.types.objectId(channelId),
  });

  console.log(subscribe);

  res.status(201).json(new ApiRespones(201, {}, "subscribed"));
});

export { toggleSubscription };
