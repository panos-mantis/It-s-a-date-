const mongoose = require('mongoose');
const { Schema } = mongoose;
let db = require("../connection")

const tagSchema = new Schema({
    tagName: String
})

const Tag = mongoose.model("Tag", tagSchema);

module.exports = Tag