const express = require("express");
const { getSpendingAdvice } = require("../controllers/AiController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/advisor", protect, getSpendingAdvice);

module.exports = router;