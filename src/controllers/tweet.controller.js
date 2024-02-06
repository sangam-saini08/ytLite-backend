import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiRespones } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet

  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "content must be required");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });

  if (!tweet) {
    throw new ApiError(400, "tweet not created");
  }

  return res
    .status(200)
    .json(new ApiRespones(200, tweet, "tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "user id not valid");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(user._id),
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiRespones(200, tweets, "all tweets feteched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { content } = req.body;
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  if (!content) {
    throw new ApiError(400, "content must be required");
  }

  const tweet = await Tweet.findByIdAndUpdate(
    { _id: tweetId },
    { content },
    { new: true }
  );

  if (!tweet) {
    throw new ApiError(400, "tweet not found");
  }

  return res
    .status(200)
    .json(new ApiRespones(200, tweet, "tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "tweet not found");
  }

  await Tweet.findByIdAndDelete(tweet._id);

  return res.status(200).json(new ApiRespones(200, {}, "tweet deleted"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
