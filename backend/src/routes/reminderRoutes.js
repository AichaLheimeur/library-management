const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

const { getDueSoon, sendReminders } = require("../controllers/reminderController");

// ADMIN - List loans due soon
// GET /api/reminders/due-soon
router.get("/due-soon", protect, isAdmin, getDueSoon);

// ADMIN - Send (or simulate) reminder emails
// POST /api/reminders/send
router.post("/send", protect, isAdmin, sendReminders);

module.exports = router;
