const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");

const User = require("../models/user");
const Package = require("../models/package");

const getPackages = async (req, res, next) => {
  let packages;
  try {
    packages = await Package.find();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a book.",
      500
    );
    return next(error);
  }

  res.json({
    packages: packages.map((package) => package.toObject({ getters: true })),
  });
};

const createPackage = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const {
    title,
    description,
    isForSchool,
    grade,
    categories,
    condition,
    numberOfBooks,
    price,
    type,
  } = req.body;

  const createdPackage = new Package({
    title,
    description,
    imageUrl: req.file.path,
    creator: req.userData.userId,
    categories: JSON.parse(categories),
    isForSchool,
    price,
    condition,
    grade: grade ? grade : null,
    numberOfBooks,
    type,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "Creating package failed, please try again.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  try {
    await createdPackage.save();
    user.packages.push(createdPackage);
    await user.save();
  } catch (err) {
    const error = new HttpError(
      "Creating package failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ package: createdPackage });
};

exports.getPackages = getPackages;
exports.createPackage = createPackage;
