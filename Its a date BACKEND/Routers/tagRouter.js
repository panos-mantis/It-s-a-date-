const express = require("express")
const app = express()
app.use(express.json())
const router = require("express").Router()
const tagController = require("../controllers/tagController")

router.post("/create", tagController.addTag)
router.get("/", tagController.getTags)
router.delete("/delete/:id", tagController.deleteTagById)

module.exports = router