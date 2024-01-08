import asyncHandler from "../utils/asyncHandler.js";
import Jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { ApiRespones } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const cookieOpitons = {
  httpOnly: true,
  secure: true,
};

const generateRefreshAndAccessTokens = async (user) => {
  try {
    const refreshToken = await user.generateRefreshToken();
    const accessToken = await user.generateAccessToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while getting refresh and access tokens"
    );
  }
};

const resgisterUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, username } = req.body;
  if (
    [fullName, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all fields are required");
  }
  const exitedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (exitedUser) {
    throw new ApiError(409, "User with email and username already exists");
  }

  let avatarLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files?.avatar[0]?.path;
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  let coverImage = "";

  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    email,
    username: username?.toLowerCase(),
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering a user");
  }

  return res
    .status(201)
    .json(new ApiRespones(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "email and password is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(400, "there is no user with email ");
  }

  if (!(await user.isPasswordCorrect(password))) {
    throw new ApiError(402, "invalid credentials");
  }

  const { refreshToken, accessToken } =
    await generateRefreshAndAccessTokens(user);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  res
    .status(200)
    .cookie("access_token", accessToken, cookieOpitons)
    .cookie("refresh_token", refreshToken, cookieOpitons)
    .json(
      new ApiRespones(
        200,
        {
          user: loggedInUser,
          refreshToken,
          accessToken,
        },
        "user logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const use = await User.findById(req.user._id);
  console.log(use);

  res
    .status(200)
    .clearCookie("access_token", cookieOpitons)
    .clearCookie("refresh_token", cookieOpitons)
    .json(new ApiRespones(200, {}, "user logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refresh_token || req.body.refresh_token;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  const decodedRefreshToken = Jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECERT
  );

  if (!decodedRefreshToken) {
    throw new ApiError(401, "invalid refresh token");
  }

  const user = await User.findById(decodedRefreshToken?._id);

  if (!user) {
    throw new ApiError(401, "Invalid refresh token to find user");
  }

  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const { refreshToken, accessToken } =
    await generateRefreshAndAccessTokens(user);

  res
    .status(200)
    .cookie("access_token", accessToken, cookieOpitons)
    .cookie("refresh_token", refreshToken, cookieOpitons)
    .json(
      new ApiRespones(
        200,
        { refreshToken, accessToken },
        "access token refreshed"
      )
    );
});

const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(401, "old password or new password are required");
  }

  const user = await User.findById(req.user._id);

  if (!(await user.isPasswordCorrect(oldPassword))) {
    throw new ApiError(401, "old password is incorrect");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res.staus(200).json(new ApiRespones(200, {}, "password updated"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      ApiRespones(200, { data: req.user }, "current user get successfully")
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiRespones(200, { user }, "user details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar local path is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "error while uploading avatar on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiRespones(200, { user }, "avatar file updated successfully"));
});

const updateUserCover = asyncHandler(async (req, res) => {
  const coverLocalPath = req.file?.path;

  if (!coverLocalPath) {
    throw new ApiError(400, "cover local path is missing");
  }

  const cover = await uploadOnCloudinary(coverLocalPath);

  if (!cover) {
    throw new ApiError(400, "error while uploading cover on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: cover.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiRespones(200, { user }, "coverImage updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) {
    throw new ApiError(400, "username is missing from params");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "subscribers?.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        subscriberCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel doest not exist");
  }

  return res
    .status(200)
    .json(new ApiRespones(200, channel[0], "channel data fetch successfully"));
});

const getUserHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.types.objectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "wathchHistory",
        foreignField: "_id",
        as: "wathchHistory",
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
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  if (!user) {
    throw new ApiError(401, "error while fetch user history");
  }

  return res
    .status(200)
    .json(
      new ApiRespones(200, user[0]?.wathchHistory, "watch histroy fetched")
    );
});

export {
  resgisterUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updatePassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCover,
  getUserChannelProfile,
  getUserHistory,
};
