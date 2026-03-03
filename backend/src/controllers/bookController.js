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

/**
 * POST /api/books
 * Admin: create a book
 */
exports.createBook = async (req, res) => {
  try {
    const { title, author, category, description, total_quantity } = req.body;

    // Validation minimale
    if (!title || !author) {
      return res.status(400).json({ message: "title and author are required" });
    }

    const total = total_quantity !== undefined ? Number(total_quantity) : 1;
    if (Number.isNaN(total) || total < 0) {
      return res.status(400).json({ message: "total_quantity must be a number >= 0" });
    }

    // règle : available = total
    const available = total;

    const [result] = await pool.query(
      `INSERT INTO books (title, author, category, description, total_quantity, available_quantity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        title,
        author,
        category ?? null,
        description ?? null,
        total,
        available
      ]
    );

    const [rows] = await pool.query("SELECT * FROM books WHERE id = ?", [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error("createBook error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};