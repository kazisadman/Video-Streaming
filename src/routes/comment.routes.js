import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  addComment,
  deleteComment,
  getAllComment,
  updateComment,
} from "../controllers/comment.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/:videoId").post(addComment).get(getAllComment);
router.route("/:commentId").patch(updateComment).delete(deleteComment);

export default router;
