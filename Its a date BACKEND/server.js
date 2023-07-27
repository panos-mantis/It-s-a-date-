const express = require("express")
const app = express()
app.use(express.json())
const cors = require("cors")
require('dotenv').config();
const userRouter = require("./Routers/userRouter")


app.use("/user", userRouter)

app.listen(4000,()=>{
    console.log("Server is running on port 4000")
})