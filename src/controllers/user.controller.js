import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/fileupload.js";
import { apiResponse } from "../utils/apiResponse.js";

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
  const avatarLocalPath = req.file?.avatar[0]?.path;
  const coverImageLocalPath = req.file?.coverImage[0]?.path;

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

export { registerUser };
