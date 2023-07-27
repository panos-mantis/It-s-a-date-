const mongoose = require('mongoose');
const { Schema } = mongoose;
let db = require("../connection")

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default:false,
  },
  personalRates: {
    type: Array,
    required: false,
  },
});

const User = mongoose.model("User", userSchema);

module.exports= User;
