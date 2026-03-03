const express = require("express");
const router = express.Router();

const {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");

const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

// Public
router.get("/", getAllBooks);
router.get("/:id", getBookById);

// Admin
router.post("/", protect, isAdmin, createBook);
router.put("/:id", protect, isAdmin, updateBook);
router.delete("/:id", protect, isAdmin, deleteBook);

module.exports = router;