const pool = require("../config/db");

// GET /api/penalties/me
// User: get own penalties
exports.getMyPenalties = async (req, res) => {
  try {
    const userId = req.user.id;

    const [penalties] = await pool.query(
      `SELECT p.id, p.loan_id, p.amount, p.reason, p.created_at,
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

// GET /api/penalties
// Admin: get all penalties
exports.getAllPenalties = async (req, res) => {
  try {
    const [penalties] = await pool.query(
      `SELECT p.id, p.user_id, u.email, p.loan_id, p.amount, p.reason, p.created_at,
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
