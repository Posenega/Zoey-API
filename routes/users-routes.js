const express = require("express");
const multer = require("multer");
const { check } = require("express-validator");

const upload = multer();
const usersControllers = require("../controllers/users-controllers");
const imageUpload = require("../middleware/image-upload");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get("/:uid", usersControllers.getUser);

router.post("/:uid/confirm", usersControllers.verifyUser);

router.post(
  "/signup",
  // imageUpload.single("image"),
  [
    check("firstName").not().isEmpty(),
    check("lastName").not().isEmpty(),
    check("email")
      .normalizeEmail() // Test@test.com => test@test.com
      .isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersControllers.signup
);

router.post("/login", usersControllers.login);

router.patch(
  "/update",
  checkAuth,
  imageUpload.single("imageUrl"),
  usersControllers.updateUser
);

module.exports = router;
