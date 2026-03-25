const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

const {
  getMe,
  getAllUsers,
  getUserById,
  validateUser,
  deleteUser,
  adjustPoints,
  getPointsLog,
} = require("../controllers/userController");

// USER - Get own profile
// GET /api/users/me
router.get("/me", protect, getMe);

// ADMIN - Get all users
// GET /api/users
router.get("/", protect, isAdmin, getAllUsers);

// ADMIN - Get a user by id
// GET /api/users/:id
router.get("/:id", protect, isAdmin, getUserById);

// ADMIN - Validate / invalidate a user
// PUT /api/users/:id/validate
router.put("/:id/validate", protect, isAdmin, validateUser);

// ADMIN - Delete a user
// DELETE /api/users/:id
router.delete("/:id", protect, isAdmin, deleteUser);

// ADMIN - Adjust user points
// PUT /api/users/:id/points
router.put("/:id/points", protect, isAdmin, adjustPoints);

// ADMIN - Get points log for a user
// GET /api/users/:id/points-log
router.get("/:id/points-log", protect, isAdmin, getPointsLog);

module.exports = router;
