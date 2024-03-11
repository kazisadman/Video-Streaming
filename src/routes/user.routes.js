import { Router } from "express";
import {
  changeCurrentPassword,
  getUserChannelProfile,
  getWatchHistory,
  logOutUser,
  loggedInUserData,
  loginUser,
  refreshAccessToken,
  registerUser,
  updateAccountsDetails,
  updateAvatarImage,
  updatecoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secuired route
router.route("/logout").post(verifyJWT, logOutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/chage-password").post(verifyJWT, changeCurrentPassword);
router.route("/user-data").get(verifyJWT, loggedInUserData);
router.route("/update-account").patch(verifyJWT, updateAccountsDetails);
router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateAvatarImage);
router
  .route("/update-cover")
  .patch(verifyJWT, upload.single("coverImage"), updatecoverImage);
router.route("/channel/:userName").get(verifyJWT, getUserChannelProfile);
router.route("/watch-history").get(verifyJWT, getWatchHistory);

export default router;
