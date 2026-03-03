const express = require("express");
const router = express.Router();

const { getAllBooks, getBookById, createBook } = require("../controllers/bookController");


const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

// Public
router.get("/", getAllBooks);
router.get("/:id", getBookById);

// Admin
router.post("/", protect, isAdmin, createBook);

module.exports = router;