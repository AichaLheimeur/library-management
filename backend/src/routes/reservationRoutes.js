const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

const {
  createReservation,
  getMyReservations,
  cancelReservation,
  getAllReservations,
  adminClearHistory,
} = require("../controllers/reservationController");

// USER - Create a reservation
// POST /api/reservations
router.post("/", protect, createReservation);

// USER - Get own reservations
// GET /api/reservations/me
router.get("/me", protect, getMyReservations);

// USER - Cancel a reservation
// DELETE /api/reservations/:id
router.delete("/:id", protect, cancelReservation);

// ADMIN - Get all reservations
// GET /api/reservations
router.get("/", protect, isAdmin, getAllReservations);

// ADMIN - Clear cancelled reservations
// DELETE /api/reservations/history
router.delete("/history", protect, isAdmin, adminClearHistory);

module.exports = router;
