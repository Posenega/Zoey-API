const express = require("express");
const { check } = require("express-validator");

const booksControllers = require("../controllers/books-controllers");
const checkAuth = require("../middleware/check-auth");
const imageUpload = require("../middleware/image-upload");

const router = express.Router();

router.use(checkAuth);

router.get("/browse", booksControllers.getBooks);

router.get("/:bookId", booksControllers.getBookById);

router.post("/user", booksControllers.getBooksByUserId);

router.post(
  "/",
  imageUpload.single("imageUrl"),
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  booksControllers.createBook
);

router.post("/favorites", booksControllers.getFavorite);

router.post("/favorites/:bookId", booksControllers.addFavorite);

router.delete("/favorites/:bookId", booksControllers.removeFavorite);

router.patch(
  "/:bookId",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  booksControllers.updateBook
);

router.delete("/:bookId", booksControllers.deleteBook);

module.exports = router;
