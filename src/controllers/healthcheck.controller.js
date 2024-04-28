import asyncHandler from "../utils/asyncHandler.js";

const healthCheck = asyncHandler(async (req, res) => {
  return res.status(200).json({ status: "OK", message: "Health check passed" });
});

export { healthCheck };
