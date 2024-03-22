import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { getChannelVideos } from "../controllers/dashboard.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/videos").get(getChannelVideos);

export default router;
