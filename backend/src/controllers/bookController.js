const pool = require("../config/db");

/**
 * GET /api/books
 * Public: list all books
 */
exports.getAllBooks = async (req, res) => {
  try {
    const { title, author, category } = req.query;

    const conditions = [];
    const values = [];

    if (title) {
      conditions.push("title LIKE ?");
      values.push(`%${title}%`);
    }
    if (author) {
      conditions.push("author LIKE ?");
      values.push(`%${author}%`);
    }
    if (category) {
      conditions.push("category LIKE ?");
      values.push(`%${category}%`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await pool.query(`SELECT * FROM books ${where}`, values);

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
/**
 * PUT /api/books/:id
 * Admin: update a book
 */
exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      author,
      category,
      description,
      total_quantity,
      available_quantity
    } = req.body;

    const [existing] = await pool.query(
      "SELECT * FROM books WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    const book = existing[0];

    const newTotal =
      total_quantity !== undefined
        ? Number(total_quantity)
        : book.total_quantity;

    const newAvailable =
      available_quantity !== undefined
        ? Number(available_quantity)
        : book.available_quantity;

    if (newTotal < 0 || newAvailable < 0) {
      return res
        .status(400)
        .json({ message: "Quantities must be >= 0" });
    }

    if (newAvailable > newTotal) {
      return res.status(400).json({
        message: "available_quantity cannot exceed total_quantity",
      });
    }

    await pool.query(
      `UPDATE books
       SET title=?, author=?, category=?, description=?, total_quantity=?, available_quantity=?
       WHERE id=?`,
      [
        title ?? book.title,
        author ?? book.author,
        category ?? book.category,
        description ?? book.description,
        newTotal,
        newAvailable,
        id,
      ]
    );

    const [updated] = await pool.query(
      "SELECT * FROM books WHERE id = ?",
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error("updateBook error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/books/:id
exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM books WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({ message: "Book deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};