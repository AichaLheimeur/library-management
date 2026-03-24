const pool = require("../config/db");

// 🔹 Borrow a book
exports.borrowBook = async (req, res) => {
  try {
    const userId = req.user.id;
    const { book_id } = req.body;

    if (!book_id) {
      return res.status(400).json({ message: "book_id is required" });
    }

    // 1️⃣ Vérifier que le compte est validé + points + blocage
    const [userRows] = await pool.query(
      "SELECT is_validated, points, points_blocked_until FROM users WHERE id = ?",
      [userId]
    );
    if (userRows.length === 0 || !userRows[0].is_validated) {
      return res.status(403).json({ message: "Your account is pending validation by the library. You cannot borrow books yet." });
    }

    const { points_blocked_until } = userRows[0];
    if (points_blocked_until && new Date(points_blocked_until) > new Date()) {
      const unblockDate = new Date(points_blocked_until).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });
      return res.status(403).json({
        message: `Your account is suspended due to 0 points. You can borrow again on ${unblockDate}.`,
      });
    }

    // 2️⃣ Vérifier que le livre existe
    const [books] = await pool.query("SELECT * FROM books WHERE id = ?", [book_id]);
    if (books.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    const book = books[0];

    // 3️⃣ Vérifier stock
    if (book.available_quantity <= 0) {
      return res.status(400).json({ message: "Book not available" });
    }

    // 4️⃣ Vérifier qu'il n'y a pas déjà un emprunt actif pour ce user + ce book
    const [activeLoans] = await pool.query(
      "SELECT id FROM loans WHERE user_id = ? AND book_id = ? AND status IN ('BORROWED', 'LATE')",
      [userId, book_id]
    );
    if (activeLoans.length > 0) {
      return res.status(400).json({ message: "You already have an active loan for this book" });
    }

    // 5️⃣ Calculer dates (14 jours)
    const borrowDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(borrowDate.getDate() + 14);

    // 6️⃣ Créer loan
    await pool.query(
      `INSERT INTO loans (user_id, book_id, borrow_date, due_date, status)
       VALUES (?, ?, ?, ?, 'BORROWED')`,
      [userId, book_id, borrowDate, dueDate]
    );

    // 7️⃣ Diminuer stock
    await pool.query(
      "UPDATE books SET available_quantity = available_quantity - 1 WHERE id = ?",
      [book_id]
    );

    // 8️⃣ Supprimer de la wishlist si présent
    await pool.query(
      "DELETE FROM wishlist WHERE user_id = ? AND book_id = ?",
      [userId, book_id]
    );

    return res.status(201).json({ message: "Book borrowed successfully" });
  } catch (error) {
    console.error("borrowBook error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Get my loans (USER)
exports.getMyLoans = async (req, res) => {
  try {
    const userId = req.user.id;

    const [loans] = await pool.query(
      `SELECT l.*, b.title, b.author, b.image_url
       FROM loans l
       JOIN books b ON l.book_id = b.id
       WHERE l.user_id = ?
       ORDER BY l.borrow_date DESC`,
      [userId]
    );

    return res.json(loans);
  } catch (error) {
    console.error("getMyLoans error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// 🔹 USER - Clear loan history (RETURNED only)
exports.clearMyHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query(
      "DELETE FROM loans WHERE user_id = ? AND status = 'RETURNED'",
      [userId]
    );
    return res.json({ message: "History cleared successfully" });
  } catch (error) {
    console.error("clearMyHistory error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Admin - Clear all returned loans
exports.adminClearHistory = async (req, res) => {
  try {
    await pool.query("DELETE FROM loans WHERE status = 'RETURNED'");
    return res.json({ message: "Loan history cleared" });
  } catch (error) {
    console.error("adminClearHistory error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Admin - Get all loans
exports.getAllLoans = async (req, res) => {
  try {
    const [loans] = await pool.query(
      `SELECT l.id, l.user_id, u.email, l.book_id, b.title, b.author,
              l.borrow_date, l.due_date, l.return_date, l.status
       FROM loans l
       JOIN users u ON l.user_id = u.id
       JOIN books b ON l.book_id = b.id
       ORDER BY l.borrow_date DESC`
    );
    return res.json(loans);
  } catch (error) {
    console.error("getAllLoans error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Return a book (USER)
exports.returnBook = async (req, res) => {
  try {
    const loanId = req.params.id;

    // 1️⃣ Vérifier que l'emprunt existe
    const [rows] = await pool.query("SELECT * FROM loans WHERE id = ?", [loanId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Loan not found" });
    }

    const loan = rows[0];

    // 2️⃣ Autoriser uniquement si BORROWED ou LATE
    if (loan.status !== "BORROWED" && loan.status !== "LATE") {
      return res.status(400).json({ message: "Book already returned" });
    }

    // 3️⃣ Calculer si retard
    const returnDate = new Date();
    const dueDate = new Date(loan.due_date);
    const msPerDay = 1000 * 60 * 60 * 24;
    const lateDays = Math.floor((returnDate - dueDate) / msPerDay);
    const isLate = lateDays > 0;

    // 4️⃣ Mettre à jour le loan
    await pool.query(
      "UPDATE loans SET status='RETURNED', return_date=NOW() WHERE id=?",
      [loanId]
    );

    // 5️⃣ Remettre stock +1
    await pool.query(
      "UPDATE books SET available_quantity = available_quantity + 1 WHERE id=?",
      [loan.book_id]
    );

    // 6️⃣ Mettre à jour les points du user
    const [userRows] = await pool.query(
      "SELECT points FROM users WHERE id = ?",
      [loan.user_id]
    );
    const currentPoints = userRows[0].points;

    let newPoints;
    let pointsChange;
    let blockedUntil = null;

    if (isLate) {
      pointsChange = -(lateDays * 5);
      newPoints = Math.max(0, currentPoints + pointsChange);
      if (newPoints === 0) {
        blockedUntil = new Date();
        blockedUntil.setDate(blockedUntil.getDate() + 15);
      }
    } else {
      pointsChange = 10;
      newPoints = currentPoints + pointsChange;
    }

    await pool.query(
      "UPDATE users SET points = ?, points_blocked_until = ? WHERE id = ?",
      [newPoints, blockedUntil, loan.user_id]
    );

    // 7️⃣ Réponse
    if (isLate) {
      return res.json({
        message: `Book returned late. You lost ${Math.abs(pointsChange)} points (${lateDays} day${lateDays > 1 ? "s" : ""} overdue).`,
        points: newPoints,
        pointsChange,
        blocked: blockedUntil !== null,
        blockedUntil,
      });
    } else {
      return res.json({
        message: `Book returned on time! You earned +10 points.`,
        points: newPoints,
        pointsChange: 10,
        blocked: false,
      });
    }
  } catch (error) {
    console.error("returnBook error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
