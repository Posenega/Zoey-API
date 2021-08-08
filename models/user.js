const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  books: [{ type: mongoose.Types.ObjectId, required: true, ref: "Book" }],
  packages: [{ type: mongoose.Types.ObjectId, required: true, ref: "Package" }],
  favoriteBooks: [
    { type: mongoose.Types.ObjectId, required: true, ref: "Book" },
  ],
  imageUrl: { type: String, required: false },
  city: { type: String, required: true },
  status: {
    type: String,
    enum: ["Pending", "Active"],
    default: "Pending",
  },
  confirmationCode: {
    type: String,
    unique: true,
  },
  expoPushToken: {
    type: String,
  },
});

module.exports = mongoose.model("User", userSchema);
