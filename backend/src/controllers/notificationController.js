const pool = require("../config/db");

// GET /api/notifications
// Admin: auto-generate notifications for overdue loans, then return all unread
exports.getNotifications = async (req, res) => {
  try {
    // 1. Find loans that are overdue (due_date < now, still BORROWED) with no notification yet
    const [overdueLoans] = await pool.query(
      `SELECT l.id, l.user_id, l.due_date, u.email, b.title
       FROM loans l
       JOIN users u ON l.user_id = u.id
       JOIN books b ON l.book_id = b.id
       WHERE l.status = 'BORROWED'
         AND l.due_date < NOW()
         AND l.id NOT IN (SELECT loan_id FROM notifications WHERE loan_id IS NOT NULL)`
    );

    // 2. Create a notification for each new overdue loan
    for (const loan of overdueLoans) {
      const dueDate = new Date(loan.due_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const message = `"${loan.title}" borrowed by ${loan.email} was due on ${dueDate} and has not been returned yet.`;
      await pool.query(
        "INSERT INTO notifications (type, message, loan_id) VALUES ('OVERDUE_LOAN', ?, ?)",
        [message, loan.id]
      );
    }

    // 3. Return all unread notifications
    const [notifications] = await pool.query(
      "SELECT * FROM notifications WHERE is_read = FALSE ORDER BY created_at DESC"
    );

    return res.json(notifications);
  } catch (error) {
    console.error("getNotifications error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/notifications/:id/read
// Admin: mark one notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE id = ?", [id]);
    return res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("markAsRead error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/notifications/read-all
// Admin: mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE");
    return res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("markAllAsRead error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
