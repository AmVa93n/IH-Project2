const { Schema, model } = require("mongoose");

const offerSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  classType: {
    type: String,
    required: true,
  },
  maxGroupSize: {
    type: Number,
    required: true,
    default: 1
  },
  price: {
    type: Number,
    required: true,
  },
});

const Offer = model('Offer', offerSchema);
module.exports = Offer;
