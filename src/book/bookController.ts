import type { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary.js";
import path from "node:path";
import fs from "node:fs";
import createHttpError from "http-errors";
import bookModel from "./bookModel.js";
import type { AuthRequest } from "../middlewares/authenticate.js";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;

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

    const _req = req as AuthRequest;

    const newBook = await bookModel.create({
      title,
      genre,
      author: _req.userId,
      coverImage: uploadResult.secure_url,
      file: bookFileUploadResult.secure_url,
    });

    // delete temp files
    await fs.promises.unlink(filePath);
    await fs.promises.unlink(bookFilePath);

    res.status(201).json({ id: newBook._id });
  } catch (error) {
    console.log(error);
    return next(createHttpError(500, "Error while uploading the files"));
  }
};

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;
  const bookId = req.params.bookId;

  const book = await bookModel.findOne({ _id: bookId });

  if (!bookId) {
    return next(createHttpError(404, "Book not found"));
  }

  // check access
  const _req = req as AuthRequest;
  if (book?.author.toString() != _req.userId) {
    return next(createHttpError(403, "You cannot update others book"));
  }

  // check if image field exists
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  let completeCoverImage = "";

  if (files.coverImage) {
    const filename = files.coverImage[0]?.filename;
    const coverMimeType = files.coverImage[0]?.mimetype.split("/").at(-1);

    // send files to cloudinary
    const filePath = path.resolve(
      __dirname,
      "../../public/data/uploads/" + filename
    );

    completeCoverImage = filename as string;
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      public_id: completeCoverImage,
      folder: "book-covers",
    });

    completeCoverImage = uploadResult.secure_url;
    await fs.promises.unlink(filePath);
  }

  // check if file field exists
  let completeFileName = "";
  if (files.file) {
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads/" + files.file[0]?.filename
    );

    const bookFileName = files.file[0]?.filename;
    completeFileName = bookFileName as string;

    const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
      resource_type: "raw",
      public_id: completeFileName,
      folder: "book-pdfs",
      format: "pdf",
    });

    completeFileName = uploadResultPdf.secure_url;
    await fs.promises.unlink(bookFilePath);
  }

  const updateBook = await bookModel.findOneAndUpdate(
    { _id: bookId },
    {
      title: title,
      genre: genre,
      coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
      file: completeFileName ? completeFileName : book.file,
    },
    {
      new: true,
    }
  );

  res.json(updateBook);
};

const listBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const book = await bookModel.find();
    res.json(book);
  } catch (error) {
    return next(createHttpError(500, "Error while getting books"));
  }
};

const getSingleBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const bookId = req.params.bookId;
  try {
    const book = await bookModel.findOne({ _id: bookId });
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }

    return res.json(book);
  } catch (error) {
    return next(createHttpError(500, "Error while getting a book"));
  }
};

const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.bookId;

  const book = await bookModel.findOne({ _id: bookId });
  if (!book) {
    return next(createHttpError(404, "Book not found"));
  }

  const _req = req as AuthRequest;
  if (book?.author.toString() != _req.userId) {
    return next(createHttpError(403, "You cannot delete this book"));
  }

  const coverFileSplit = book.coverImage.split("/");
  const coverImagePublicId =
    coverFileSplit.at(-2) + "/" + coverFileSplit.at(-1)?.split(".").at(-2);

  const bookFileSplit = book.file.split("/");
  const bookFilePublicId = bookFileSplit.at(-2) + "/" + bookFileSplit.at(-1);

  await cloudinary.uploader.destroy(coverImagePublicId);
  await cloudinary.uploader.destroy(bookFilePublicId, {
    resource_type: "raw"
  })

  await bookModel.deleteOne({_id: bookId})

  return res.sendStatus(204)
};

export { createBook, updateBook, listBooks, getSingleBook, deleteBook };
