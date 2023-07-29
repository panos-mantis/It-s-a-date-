const express = require("express")
const app = express()
app.use(express.json())
const router = require("express").Router()
const userController = require("../controllers/userController")


router.post("/register", userController.registerUser)
router.post("/login", userController.logInUser)
router.post("/register/admin", userController.registerAdmin)
router.post("/login/admin", userController.logInAdmin)


module.exports = router