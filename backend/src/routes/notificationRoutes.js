const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");

// ADMIN - Get all unread notifications (auto-generates for overdue loans)
// GET /api/notifications
router.get("/", protect, isAdmin, getNotifications);

// ADMIN - Mark one as read
// PUT /api/notifications/read-all  ← must be before /:id
router.put("/read-all", protect, isAdmin, markAllAsRead);

// ADMIN - Mark one as read
// PUT /api/notifications/:id/read
router.put("/:id/read", protect, isAdmin, markAsRead);

module.exports = router;
