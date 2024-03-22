import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  addVideoToPlaylist,
  createPlayList,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylist,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createPlayList);

router
  .route("/:playlistId")
  .get(getPlaylistById)
  .delete(deletePlaylist)
  .patch(updatePlaylist);

router.route("/user/:userId").get(getUserPlaylist);

router.route("/add/:playlistId/:videoId").patch(addVideoToPlaylist);

router.route("/remove/:playlistId/:videoId").patch(removeVideoFromPlaylist);

export default router;
