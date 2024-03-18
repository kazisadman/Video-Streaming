import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  addVideoToPlaylist,
  createPlayList,
  getPlaylistById,
  getUserPlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createPlayList);

router.route("/:playlistId").get(getPlaylistById);

router.route("/user/:userId").get(getUserPlaylist);

router.route("/add/:playlistId/:videoId").patch(addVideoToPlaylist)

export default router;
