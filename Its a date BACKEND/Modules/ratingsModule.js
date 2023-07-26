import mongoose from "mongoose";
const { Schema } = mongoose;

const ratingSchema = new Schema({
  dateId: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  }
});

const rating = mongoose.model("Rating", ratingSchema);

export default Date;
