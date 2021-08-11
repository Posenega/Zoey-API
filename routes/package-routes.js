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

router.delete("/:packageId", packageControllers.deletePackage);

module.exports = router;
