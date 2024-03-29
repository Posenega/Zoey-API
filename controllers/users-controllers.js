const fs = require("fs");
const path = require("path");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("../configs/transport");
const aws = require("aws-sdk");
const HttpError = require("../models/http-error");
const User = require("../models/user");
const { NotificationToken } = require("../models/NotificationToken");

const s3 = new aws.S3({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const getUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  let user;

  try {
    user = await User.findOne({ _id: req.params.uid });
  } catch (err) {
    const error = new HttpError(
      "Fetching user failed, please try again later.",
      500
    );
    return next(error);
  }

  res.status(200).json({ user: user.toObject({ getters: true }) });
};

const updateUser = async (req, res, next) => {
  const body = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const {
    firstName,
    lastName,
    old_password,
    new_password,
    expoPushToken,
    isStudent,
    grade,
  } = body;

  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Fetching user failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Invalid credentials, please try again.", 401);
    return next(error);
  }

  if (old_password && new_password) {
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(old_password, user.password);
      console.log(isValidPassword);
    } catch (err) {
      const error = new HttpError(
        "Invalid credentials, please try again.",
        500
      );
      return next(error);
    }

    if (!isValidPassword) {
      const error = new HttpError(
        "Invalid credentials, please try again.",
        401
      );
      return next(error);
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(new_password, 12);
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Could not create user, please try again.",
        500
      );
      return next(error);
    }
    user.password = hashedPassword;
  }

  firstName && (user.firstName = firstName);
  lastName && (user.lastName = lastName);
  expoPushToken &&
    (user.expoPushToken = new NotificationToken({ token: expoPushToken }));
  isStudent && (user.isStudent = isStudent);
  grade && (user.grade = grade);
  user.password = user.password;
  if (req.file) {
    user.image &&
      user.image.path &&
      fs.unlink(user.image.path, (err) => {
        console.log(err);
      });
    user.image &&
      user.image.key &&
      s3.deleteObject({ Bucket: "zoey-storage", Key: user.image.key }, (err) =>
        console.log(err)
      );

    user.image = {
      path: req.file.path,
      location: req.file.location,
      key: req.file.key,
    };
  }

  try {
    await user.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not update webinar.",
      500
    );
    return next(error);
  }

  res.status(200).json({
    firstName,
    lastName,
    image: user.image,
    isStudent: user.isStudent,
    grade: user.grade,
  });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const characters = "0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += characters[Math.floor(Math.random() * characters.length)];
  }

  const { firstName, lastName, email, password, city } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User exists already, please login instead.",
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Could not create user, please try again.",
      500
    );
    return next(error);
  }

  const createdUser = new User({
    firstName,
    lastName,
    email,
    // image: req.file.path.replace(/\\/g, "/"),
    password: hashedPassword,
    books: [],
    favoriteBooks: [],
    confirmationCode: code,
    city,
  });

  try {
    await createdUser.save((err) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      nodemailer.sendConfirmationEmail(
        createdUser.firstName,
        createdUser.email,
        createdUser.confirmationCode
      );
    });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  res.status(201).json({
    userId: createdUser.id,
    email: createdUser.email,

    firstName,
    lastName,
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, please check your credentials and try again.",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }

  let token;
  try {
    if (existingUser.status === "Active")
      token = jwt.sign(
        { userId: existingUser.id, email: existingUser.email },
        process.env.JWT_KEY,
        { expiresIn: "1w" }
      );

    res.json({
      userId: existingUser.id,
      email: existingUser.email,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      token: token,
      image: existingUser.image,
      type: existingUser.type,
      isStudent: existingUser.isStudent,
      grade: existingUser.grade,
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }
};

const verifyUser = (req, res, next) => {
  User.findById(req.params.uid)
    .then((user) => {
      if (!user) {
        const error = new HttpError("User Not found.", 404);
        return next(error);
      }
      if (user.confirmationCode === req.body.confirmationCode) {
        user.status = "Active";
        user.save((err) => {
          if (err) {
            const error = new HttpError("An error has occured.", 500);
            return next(error);
          }
          let token;
          try {
            token = jwt.sign(
              {
                userId: user.id,
                email: user.email,
              },
              process.env.JWT_KEY,
              { expiresIn: "1w" }
            );
            res.status(200).json({ user, token });
          } catch {
            const error = new HttpError(
              "Verifying user failed, please try again later.",
              500
            );
            return next(error);
          }
        });
      } else {
        const error = new HttpError("Invalid confirmation code.", 404);
        return next(error);
      }
    })
    .catch((e) => console.log("error", e));
};

exports.verifyUser = verifyUser;
exports.updateUser = updateUser;
exports.getUser = getUser;
exports.signup = signup;
exports.login = login;
