import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiRespones } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist

  if (!name || !description) {
    throw new ApiError(400, "ALL fieds are required");
  }

  const playlist = Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  if (!playlist) {
    throw new ApiError(400, "Failed to create playlist");
  }

  return res
    .status(200)
    .json(new ApiRespones(200, playlist, "playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "user id is not valid");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
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
  ]);

  if (!playlist) {
    throw new ApiError(400, "something went wrong while find playlist");
  }

  return res
    .status(200)
    .json(new ApiRespones(200, playlist, "playlist fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "playlist id is not valid");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "something went wrong while find playlist by id");
  }

  return res
    .status(200)
    .json(new ApiRespones(200, playlist, "playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) && !isValidObjectId(videoId)) {
    throw new ApiError(400, "playlist id or video id is not valid");
  }

  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);

  if (!playlist) {
    throw new ApiError(400, "playlist not found");
  }
  if (!video) {
    throw new ApiError(400, "video not found");
  }

  const videoIndex = playlist.videos.indexOf(videoId);
  if (videoIndex !== -1) {
    throw new ApiError(400, "video is already in the playlist");
  }

  playlist.videos.push(videoId);
  await playlist.save();

  return res
    .status(200)
    .json(new ApiRespones(200, {}, "video added successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  if (!isValidObjectId(playlistId) && !isValidObjectId(videoId)) {
    throw new ApiError(400, "playlist id or video id is not valid");
  }

  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);

  if (!playlist) {
    throw new ApiError(400, "playlist not found");
  }
  if (!video) {
    throw new ApiError(400, "video not found");
  }

  const videoIndex = playlist.videos.indexOf(videoId);
  if (videoIndex === -1) {
    throw new ApiError(400, "Video not found in playlist");
  }

  playlist.videos.splice(videoIndex, 1);
  await playlist.save();

  return res
    .status(200)
    .json(new ApiRespones(200, {}, "video removed to playlists"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "invalid playlist id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }

  await Playlist.findByIdAndDelete({ _id: playlist._id });

  return res.status(200).json(new ApiRespones(200, {}, "playlist deleted"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  if (!name || !description) {
    throw new ApiError(400, "all feilds are required");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    { _id: playlistId },
    { name, description },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(400, "update playlist is failed");
  }

  return res
    .status(200)
    .json(
      new ApiRespones(200, updatePlaylist, "playlist updated successfully ")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
