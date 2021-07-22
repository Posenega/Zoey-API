const mongoose = require("mongoose");
const MessageSchema = require("./message").MessageSchema;

const ChatSchema = mongoose.Schema({
  user1: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  user2: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  messages: [{ type: MessageSchema, required: true }],
});

module.exports = mongoose.model("Chat", ChatSchema);
