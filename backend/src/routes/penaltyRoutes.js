const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

const {
  getMyPenalties,
  payPenalty,
  clearPenaltyHistory,
  adminMarkPaid,
  getAllPenalties,
} = require("../controllers/penaltyController");

// USER - Get own penalties
// GET /api/penalties/me
router.get("/me", protect, getMyPenalties);

// USER - Pay a penalty
// PUT /api/penalties/:id/pay
router.put("/:id/pay", protect, payPenalty);

// USER - Clear paid penalty history
// DELETE /api/penalties/history
router.delete("/history", protect, clearPenaltyHistory);

// ADMIN - Mark a penalty as paid
// PUT /api/penalties/:id/mark-paid
router.put("/:id/mark-paid", protect, isAdmin, adminMarkPaid);

// ADMIN - Get all penalties
// GET /api/penalties
router.get("/", protect, isAdmin, getAllPenalties);

module.exports = router;
