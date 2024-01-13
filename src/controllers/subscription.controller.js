import asyncHandler from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscribe.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiRespones } from "../utils/ApiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user._id;

  // console.log("this is the channle Id :", channelId);

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel Id"); // check if channelId is valid
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(400, "User not found in this channel Id");
  }

  const alreadySubscribed = await Subscription.findOne({
    $and: [{ channel: channelId }, { subscriber: subscriberId }],
  });

  if (alreadySubscribed) {
    throw new ApiError(400, " already subscribed ");
  }

  await Subscription.create({
    subscriber: subscriberId,
    channel: channel._id,
  });

  res.status(201).json(new ApiRespones(201, {}, "subscribed"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel Id"); // check if channelId is valid
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(400, "User not found in this channel Id");
  }

  const subscribers = await User.aggregate([
    {
      // first pipline
      $match: {
        username: channel.username,
      },
    },
    {
      // second pipline
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      // third pipline
      $lookup: {
        from: "users",
        localField: "subscribers.subscriber",
        foreignField: "_id",
        as: "subscribersList",
        pipeline: [
          {
            // first sub pipline
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    // {
    //   // forth pipline
    //   $project: {
    //     subscribersList: 1,
    //   },
    // },
  ]);

  // console.log(subscribers[0].subscribersList);
  res
    .status(200)
    .json(
      new ApiRespones(
        200,
        subscribers[0].subscribersList,
        "list fetched successfully"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel Id"); // check if channelId is valid
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(400, "User not found in this channel Id");
  }

  const subscribedTo = await User.aggregate([
    {
      // first pipline
      $match: {
        username: channel.username,
      },
    },
    {
      // second pipline
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      // third pipline
      $lookup: {
        from: "users",
        localField: "subscribedTo.channel",
        foreignField: "_id",
        as: "subscribedToList",
        pipeline: [
          {
            // first sub pipline
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    // {
    //   // forth pipline
    //   $project: {
    //     subscribedToList: 1,
    //   },
    // },
  ]);

  res
    .status(200)
    .json(
      new ApiRespones(
        200,
        subscribedTo[0].subscribedToList,
        "list fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
