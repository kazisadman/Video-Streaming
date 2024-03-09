import { User } from "../models/user.models.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

// Verifies the access token in the request and authenticates the user
const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // check if there is a request token in the request headers
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new apiError(401, "Unauthorized request");
    }

    // Checks if the access token is valid and authenticates the user
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    //Returns matched user data from db without 'password' and 'refresh_token' field
    const user = await User.findById(decodedToken?._id).select(
      "-password -refresh_token"
    );

    if (!user) {
      throw new apiError(401, "Invalid access token");
    }

    req.user = user;
    
    next();
  } catch (error) {
    throw new apiError(401, "Unauthorized request");
  }
});

export { verifyJWT };
