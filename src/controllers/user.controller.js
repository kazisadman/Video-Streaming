import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/fileupload.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refresh_token = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(
      500,
      "Something went wrong while generating access and refresh token!"
    );
  }
};

// Registers a user with Cloudinary. This is the entry point for user registration
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, userName, password } = req.body;

  // Checks that the request body is valid. Throws apiError if it's not.
  if (
    [fullName, email, userName, password].some((input) => {
      input?.trim() === "";
    })
  ) {
    throw new apiError(400, "Input field is empty!");
  }

  // Checks if there is a user with the same username or email already exits. Throws an apiError if such a user exists.
  const matchedUser = await User.findOne({ $or: [{ userName }, { email }] });

  if (matchedUser) {
    throw new apiError(409, "Username or email already exits.");
  }

  // Uploads the avatar and cover image on Cloudinary. This is a no - op if there is no image
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;

  if (req.files?.coverImage && req.files.coverImage.lenght > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is missing!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new apiError(400, "Avatar is not uploaded");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  const userCreated = await User.findById(user._id).select(
    "-password -refresh_token"
  );

  if (!userCreated) {
    throw apiError(500, "Something went wrong while registering user");
  }

  res
    .status(201)
    .json(new apiResponse(200, userCreated, "User registered successfully!"));
});

// Logs in user with the given username or email and password. This is the entry point for API calls
const loginUser = asyncHandler(async (req, res) => {
  // Generates access and refresh tokens for the user with the given ID.

  // Given a username or email and password find the user in the database and return it. If there is no match return 404
  const { email, password, userName } = req.body;
  console.log(email, userName, password);
  if (!(userName || email)) {
    throw new apiError(400, "Username or Email is missing");
  } else if (!password) {
    throw new apiError(400, "Password is missing");
  }

  const matchedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!matchedUser) {
    throw new apiError(404, "User does not exist.");
  }

  // Checks the user's password and generates access and refresh tokens. This is called after the user has been matched
  const isPasswordValid = await matchedUser.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiError(401, "Password is incorrect.");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    matchedUser._id
  );

  //Returns matched user data from db without 'password' and 'refresh_token' field
  const loggedInUser = await User.findById(matchedUser._id).select(
    "-password -refresh_token"
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };

  // Send response to user. This is called when user logs in successfully
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

// Logs out user.
const logOutUser = asyncHandler(async (req, res) => {
  // Updates the refresh token in db.
  const userId = req.user._id;
  await User.findByIdAndUpdate(
    userId,
    {
      $unset: {
        refresh_token: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  // Logs out the user and clears the refresh token and access token cookies. Returns 200 OK
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged out successfully"));
});

// Refresh user's access token.
const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      throw new apiError(401, "Unauthorized request");
    }

    // Verifies and extracts the refresh token from the incoming token.
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const matchedUser = await User.findById(decodedToken._id);

    if (matchedUser?.refresh_token !== incomingRefreshToken) {
      throw new apiError(401, "Invalid refresh token");
    }

    // Generates new access and refresh tokens for the user and saves refresh token in the database.
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      matchedUser._id
    );

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new apiResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid refresh token");
  }
});

// Changes the current password.
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = req.user;

  const matchedUser = await User.findById(user._id);

  const isPasswordCorrect = await matchedUser.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new apiError(400, "Invalid Password");
  }

  matchedUser.password = newPassword;
  matchedUser.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new apiResponse(200, {}, "Password changed successfully"));
});

// Fetches logged in user data from database
const loggedInUserData = asyncHandler(async (req, res) => {
  const user = req.user;

  res
    .status(200)
    .json(new apiResponse(200, user, "Loggedin user data fetched"));
});

// Updates the user's account details. This is a POST request to / v1 / user / : id
const updateAccountsDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new apiError(400, "Fullname or email missing");
  }

  // Updates user data in databse. Returns user data without 'passoword' field
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password");

  res
    .status(200)
    .json(new apiResponse(200, user, "Account updated successfully"));
});

// Update the user's avatar. This is called when we get a POST request from the user's web app
const updateAvatarImage = asyncHandler(async (req, res) => {
  // Uploads the avatar to the cloudinary
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file not found");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new apiError(400, "Error while uploading avatar");
  }

  // Updates the user's avatar url in database
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  res
    .status(200)
    .json(new apiResponse(200, {}, "Avatar image is updated successfully"));
});

// Update the user's coverImage. This is called when we get a POST request from the user's web app
const updatecoverImage = asyncHandler(async (req, res) => {
  // Uploads the coverImage to the cloudinary
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new apiError(400, "coverImage file not found");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new apiError(400, "Error while uploading coverImage");
  }

  // Updates the user's coverImage url in database
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  res
    .status(200)
    .json(new apiResponse(200, {}, "cover image is updated successfully"));
});

// Get information about a user's channel profile.
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;

  if (!userName?.trim()) {
    throw new apiError(400, "Username not found");
  }

  const channelInfo = await User.aggregate([
    //Get all the data from "users" db which matches with the "userName" value
    {
      $match: {
        userName: userName,
      },
    },
    //Get all the data which matches 'users._id' and 'subscriptions.channel'
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    //Get all the data which matches 'users._id' and 'subscriptions.subscriber'

    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    //Adds new field in 'users' db.
    {
      $addFields: {
        //'size' count the total number of items in the array
        subscriberCount: {
          $size: "$subscribers",
        },
        channelSubscribedCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            //Here, if logged in user 'id' present in the 'user.subscribers.subscriber' field then its 'true' else 'false'.
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      //'project' return the field which have value '1'
      $project: {
        fullName: 1,
        userName: 1,
        subscriberCount: 1,
        channelSubscribedCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channelInfo?.length) {
    throw new apiError(400, "Channel not found.");
  }

  res
    .status(200)
    .json(
      new apiResponse(200, channelInfo[0], "Channel data fetched successfully")
    );
});

// Get watch history for a user.
const getWatchHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerdetails",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                  },
                },
                {
                  $addFields: {
                    owner: {
                      $first: "$ownerdetails",
                    },
                  },
                },
              ],
            },
          },
          {
            $unwind: "$ownerdetails",
          },
        ],
      },
    },
  ]);

  res
    .status(200)
    .json(
      new apiResponse(
        200,
        user[0].watchHistory,
        "Watched history fetched successfully."
      )
    );
});

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  loggedInUserData,
  updateAccountsDetails,
  updateAvatarImage,
  updatecoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
