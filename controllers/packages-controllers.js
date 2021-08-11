const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");

const Package = require("../models/package");

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

exports.getPackages = getPackages;
exports.createPackage = createPackage;
exports.deletePackage = deletePackage;
