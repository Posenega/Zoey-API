const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    text: { type: String, required: true },
    sender: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  },
  { timestamps: true }
);

module.exports.MessageSchema = MessageSchema;
module.exports.Message = mongoose.model("Message", MessageSchema);
