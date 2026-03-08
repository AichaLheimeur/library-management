const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

const {
  getMyPenalties,
  getAllPenalties,
} = require("../controllers/penaltyController");

// USER - Get own penalties
// GET /api/penalties/me
router.get("/me", protect, getMyPenalties);

// ADMIN - Get all penalties
// GET /api/penalties
router.get("/", protect, isAdmin, getAllPenalties);

module.exports = router;
