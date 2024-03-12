import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// Limit the number of results to 20KB by default. This is to avoid hitting the server every time
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//import routes
import userRouter from "./routes/user.routes.js";
import tweetRouter from "./routes/tweet.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/tweet", tweetRouter);

export { app };
