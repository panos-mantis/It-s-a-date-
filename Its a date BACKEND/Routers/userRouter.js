const express = require("express")
const app = express()
app.use(express.json())
const router = require("express").Router()
const userController = require("../controllers/userController")


router.post("/register", userController.registerUser)
router.post("/login", userController.logInUser)


module.exports = router