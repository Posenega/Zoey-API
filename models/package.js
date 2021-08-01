const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const packageSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    isForSchool: { type: String, required: true },
    grade: { type: String, required: false },
    categories: { type: Array, required: true },
    condition: { type: String, required: true },
    numberOfBooks: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    price: { type: String, required: true },
    type: { type: String, required: true },
    creator: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { autoCreate: true }
);

module.exports = mongoose.model("Package", packageSchema);
