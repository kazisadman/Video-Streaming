import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/fileupload.js";
import { apiResponse } from "../utils/apiResponse.js";

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

// Logs in a user with the given username or email and password. This is the entry point for API calls
const loginUser = asyncHandler(async (req, res) => {
  // Generates access and refresh tokens for the user with the given ID.
  const generateAccessAndRefreshToken = async (userId) => {
    try {
      const user = await User.findById(userId);
      const accessToken = userId.generateAccessToken();
      const refreshToken = userId.generateRefreshToken();

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

  // Given a username or email and password find the user in the database and return it. If there is no match return 404
  const { email, password, userName } = req.body;

  if (!userName || !email) {
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

  // Selects the user that matched the user and give the user data without password and refresh_token field.
  const loggedInUser = await User.findById(matchedUser._id).select(
    "-password -refresh_token"
  );

  const options = {
    httpOnly: true,
    secure: ture,
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

// Logs out a user.
const logOutUser = asyncHandler(async (req, res) => {
  // Updates the refresh token in db.
  const userId = req.user._id;
  await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        refresh_token: undefined,
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
    .json(new apiResponse(200, "User logged out"));
});

export { registerUser, loginUser, logOutUser };
