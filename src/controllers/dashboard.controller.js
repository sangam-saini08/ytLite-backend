import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscribe.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiRespones } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const user = req.user;

  const totalVideos = await Video.countDocuments({ owner: user._id });
  const totalSubscribers = await Subscription.countDocuments({
    channel: user._id,
  });
  const totalVideoViews = await Video.aggregate([
    { $match: { owner: user._id } },
    { $group: { _id: null, totalViews: { $sum: "$views" } } },
  ]);

  const stats = {
    videos: totalVideos,
    currentSubscribers: totalSubscribers,
    views: totalVideoViews[0].totalViews,
  };
  return res.json(new ApiRespones(200, stats, "worked"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
});

export { getChannelStats, getChannelVideos };
