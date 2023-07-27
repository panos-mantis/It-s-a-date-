import mongoose from "mongoose";
const { Schema } = mongoose;
let db = require("../connection")

const adminSchema = new Schema({
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
    required: true,
    default:true,
  },
  personalRates: {
    type: Array,
    required: false,
  },
});

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;