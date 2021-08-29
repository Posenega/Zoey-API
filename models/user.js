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
  favoritePackages: [
    { type: mongoose.Types.ObjectId, required: true, ref: "Package" },
  ],
  imageUrl: { type: String, required: false },
  city: { type: String, required: true },
  status: {
    type: String,
    enum: ["Pending", "Active"],
    default: "Pending",
  },
  type: {
    type: String,
    enum: ["user", "manager", "admin"],
    default: "user",
  },
  confirmationCode: {
    type: String,
    unique: true,
  },
  expoPushToken: {
    type: String,
  },
  isStudent: {
    type: Boolean,
    required: true,
    default: false,
  },
  grade: String,
});

module.exports = mongoose.model("User", userSchema);
