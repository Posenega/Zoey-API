const mongoose = require("mongoose");

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
    imageUrl: { type: String, required: true },
    categories: { type: Array, required: true },
    price: { type: Number, required: false },
    condition: { type: String, required: true },
    isForSchool: { type: Boolean, required: true },
    grade: { type: String, required: false },
  },
  { autoCreate: true, timestamps: true }
);

module.exports = mongoose.model("Book", bookSchema);
