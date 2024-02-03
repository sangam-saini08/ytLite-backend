import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiRespones } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  let skip = parseInt(limit * (page - 1));
  const match = {};
  if (query) {
    match.title = { $regex: query, $options: "i" };
  }

  if (userId) {
    match.userId = userId;
  }

  const sort = {};
  if (sortBy) {
    sort[sortBy] = sortType === "desc" ? -1 : 1;
  }

  const pipeline = [{ $match: match }];

  if (Object.keys(sort).length > 0) {
    pipeline.push({ $sort: sort });
  }

  pipeline.push({ $skip: skip }, { $limit: limit });

  pipeline.push({
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "owner",
      pipeline: [
        {
          $project: {
            _id: 1,
            username: 1,
            email: 1,
            fullName: 1,
            avatar: 1,
            coverImage: 1,
            wathchHistory: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ],
    },
  });

  const videos = await Video.aggregate(pipeline);
  console.log(videos);

  res.status(200).json(new ApiRespones(200, videos, "videos fetch success"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!title || !description) {
    throw new ApiError(400, "all fields are required");
  }

  const vidoeLocalPath = req.files.videoFile[0].path;
  const thumbnailLocalPath = req.files.thumbnail[0].path;

  if (!vidoeLocalPath) {
    throw new ApiError(400, "video local path is missing");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail local path is missing");
  }

  const video = await uploadOnCloudinary(vidoeLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!video || !thumbnail) {
    throw new ApiError(
      400,
      "error uploading video and thumnail on cloudinary "
    );
  }

  const uploadedVideo = await Video.create({
    videoFile: video.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: video.duration,
    owner: new mongoose.Types.ObjectId(req.user._id),
  });

  if (!updateVideo) {
    throw new ApiError(
      500,
      "Something went wrong while uploading video on database"
    );
  }

  res
    .status(201)
    .json(new ApiRespones(201, updateVideo, "video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
