import { createBookSchema, updateBookSchema } from "@shared/schemas";
import mongoose from "mongoose";
import bookService from "../services/bookService.js";
import {
  sendBadRequestError,
  sendData,
  sendSuccess,
} from "../utils/response.js";

async function getBooks(req, res) {
  const books = await bookService.getBooks(
    new mongoose.Types.ObjectId(req.params.profileId),
  );

  for (let book of books) {
    book.id = book._id.toString();
    delete book["_id"];
  }

  sendData(res, { books });
}

async function createBook(req, res) {
  const { success, error, data } = createBookSchema.safeParse(req.body);

  if (!success) return sendBadRequestError(res, error);

  const book = await bookService.createBook(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    data,
  );

  book.id = book._id.toString();
  delete book["_id"];

  sendData(res, { book }, "Book created successfully.");
}

async function updateBook(req, res) {
  const { success, error, data } = updateBookSchema.safeParse(req.body);

  if (!success) return sendBadRequestError(res, error);

  const book = await bookService.updateBook(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    new mongoose.Types.ObjectId(req.params.bookId),
    data,
  );

  book.id = book._id.toString();
  delete book["_id"];

  sendData(res, { book }, "Book updated successfully.");
}

async function deleteBook(req, res) {
  await bookService.deleteBook(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    new mongoose.Types.ObjectId(req.params.bookId),
  );

  sendSuccess(res, "Book deleted successfully");
}

export default { createBook, deleteBook, getBooks, updateBook };
