const express = require("express")
const app = express()
app.use(express.json())
const router = require("express").Router()
const tagController = require("../controllers/tagController")
const requireAdmin = require("../middleware/requireAdmin")

router.post("/create", requireAdmin, tagController.addTag)
router.get("/", tagController.getTags)
router.delete("/delete/:id", requireAdmin, tagController.deleteTagById)

module.exports = router