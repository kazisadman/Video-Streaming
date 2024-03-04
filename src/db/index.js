import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

// Connect to the database and return a promise that resolves when the connection is established
const connectDb = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );

    console.log(
      `MongoDB is connected!! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  }
};

export default connectDb;
