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

  const totalLikes = await Video.aggregate([
    { $match: { owner: user._id } },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "Video",
        as: "likes",
      },
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: { $size: "$likes" } },
      },
    },
  ]);

  console.log("Total likes for all videos:", totalLikes);

  const stats = {
    videos: totalVideos,
    currentSubscribers: totalSubscribers,
    views: totalVideoViews[0].totalViews,
    Likes: totalLikes[0].totalLikes,
  };
  return res.json(new ApiRespones(200, stats, "stats fetched successfully "));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const user = req.user;
  let sortBy = req.query.sortBy || "latest";
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;

  let sortCriteria = {};

  if (sortBy === "latest") {
    sortCriteria = { createdAt: -1 };
  } else if (sortBy === "popular") {
    sortCriteria = { views: -1 };
  } else if (sortBy === "oldest") {
    sortCriteria = { createdAt: 1 };
  } else {
    throw new ApiError(400, "Invalid sortBy parameter");
  }

  const videos = await Video.aggregate([
    { $match: { owner: user._id } },
    { $sort: sortCriteria },
    { $skip: (page - 1) * pageSize },
    { $limit: pageSize },
  ]);

  return res.json(new ApiRespones(200, videos, "vides fetched successfull"));
});

export { getChannelStats, getChannelVideos };
