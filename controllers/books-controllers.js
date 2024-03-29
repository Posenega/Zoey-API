const fs = require("fs");

const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Book = require("../models/book");
const User = require("../models/user");

const SUPER_PERMISSIONS_TYPES = ["manager", "admin"];

const getBooks = async (req, res, next) => {
  let books;
  try {
    books = await Book.find({
      isSold: false,
      creator: { $ne: req.userData.userId },
    })
      .sort("-createdAt")
      .populate("creator", "firstName lastName image");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a book.",
      500
    );
    return next(error);
  }

  res.json({
    books,
  });
};

const getBookById = async (req, res, next) => {
  const bookId = req.params.bookId;

  let book;
  try {
    book = await Book.findById(bookId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a book.",
      500
    );
    return next(error);
  }

  if (!book) {
    const error = new HttpError(
      "Could not find book for the provided id.",
      404
    );
    return next(error);
  }

  res.json({ book: book.toObject({ getters: true }) });
};

const getBooksByUserId = async (req, res, next) => {
  let userWithBooks;
  try {
    userWithBooks = await User.findById(req.userData.userId)
      .select("books")
      .populate("books");
    res.json({
      books: userWithBooks.books
        .filter((book) => (req.query.soldBooks ? book.isSold : !book.isSold))
        .reverse(),
    });
  } catch (err) {
    const error = new HttpError(
      "Fetching books failed, please try again later.",
      500
    );
    return next(error);
  }
};

const createBook = async (req, res, next) => {
  try {
    const body = JSON.parse(JSON.stringify(req.body));

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return next(
        new HttpError("Invalid inputs passed, please check your data.", 422)
      );
    }

    const {
      title,
      description,
      author,
      type,
      categories,
      price,
      condition,
      isForSchool,
      grade,
      numberOfBooks,
    } = body;

    const createdBook = new Book({
      title,
      description,
      numberOfBooks,
      image: {
        path: req.file.path,
        location: req.file.location,
        key: req.file.key,
      },
      creator: req.userData.userId,
      author: author ? author : null,
      type,
      categories: JSON.parse(categories),
      isForSchool,
      price: type === "sell" ? price : null,
      condition,
      grade: grade ? grade : null,
    });

    let user;

    user = await User.findById(req.userData.userId);

    if (!user) {
      const error = new HttpError("Could not find user for provided id.", 404);
      return next(error);
    }

    await createdBook.save();
    user.books.push(createdBook);
    await user.save();

    res.status(201).json({ book: createdBook });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Creating book failed, please try again.", 500);
    return next(error);
  }
};

const updateBook = async (req, res, next) => {
  const { title, description, isSold } = req.body;
  const bookId = req.params.bookId;

  let book;
  try {
    book = await Book.findById(bookId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update book.",
      500
    );
    return next(error);
  }

  if (book.creator.toString() !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this book.", 401);
    return next(error);
  }

  title && (book.title = title);
  description && (book.description = description);
  if (isSold) {
    book.isSold = isSold;
  }

  try {
    await book.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update book.",
      500
    );
    return next(error);
  }

  res.status(200).json({ book: book.toObject({ getters: true }) });
};

const deleteBook = async (req, res, next) => {
  const bookId = req.params.bookId;

  let book;
  try {
    book = await Book.findById(bookId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete book.",
      500
    );
    return next(error);
  }

  if (!book) {
    const error = new HttpError("Could not find book for this id.", 404);
    return next(error);
  }
  let userType;
  try {
    userType = (await User.findById(req.userData.userId).select("type")).type;
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete book.",
      500
    );
    return next(error);
  }

  if (
    !book.creator._id.equals(req.userData.userId) &&
    !SUPER_PERMISSIONS_TYPES.includes(userType)
  ) {
    const error = new HttpError(
      "You are not allowed to delete this book.",
      401
    );
    return next(error);
  }

  try {
    // const sess = await mongoose.startSession();
    // sess.startTransaction(); { session: sess }
    await book.remove();
    book.creator.books.pull(book);
    book.creator.favoriteBooks.pull(book);
    await book.creator.save();
    // await sess.commitTransaction(); { session: sess }
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete book.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Deleted book." });
};

const addFavorite = async (req, res, next) => {
  const bookId = req.params.bookId;

  let selectedBook;
  try {
    selectedBook = await Book.findById(bookId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find book.",
      500
    );
    return next(error);
  }

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("Creating book failed, please try again.", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  try {
    user.favoriteBooks.push(selectedBook);
    await user.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError("Adding book failed, please try again.", 500);
    return next(error);
  }

  res.status(201).json({ book: selectedBook });
};

const removeFavorite = async (req, res, next) => {
  const bookId = req.params.bookId;

  let selectedBook;
  try {
    selectedBook = await Book.findById(bookId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find book.",
      500
    );
    return next(error);
  }

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "Removing favorite failed, please try again.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  try {
    const index = user.favoriteBooks.indexOf(selectedBook);
    user.favoriteBooks.splice(index, 1);
    await user.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Removing favorite failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ message: "Removed favorite." });
};

const getFavorite = async (req, res, next) => {
  let userWithBooks;
  try {
    userWithBooks = await User.findById(req.userData.userId)
      .select("favoriteBooks")
      .populate("favoriteBooks");

    res.json({
      books: userWithBooks.favoriteBooks.filter(({ isSold }) => !isSold),
    });
  } catch (err) {
    const error = new HttpError(
      "Fetching books failed, please try again later.",
      500
    );
    return next(error);
  }
};

exports.removeFavorite = removeFavorite;
exports.getFavorite = getFavorite;
exports.addFavorite = addFavorite;
exports.getBooks = getBooks;
exports.getBookById = getBookById;
exports.getBooksByUserId = getBooksByUserId;
exports.createBook = createBook;
exports.updateBook = updateBook;
exports.deleteBook = deleteBook;
