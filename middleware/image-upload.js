const multer = require("multer");
const uuid = require("uuid");
const fs = require("fs");
const aws = require("aws-sdk");
const multerS3 = require("multer-s3");

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

let imageUpload;

if (process.env.MODE === "production") {
  const s3 = new aws.S3({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  imageUpload = multer({
    storage: multerS3({
      s3: s3,
      acl: "public-read",
      bucket: "zoey-storage",
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        const ext = MIME_TYPE_MAP[file.mimetype];
        cb(null, uuid.v1() + "." + ext);
      },
    }),
  });
} else {
  if (!fs.existsSync("./uploads")) {
    fs.mkdirSync("./uploads/images", { recursive: true });
  }
  imageUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, "uploads/images");
      },
      filename: (req, file, cb) => {
        const ext = MIME_TYPE_MAP[file.mimetype];
        cb(null, uuid.v1() + "." + ext);
      },
    }),
    fileFilter: (req, file, cb) => {
      const isValid = !!MIME_TYPE_MAP[file.mimetype];
      let error = isValid ? null : new Error("Invalid mime type!");
      cb(error, isValid);
    },
  });
}

module.exports = imageUpload;
