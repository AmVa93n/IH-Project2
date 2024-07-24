const { Schema, model } = require("mongoose");

const classSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: {type: String, required: true},
  timeslot: {type: String, required: true},
  language: {type: String, required: true},
  level: {type: String, required: true},
  classType: {type: String, required: true},
  maxGroupSize: {type: Number},
  locationType: {type: String, required: true},
  location: {type: String},
  duration: {type: Number, required: true},
});

const Class = model('Class', classSchema);
module.exports = Class;