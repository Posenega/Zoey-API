const mongoose = require("mongoose");

const NotificationTokenSchema = mongoose.Schema({
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: "1w" },
});

module.exports.NotificationTokenSchema = NotificationTokenSchema;

module.exports.NotificationToken = mongoose.model(
  "NotificationToken",
  NotificationTokenSchema
);
