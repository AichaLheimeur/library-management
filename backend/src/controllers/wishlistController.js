const pool = require("../config/db");

// GET /api/wishlist — récupérer la wishlist de l'utilisateur connecté
exports.getMyWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT w.id, w.created_at, b.id AS book_id, b.title, b.author, b.category, b.available_quantity
       FROM wishlist w
       JOIN books b ON b.id = w.book_id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [userId]
    );

    return res.json(rows);
  } catch (error) {
    console.error("getMyWishlist error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/wishlist — ajouter un livre à la wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { book_id } = req.body;

    if (!book_id) {
      return res.status(400).json({ message: "book_id is required" });
    }

    // Vérifier que le livre existe
    const [books] = await pool.query("SELECT id FROM books WHERE id = ?", [book_id]);
    if (books.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Vérifier doublon
    const [existing] = await pool.query(
      "SELECT id FROM wishlist WHERE user_id = ? AND book_id = ?",
      [userId, book_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Book already in wishlist" });
    }

    await pool.query(
      "INSERT INTO wishlist (user_id, book_id) VALUES (?, ?)",
      [userId, book_id]
    );

    return res.status(201).json({ message: "Book added to wishlist" });
  } catch (error) {
    console.error("addToWishlist error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/wishlist/:book_id — supprimer un livre de la wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookId = req.params.book_id;

    const [existing] = await pool.query(
      "SELECT id FROM wishlist WHERE user_id = ? AND book_id = ?",
      [userId, bookId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Book not in wishlist" });
    }

    await pool.query(
      "DELETE FROM wishlist WHERE user_id = ? AND book_id = ?",
      [userId, bookId]
    );

    return res.json({ message: "Book removed from wishlist" });
  } catch (error) {
    console.error("removeFromWishlist error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
