import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const verifyJwt = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.access_token ||
      req.headers["authorization"]?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECERT);

    // console.log("decodeToken :", decodeToken, "type : ", typeof decodeToken);

    if (!decodeToken) {
      throw new ApiError(401, "Invalid user with this token");
    }

    const user = await User.findById(decodeToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid access token");
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("error : ", error);
    throw new ApiError(400, "something went wrong verifying jwt token");
  }
});

export default verifyJwt;
