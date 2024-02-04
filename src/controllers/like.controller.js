import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiRespones } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id"); // check if channelId is valid
  }

  const alreadylikedTheVideo = await Like.findOne({
    $and: [{ Video: videoId }, { likedBy: req.user._id }],
  });

  if (alreadylikedTheVideo) {
    throw new ApiError(400, " already liked the video");
  }

  const likeDocument = await Like.create({
    Video: videoId,
    likedBy: req.user._id,
  });

  //   console.log("this is the like document", likeDocument);

  if (!likeDocument) {
    throw new ApiError(400, "something went wrong while like the video");
  }

  return res
    .status(200)
    .json(new ApiRespones(200, likeDocument, "video like successfully "));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment Id"); // check if channelId is valid
  }

  const alreadylikedTheComment = await Like.findOne({
    $and: [{ comment: commentId }, { likedBy: req.user._id }],
  });

  if (alreadylikedTheComment) {
    throw new ApiError(400, " already liked the comment");
  }

  const likeDocument = await Like.create({
    comment: commentId,
    likedBy: req.user._id,
  });

  //   console.log("this is the like document", likeDocument);

  if (!likeDocument) {
    throw new ApiError(400, "something went wrong while like the comment");
  }

  return res
    .status(200)
    .json(new ApiRespones(200, likeDocument, "comment like successfully "));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet Id"); // check if channelId is valid
  }

  const alreadylikedTheTweet = await Like.findOne({
    $and: [{ tweet: tweetId }, { likedBy: req.user._id }],
  });

  if (alreadylikedTheTweet) {
    throw new ApiError(400, " already liked the tweet");
  }

  const likeDocument = await Like.create({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  //   console.log("this is the like document", likeDocument);

  if (!likeDocument) {
    throw new ApiError(400, "something went wrong while like the tweet");
  }

  return res
    .status(200)
    .json(new ApiRespones(200, likeDocument, "tweet like successfully "));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        tweet: null,
        comment: null,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "Video",
        foreignField: "_id",
        as: "data",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ]);

  //   console.log(likedVideos[0].data[0]);

  if (!likedVideos) {
    throw new ApiError(400, "something went wrong while fetching liked videos");
  }

  return res
    .status(200)
    .json(
      new ApiRespones(
        200,
        likedVideos[0].data,
        "like videos fetched successfully"
      )
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
