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

// Use cookieParser to parse cookies.
app.use(cookieParser());

export { app };
