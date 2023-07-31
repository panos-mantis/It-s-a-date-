const express = require("express")
const app = express()
app.use(express.json())
const router = require("express").Router()
const dateController = require("../controllers/dateController")

router.post("/create", dateController.createDate )
router.get("/", dateController.getAllDates)
router.get("/:id", dateController.getDateById)
router.get("/dates/:tags", dateController.getDatesByTag)



router.delete("/delete/:id", dateController.deleteDateById)
router.put("/accept/:id", dateController.acceptDateById)

module.exports = router