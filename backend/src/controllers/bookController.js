const pool = require("../config/db");

/**
 * GET /api/books
 * Public: list all books
 */
exports.getAllBooks = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM books");
    return res.json(rows);
  } catch (error) {
    console.error("getAllBooks error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/books/:id
 * Public: get a book by id
 */
exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query("SELECT * FROM books WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error("getBookById error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};