import mongoose from "mongoose";
const { Schema } = mongoose;

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
  isAdmin: {
    type: Boolean,
    required: true,
    default: false,
  },
  personalRates: {
    type: Array,
    required: false,
  },
});

const User = mongoose.model("User", userSchema);

export default User;
