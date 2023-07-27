const mongoose = require("mongoose")
let db = mongoose.connect(process.env.MONGODB_URI)
module.exports= {db}