const router = require("express").Router();

const checkAuth = require("../middleware/check-auth");
const imageUpload = require("../middleware/image-upload");
const packageControllers = require("../controllers/packages-controllers");

router.use(checkAuth);

router.get("/", packageControllers.getPackages);

router.post(
  "/",
  imageUpload.single("imageUrl"),
  packageControllers.createPackage
);

router.get("/favorites", packageControllers.getFavorite);

router.post("/favorites/:packageId", packageControllers.addFavorite);

router.delete("/favorites/:packageId", packageControllers.removeFavorite);

router.delete("/:packageId", packageControllers.deletePackage);

module.exports = router;
