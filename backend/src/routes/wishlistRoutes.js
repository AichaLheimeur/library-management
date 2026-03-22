const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const {
  getMyWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");

// GET /api/wishlist — ma wishlist
router.get("/", protect, getMyWishlist);

// POST /api/wishlist — ajouter un livre
router.post("/", protect, addToWishlist);

// DELETE /api/wishlist/:book_id — supprimer un livre
router.delete("/:book_id", protect, removeFromWishlist);

module.exports = router;
