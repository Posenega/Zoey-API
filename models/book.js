const mongoose = require("mongoose");
const fs = require("fs");
const aws = require("aws-sdk");

const Schema = mongoose.Schema;

const bookSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    author: { type: String, required: false },
    type: { type: String, required: true },
    creator: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "User",
    },
    image: { type: Object, required: true },
    categories: { type: Array, required: true },
    price: { type: Number, required: false },
    condition: { type: String, required: true },
    isForSchool: { type: Boolean, required: true },
    grade: { type: String, required: false },
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

bookSchema.pre("remove", function (next) {
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

module.exports = mongoose.model("Book", bookSchema);
