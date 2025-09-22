import type { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary.js";
import path from "node:path";
import fs from "node:fs"
import createHttpError from "http-errors";
import bookModel from "./bookModel.js";
import type { AuthRequest } from "../middlewares/authenticate.js";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const {title, genre} = req.body

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!files?.coverImage?.[0] || !files?.file?.[0]) {
    return res
      .status(400)
      .json({ error: "Cover image or filename is required" });
  }

  const coverImageMimeType = files.coverImage[0]?.mimetype
    .split("/")
    .at(-1) as string;
  const fileName = files.coverImage[0]?.filename as string;

  const filePath = path.resolve(
    __dirname,
    "../../public/data/uploads",
    fileName as string
  );

  try {
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      public_id: fileName,
      folder: "book-covers",
      format: coverImageMimeType,
    });

    const bookFileName = files.file[0]?.filename;
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      bookFileName as string
    );

    const bookFileUploadResult = await cloudinary.uploader.upload(
      bookFilePath,
      {
        resource_type: "raw",
        public_id: bookFileName,
        folder: "book-pdfs",
        format: "pdf",
      }
    );

   const _req = req as AuthRequest

    const newBook = await bookModel.create({
      title,
      genre,
      author: _req.userId,
      coverImage: uploadResult.secure_url,
      file: bookFileUploadResult.secure_url
    })

    // delete temp files
    await fs.promises.unlink(filePath)
    await fs.promises.unlink(bookFilePath)

    res.status(201).json({id: newBook._id})

  } catch (error) {
    console.log(error);
    return next(createHttpError(500, "Error while uploading the files"))
  }
};

export { createBook };
