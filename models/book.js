const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const bookSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    author: { type: String, required: true },
    type: { type: String, required: true },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    imageUrl: { type: String, required: true },
    category: { type: String, required: true },
  },
  { autoCreate: true }
);

bookSchema.method("transform", function () {
  var obj = this.toObject();

  obj.id = obj._id;
  delete obj._id;

  return obj;
});

module.exports = mongoose.model("Book", bookSchema);
