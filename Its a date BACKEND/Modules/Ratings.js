const mongoose = require('mongoose');
const { Schema } = mongoose;
let db = require("../connection")

const ratingSchema = new Schema({
  dateId: {
    type: String,
    required: true,
  },
  ratingsAll: {
    type: Number,
    required: true,
  },
  averageRating: {
    type: Number,
    required: true,
  }
});

const AllRatings = mongoose.model("Rating", ratingSchema);

export default AllRatings;
