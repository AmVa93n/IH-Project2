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
  locationType: {
    type: String,
    required: true,
  },
  location: {
    type: String,
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
    default: 2
  },
  price: {
    type: Number,
    required: true,
  },
});

const Offer = model('Offer', offerSchema);
module.exports = Offer;
