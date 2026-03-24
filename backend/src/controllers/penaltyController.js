const pool = require("../config/db");

// GET /api/penalties/me
// User: get own penalties
exports.getMyPenalties = async (req, res) => {
  try {
    const userId = req.user.id;

    const [penalties] = await pool.query(
      `SELECT p.id, p.loan_id, p.amount, p.reason, p.status, p.created_at,
              b.title AS book_title
       FROM penalties p
       JOIN loans l ON p.loan_id = l.id
       JOIN books b ON l.book_id = b.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId]
    );

    return res.json(penalties);
  } catch (error) {
    console.error("getMyPenalties error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/penalties/:id/pay
// User: pay a penalty (own penalties only)
exports.payPenalty = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [rows] = await pool.query(
      "SELECT * FROM penalties WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Penalty not found" });
    }

    if (rows[0].status === "PAID") {
      return res.status(400).json({ message: "Penalty already paid" });
    }

    await pool.query("UPDATE penalties SET status = 'PAID' WHERE id = ?", [id]);

    return res.json({ message: "Penalty paid successfully" });
  } catch (error) {
    console.error("payPenalty error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/penalties/:id/mark-paid
// Admin: mark any penalty as paid
exports.adminMarkPaid = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query("SELECT * FROM penalties WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Penalty not found" });
    }

    if (rows[0].status === "PAID") {
      return res.status(400).json({ message: "Penalty already paid" });
    }

    await pool.query("UPDATE penalties SET status = 'PAID' WHERE id = ?", [id]);

    return res.json({ message: "Penalty marked as paid" });
  } catch (error) {
    console.error("adminMarkPaid error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/penalties/history
// User: delete own PAID penalties
exports.clearPenaltyHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query(
      "DELETE FROM penalties WHERE user_id = ? AND status = 'PAID'",
      [userId]
    );
    return res.json({ message: "Penalty history cleared" });
  } catch (error) {
    console.error("clearPenaltyHistory error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/penalties
// Admin: get all penalties
exports.getAllPenalties = async (req, res) => {
  try {
    const [penalties] = await pool.query(
      `SELECT p.id, p.user_id, u.email, p.loan_id, p.amount, p.reason, p.status, p.created_at,
              b.title AS book_title
       FROM penalties p
       JOIN users u ON p.user_id = u.id
       JOIN loans l ON p.loan_id = l.id
       JOIN books b ON l.book_id = b.id
       ORDER BY p.created_at DESC`
    );

    return res.json(penalties);
  } catch (error) {
    console.error("getAllPenalties error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
