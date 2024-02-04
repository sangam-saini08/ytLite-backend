import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiRespones } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

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

  if (!videoId) {
    throw new ApiError(400, "Couldn't find video");
  }

  const pipeline = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
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
    },
  ];

  const video = await Video.aggregate(pipeline);

  if (!video) {
    throw new ApiError(400, "Couldn't find video");
  }

  res.status(200).json(new ApiRespones(200, video, "video fetch success"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail

  const { title, description } = req.body;
  const thumbnailLocalPath = req.file.path;

  if (!title && !description && !thumbnailLocalPath) {
    throw new ApiError(400, "At least one field must be provided for update.");
  }

  const existingVideo = await Video.findById(videoId);

  if (!existingVideo) {
    throw new ApiError(400, "videoId is invalid.");
  }

  const updateFields = {};
  if (title) {
    updateFields.title = title;
  }
  if (description) {
    updateFields.description = description;
  }
  if (thumbnailLocalPath) {
    const updatedthumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!updatedthumbnail) {
      throw new ApiError(400, "thumbnail is not uploaded on cloudinary");
    }

    const publicId = existingVideo.thumbnail.split("/").pop().split(".")[0];
    console.log("this is the public id ----", publicId);

    const response = await deleteFromCloudinary(publicId);
    if (response === null) {
      console.log("delete unsuccessful");
    } else {
      console.log("this is the response-----", response);
    }
    updateFields.thumbnail = updatedthumbnail.url;
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    { _id: videoId },
    { $set: updateFields },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(400, "updateVideo is not found");
  }
  console.log("this is the updated video", updatedVideo);

  return res
    .status(200)
    .json(new ApiRespones(200, updatedVideo, "video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  const exitiedVideo = await Video.findById(videoId);

  if (!exitiedVideo) {
    throw new ApiError(400, "videoID is invaild");
  }

  const videoPublicId = exitiedVideo.videoFile.split("/").pop().split(".")[0];
  const thumbnailPublicId = exitiedVideo.thumbnail
    .split("/")
    .pop()
    .split(".")[0];
  const videoDeletedResponse = await deleteFromCloudinary(videoPublicId);
  const thumbnailDeletedResponse =
    await deleteFromCloudinary(thumbnailPublicId);

  console.log(videoDeletedResponse);
  console.log(thumbnailDeletedResponse);
  const deletedVideo = await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiRespones(200, deleteVideo, "delted video successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const exitedVideo = await Video.findById(videoId);

  if (!exitedVideo) {
    throw new ApiError(400, "videoId is invalid");
  }

  await Video.findByIdAndUpdate(
    { _id: exitedVideo._id },
    { $set: { isPublished: !exitedVideo.isPublished } }
  );

  return res
    .status(200)
    .json(new ApiRespones(200, {}, "togglePublishStatus Success"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
