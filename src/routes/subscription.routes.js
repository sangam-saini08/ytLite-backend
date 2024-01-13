import { Router } from "express";
import verifyJwt from "../middlewares/auth.middleware.js";
import {
  toggleSubscription,
  getSubscribedChannels,
  getUserChannelSubscribers,
} from "../controllers/subscription.controller.js";

const router = Router();
router.use(verifyJwt);

router
  .route("/c/:channelId")
  .get(getSubscribedChannels)
  .post(toggleSubscription);

router.route("/u/:channelId").get(getUserChannelSubscribers);

export default router;
