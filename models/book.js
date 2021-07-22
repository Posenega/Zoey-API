const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const bookSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    author: { type: String, required: true },
    type: { type: String, required: true },
    creator: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    imageUrl: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: false },
    condition: { type: String, required: true },
  },
  { autoCreate: true }
);

module.exports = mongoose.model('Book', bookSchema);
