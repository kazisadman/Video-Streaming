import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  getChannelSubscribers,
  getSubscribedChannels,
  toogleSubscription,
} from "../controllers/subscription.controller.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/channel/:channelId")
  .post(toogleSubscription)
  .get(getChannelSubscribers);

router.route('/user/:subscriberId').get(getSubscribedChannels)
export default router;
