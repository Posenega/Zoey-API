const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");

const Package = require("../models/package");
const User = require("../models/user");

const SUPER_PERMISSIONS_TYPES = ["manager", "admin"];

const getPackages = async (req, res, next) => {
  let packages;
  let query = { isSold: false, creator: { $ne: req.userData.userId } };
  if (req.query.isMine) {
    query = { creator: req.userData.userId };
  }
  try {
    packages = await Package.find(query)
      .sort("-createdAt")
      .populate("creator", "firstName lastName image");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a package.",
      500
    );
    return next(error);
  }

  res.json({
    packages,
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
    image: {
      path: req.file.path,
      location: req.file.location,
      key: req.file.key,
    },
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

  user = await User.findById(req.userData.userId);

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  await createdPackage.save();
  user.packages.push(createdPackage);
  await user.save();

  res.status(201).json({ package: createdPackage });
};

const getPackagesByUserId = async (req, res, next) => {
  let userWithPackages;
  try {
    userWithPackages = await User.findById(req.userData.userId).populate(
      "packages"
    );
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Fetching packages failed, please try again later.",
      500
    );
    return next(error);
  }

  res.json({
    packages: userWithPackages.packages
      .filter((myPackage) =>
        req.query.soldPackages ? myPackage.isSold : !myPackage.isSold
      )
      .reverse(),
  });
};

const deletePackage = async (req, res, next) => {
  const packageId = req.params.packageId;

  let package;
  try {
    package = await Package.findById(packageId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete package.",
      500
    );
    return next(error);
  }

  if (!package) {
    const error = new HttpError("Could not find package for this id.", 404);
    return next(error);
  }
  let userType;
  try {
    userType = (await User.findById(req.userData.userId).select("type")).type;
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete package.",
      500
    );
    return next(error);
  }

  if (
    !package.creator._id.equals(req.userData.userId) &&
    !SUPER_PERMISSIONS_TYPES.includes(userType)
  ) {
    const error = new HttpError(
      "You are not allowed to delete this package.",
      401
    );
    return next(error);
  }

  // const imagePath = package.imageUrl;

  try {
    await package.remove();
    package.creator.packages.pull(package);
    package.creator.favoritePackages.pull(package);
    await package.creator.save();
    res.status(200).json({ message: "Deleted package." });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete package.",
      500
    );
    return next(error);
  }

  // fs.unlink(imagePath, (err) => {
  //   console.log(err);
  // });
};
const addFavorite = async (req, res, next) => {
  console.log("here");
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

const updatePackage = async (req, res, next) => {
  const { title, description, isSold } = req.body;
  const packageId = req.params.packageId;

  let myPackage;
  try {
    myPackage = await Package.findById(packageId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update package.",
      500
    );
    return next(error);
  }

  if (myPackage.creator.toString() !== req.userData.userId) {
    const error = new HttpError(
      "You are not allowed to edit this package.",
      401
    );
    return next(error);
  }

  title && (myPackage.title = title);
  description && (myPackage.description = description);

  if (isSold) {
    myPackage.isSold = isSold;
    const usersWhoFavoritedThisPackage = User.find({
      favoritePackages: myPackage._id,
    });
    for (var i = 0; i < usersWhoFavoritedThisPackage.length; i++) {
      usersWhoFavoritedThisPackage[i].favoritePackages.pull(myPackage);
      usersWhoFavoritedThisPackage[i].save();
    }
  }

  try {
    await myPackage.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update package.",
      500
    );
    return next(error);
  }

  res.status(200).json({ package: myPackage.toObject({ getters: true }) });
};

exports.getPackagesByUserId = getPackagesByUserId;
exports.removeFavorite = removeFavorite;
exports.getFavorite = getFavorite;
exports.addFavorite = addFavorite;
exports.getPackages = getPackages;
exports.createPackage = createPackage;
exports.deletePackage = deletePackage;
exports.updatePackage = updatePackage;
