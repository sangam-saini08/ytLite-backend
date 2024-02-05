import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiRespones } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page, limit = 10 } = req.query;

  let skip = parseInt(limit * (page - 1));

  if (!isValidObjectId(videoId)) {
    throw new ApiError("Invalid video id");
  }

  const allComments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "onwer",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    { $skip: skip },
    { $limit: limit },
  ]);

  if (!allComments) {
    throw new ApiError(400, "something went wrong while getallcomments");
  }

  return res
    .status(200)
    .json(
      new ApiRespones(200, allComments, "all comments fetched successfully")
    );
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "title must be provided");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "videoId must be a valid id");
  }

  const addedComment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });

  if (!addedComment) {
    throw new ApiError(
      400,
      "something went wrong while add comment to the video"
    );
  }

  return res
    .status(200)
    .json(new ApiRespones(200, addedComment, "addedComment successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "title must be provided");
  }

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "invalid comment id");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    { _id: commentId },
    { content },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(400, "something went wrong while updating comment");
  }

  return res
    .status(200)
    .json(new ApiRespones(200, {}, "comment update success"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "invalid comment id");
  }

  const deleteComment = await Comment.findByIdAndDelete({ _id: commentId });

  if (!deleteComment) {
    throw new ApiError(400, "something went wrong while deleting comment");
  }

  return res
    .status(200)
    .json(new ApiRespones(200, {}, "comment delete success"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
