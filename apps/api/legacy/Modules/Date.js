const mongoose = require('mongoose');
const { Schema } = mongoose;
let db = require("../connection")

const dateSchema = new Schema({
  tittle: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  creator: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  overallRates: {
    type: Array,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  review: {
    type: Boolean,
    default: false,
  },
  tags: {
    type: Array,
  },
});

const Date = mongoose.model("Date", dateSchema);

module.exports= Date;
