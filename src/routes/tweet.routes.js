import { Router } from "express";
import {
  createTweet,
  getTweet,
  updateTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/").post(verifyJWT, createTweet);
router.route("/:userId").get(verifyJWT, getTweet);
router.route("/:tweetId").patch(verifyJWT, updateTweet);

export default router;
