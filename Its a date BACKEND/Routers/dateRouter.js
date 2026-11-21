const express = require("express")
const app = express()
app.use(express.json())
const router = require("express").Router()
const dateController = require("../controllers/dateController")
const requireAdmin = require("../middleware/requireAdmin")

router.post("/create", dateController.createDate )
router.get("/", dateController.getAllDates)
router.get("/review", requireAdmin, dateController.getDatesToReview)
router.get("/:id", dateController.getDateById)
router.get("/dates/:tags", dateController.getDatesByTag)



router.delete("/delete/:id", requireAdmin, dateController.deleteDateById)
router.put("/accept/:id", requireAdmin, dateController.acceptDateById)

module.exports = router