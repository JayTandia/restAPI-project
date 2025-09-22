import express from "express";
import { createBook } from "./bookController.js";
import multer from "multer";
import path from "node:path";
import authenticate from "../middlewares/authenticate.js";

const bookRouter = express.Router();

// file store locally
const upload = multer({
  dest: path.resolve(__dirname, "../../public/data/uploads"),
  limits: { fileSize: 3e7 },
});

bookRouter.post(
  "/",
  authenticate,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  createBook
);

export default bookRouter;
