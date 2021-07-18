const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");

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
  const body = JSON.parse(JSON.stringify(req.body));
  console.log("update sent");
  console.log(body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { firstName, lastName, id, old_password, new_password } = body;
  console.log(id);

  let user;

  try {
    user = await User.findById(id);
    console.log(user);
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
  req.file.path && (user.imageUrl = req.file.path);

  try {
    console.log("try");
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
    imageUrl: user.imageUrl,
  });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { firstName, lastName, email, password } = req.body;

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
    // image: req.file.path,
    password: hashedPassword,
    books: [],
    favoriteBooks: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      userId: createdUser.id,
      email: createdUser.email,
      token: token,
      firstName,
      lastName,
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }
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
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    res.json({
      userId: existingUser.id,
      email: existingUser.email,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      token: token,
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

exports.updateUser = updateUser;
exports.getUser = getUser;
exports.signup = signup;
exports.login = login;
