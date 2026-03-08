const pool = require("../config/db");

// 🔹 Borrow a book
exports.borrowBook = async (req, res) => {
  try {
    const userId = req.user.id;
    const { book_id } = req.body;

    if (!book_id) {
      return res.status(400).json({ message: "book_id is required" });
    }

    // 1️⃣ Vérifier que le livre existe
    const [books] = await pool.query("SELECT * FROM books WHERE id = ?", [
      book_id,
    ]);

    if (books.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    const book = books[0];

    // 2️⃣ Vérifier stock
    if (book.available_quantity <= 0) {
      return res.status(400).json({ message: "Book not available" });
    }

    // 3️⃣ Calculer dates (14 jours)
    const borrowDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(borrowDate.getDate() + 14);

    // 4️⃣ Créer loan
    await pool.query(
      `INSERT INTO loans (user_id, book_id, borrow_date, due_date, status)
       VALUES (?, ?, ?, ?, 'BORROWED')`,
      [userId, book_id, borrowDate, dueDate]
    );

    // 5️⃣ Diminuer stock
    await pool.query(
      "UPDATE books SET available_quantity = available_quantity - 1 WHERE id = ?",
      [book_id]
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

    const [loans] = await pool.query("SELECT * FROM loans WHERE user_id = ?", [
      userId,
    ]);

    return res.json(loans);
  } catch (error) {
    console.error("getMyLoans error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Admin - Get all loans
exports.getAllLoans = async (req, res) => {
  try {
    const [loans] = await pool.query("SELECT * FROM loans");
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
    const [rows] = await pool.query("SELECT * FROM loans WHERE id = ?", [
      loanId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Loan not found" });
    }

    const loan = rows[0];

    // 2️⃣ Autoriser uniquement si le statut est BORROWED
    if (loan.status !== "BORROWED") {
      return res.status(400).json({ message: "Book already returned" });
    }

    // 3️⃣ Calculer si retard
    const returnDate = new Date();
    const dueDate = new Date(loan.due_date);
    const msPerDay = 1000 * 60 * 60 * 24;
    const lateDays = Math.floor((returnDate - dueDate) / msPerDay);
    const isLate = lateDays > 0;

    // 4️⃣ Mettre à jour le loan
    const newStatus = isLate ? "LATE" : "RETURNED";
    await pool.query(
      "UPDATE loans SET status=?, return_date=NOW() WHERE id=?",
      [newStatus, loanId]
    );

    // 5️⃣ Remettre stock +1
    await pool.query(
      "UPDATE books SET available_quantity = available_quantity + 1 WHERE id=?",
      [loan.book_id]
    );

    // 6️⃣ Créer une pénalité si retard
    if (isLate) {
      const amount = lateDays * 10.0;
      const reason = `Late return: ${lateDays} day${lateDays > 1 ? "s" : ""} overdue`;
      await pool.query(
        "INSERT INTO penalties (user_id, loan_id, amount, reason) VALUES (?, ?, ?, ?)",
        [loan.user_id, loanId, amount, reason]
      );
    }

    return res.json({
      message: isLate
        ? `Book returned late. Penalty applied: ${lateDays} day(s) × 10.00 = ${(lateDays * 10).toFixed(2)} €`
        : "Book returned successfully",
    });
  } catch (error) {
    console.error("returnBook error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};