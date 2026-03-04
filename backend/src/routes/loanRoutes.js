const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

const {
  borrowBook,
  getMyLoans,
  getAllLoans,
  returnBook,
} = require("../controllers/loanController");

// 🔹 USER - Borrow a book
// POST /api/loans
router.post("/", protect, borrowBook);

// 🔹 USER - See my loans
// GET /api/loans/me
router.get("/me", protect, getMyLoans);

// 🔹 USER - Return a book
// PUT /api/loans/:id/return
router.put("/:id/return", protect, returnBook);

// 🔹 ADMIN - See all loans
// GET /api/loans
router.get("/", protect, isAdmin, getAllLoans);

module.exports = router;