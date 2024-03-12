import { Router } from "express";
import { createTweet, getTweet } from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/").post(verifyJWT, createTweet);
router.route("/:userId").get(verifyJWT, getTweet);

export default router;
