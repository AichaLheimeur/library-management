const express = require("express");
const router = express.Router();

const { getAllBooks, getBookById } = require("../controllers/bookController");

// Public routes
router.get("/", getAllBooks);
router.get("/:id", getBookById);

module.exports = router;