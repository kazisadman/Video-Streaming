import express from "express";
import connectDb from "./db/index.js";
const app = express();

connectDb();
