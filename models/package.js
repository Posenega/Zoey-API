const mongoose = require("mongoose");
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
    imageUrl: { type: String, required: true },
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

packageSchema.pre("remove", function (next) {
  fs.unlink(this.imageUrl, (e) => {
    console.log(e);
  });
  next();
});

module.exports = mongoose.model("Package", packageSchema);
