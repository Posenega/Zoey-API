const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");

const Package = require("../models/package");
const User = require("../models/user");

const getPackages = async (req, res, next) => {
  let packages;
  let query = {};
  if (req.query.isMine) {
    query = { creator: req.userData.userId };
  }
  try {
    packages = await Package.find(query).sort("-createdAt");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a package.",
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
    numberOfPackages,
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
    numberOfPackages,
    type,
  });

  createdPackage.save();

  res.status(201).json({ package: createdPackage });
};

const deletePackage = async (req, res, next) => {
  const packageId = req.params.packageId;

  try {
    const package = await Package.findById(packageId);
    await package.remove();
    res.status(200).json({ message: "Successfully deleted package" });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Error occured while deleting", 500);
    return next(error);
  }
};
const addFavorite = async (req, res, next) => {
  const packageId = req.params.packageId;

  let selectedPackage;
  try {
    selectedPackage = await Package.findById(packageId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find package.",
      500
    );
    return next(error);
  }

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
    user.favoritePackages.push(selectedPackage);
    await user.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Adding package failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ package: selectedPackage });
};

const removeFavorite = async (req, res, next) => {
  const packageId = req.params.packageId;

  let selectedPackage;
  try {
    selectedPackage = await Package.findById(packageId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find package.",
      500
    );
    return next(error);
  }

  let user;
  try {
    user = await User.findById(req.body.userId);
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
    const index = user.favoritePackages.indexOf(selectedPackage);
    user.favoritePackages.splice(index);
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
  let userWithPackages;
  try {
    userWithPackages = await User.findById(req.userData.userId)
      .select("favoritePackages")
      .populate("favoritePackages");
    res.json({
      packages: userWithPackages.favoritePackages,
    });
  } catch (err) {
    const error = new HttpError(
      "Fetching packages failed, please try again later.",
      500
    );
    return next(error);
  }
};

exports.removeFavorite = removeFavorite;
exports.getFavorite = getFavorite;
exports.addFavorite = addFavorite;
exports.getPackages = getPackages;
exports.createPackage = createPackage;
exports.deletePackage = deletePackage;
