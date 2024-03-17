import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    getAllLikedVideos,
  toggleCommentLike,
  toggleTwitterLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/toggle/video/:videoId").post(toggleVideoLike);
router.route("/toggle/comment/:commentId").post(toggleCommentLike);
router.route("/toggle/tweet/:tweetId").post(toggleTwitterLike);

router.route("/").get(getAllLikedVideos)

export default router;
