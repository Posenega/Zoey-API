const mongoose = require("mongoose");
const aws = require("aws-sdk");
const fs = require("fs");
const Schema = mongoose.Schema;

const packageSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    isForSchool: { type: Boolean, required: true },
    grade: { type: String, required: false },
    categories: { type: Array, required: true },
    condition: { type: String, required: true },
    numberOfBooks: { type: Number, required: true },
    image: { type: Object, required: true },
    price: { type: String, required: false },
    type: { type: String, required: true },
    creator: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "User",
    },
    isSold: { type: Boolean, required: true, default: false },
  },
  { autoCreate: true, timestamps: true }
);

const s3 = new aws.S3({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

packageSchema.pre("remove", function (next) {
  if (this.image.path)
    fs.unlink(this.image.path, (e) => {
      console.log(e);
    });

  if (this.image.key)
    s3.deleteObject({ Bucket: "zoey-storage", Key: this.image.key }, (err) =>
      console.log(err)
    );

  next();
});

module.exports = mongoose.model("Package", packageSchema);
