const pool = require("../config/db");

/**
 * POST /api/loans
 * Utilisateur : emprunter un livre
 * - Vérifie que le compte est validé et non suspendu
 * - Vérifie que le livre est disponible (exception si réservation READY)
 * - Crée l'emprunt pour 14 jours
 * - Décrémente le stock du livre
 * - Supprime le livre de la wishlist si présent
 * - Marque la réservation READY comme COMPLETED
 */
exports.borrowBook = async (req, res) => {
  try {
    const userId = req.user.id;
    const { book_id } = req.body;

    if (!book_id) {
      return res.status(400).json({ message: "book_id is required" });
    }

    // 1️⃣ Vérifier que le compte est validé + non suspendu (points_blocked_until)
    const [userRows] = await pool.query(
      "SELECT is_validated, points, points_blocked_until FROM users WHERE id = ?",
      [userId]
    );
    if (userRows.length === 0 || !userRows[0].is_validated) {
      return res.status(403).json({ message: "Your account is pending validation by the library. You cannot borrow books yet." });
    }

    // Si points_blocked_until est dans le futur → compte suspendu
    const { points_blocked_until } = userRows[0];
    if (points_blocked_until && new Date(points_blocked_until) > new Date()) {
      const unblockDate = new Date(points_blocked_until).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });
      return res.status(403).json({
        message: `Your account is suspended due to 0 points. You can borrow again on ${unblockDate}.`,
      });
    }

    // 2️⃣ Vérifier que le livre existe en base de données
    const [books] = await pool.query("SELECT * FROM books WHERE id = ?", [book_id]);
    if (books.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    const book = books[0];

    // 3️⃣ Vérifier le stock disponible
    // Exception : si l'utilisateur a une réservation READY pour ce livre,
    // il peut emprunter même si available_quantity = 0
    if (book.available_quantity <= 0) {
      const [readyReservation] = await pool.query(
        "SELECT id FROM reservations WHERE user_id = ? AND book_id = ? AND status = 'READY'",
        [userId, book_id]
      );
      if (readyReservation.length === 0) {
        return res.status(400).json({ message: "Book not available" });
      }
    }

    // 4️⃣ Vérifier qu'il n'y a pas déjà un emprunt actif pour ce user + ce livre
    const [activeLoans] = await pool.query(
      "SELECT id FROM loans WHERE user_id = ? AND book_id = ? AND status IN ('BORROWED', 'LATE')",
      [userId, book_id]
    );
    if (activeLoans.length > 0) {
      return res.status(400).json({ message: "You already have an active loan for this book" });
    }

    // 5️⃣ Calculer les dates : emprunt aujourd'hui, retour dans 14 jours
    const borrowDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(borrowDate.getDate() + 14);

    // 6️⃣ Créer l'emprunt en base de données
    await pool.query(
      `INSERT INTO loans (user_id, book_id, borrow_date, due_date, status)
       VALUES (?, ?, ?, ?, 'BORROWED')`,
      [userId, book_id, borrowDate, dueDate]
    );

    // 7️⃣ Diminuer le stock disponible du livre de 1
    await pool.query(
      "UPDATE books SET available_quantity = available_quantity - 1 WHERE id = ?",
      [book_id]
    );

    // 8️⃣ Supprimer de la wishlist si le livre y était ajouté
    await pool.query(
      "DELETE FROM wishlist WHERE user_id = ? AND book_id = ?",
      [userId, book_id]
    );

    // 9️⃣ Si l'user avait une réservation READY pour ce livre, la marquer comme COMPLETED
    await pool.query(
      "UPDATE reservations SET status = 'COMPLETED' WHERE user_id = ? AND book_id = ? AND status = 'READY'",
      [userId, book_id]
    );

    return res.status(201).json({ message: "Book borrowed successfully" });
  } catch (error) {
    console.error("borrowBook error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/loans/me
 * Utilisateur : récupérer ses propres emprunts
 * Retourne tous les emprunts avec le titre et l'auteur du livre
 */
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

/**
 * DELETE /api/loans/history
 * Utilisateur : supprimer son historique d'emprunts RETURNED
 * Seuls les emprunts avec status RETURNED sont supprimés
 */
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

/**
 * DELETE /api/loans/admin/history
 * Admin : supprimer tous les emprunts retournés de tous les utilisateurs
 */
exports.adminClearHistory = async (req, res) => {
  try {
    await pool.query("DELETE FROM loans WHERE status = 'RETURNED'");
    return res.json({ message: "Loan history cleared" });
  } catch (error) {
    console.error("adminClearHistory error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/loans
 * Admin : récupérer tous les emprunts de tous les utilisateurs
 * Inclut l'email de l'utilisateur et les infos du livre
 */
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

/**
 * PUT /api/loans/:id/return
 * Utilisateur : retourner un livre emprunté
 * - Vérifie que l'emprunt existe et est en cours (BORROWED ou LATE)
 * - Calcule si le retour est en retard
 * - Met à jour le statut du loan → RETURNED
 * - Remet le stock du livre +1
 * - Déclenche le statut READY pour la plus ancienne réservation ACTIVE
 * - Met à jour les points de l'utilisateur (+10 ou -5×jours)
 * - Si 0 points → suspend l'utilisateur 15 jours
 * - Crée une notification LATE_RETURN si retard
 */
exports.returnBook = async (req, res) => {
  try {
    const loanId = req.params.id;

    // 1️⃣ Vérifier que l'emprunt existe
    const [rows] = await pool.query("SELECT * FROM loans WHERE id = ?", [loanId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Loan not found" });
    }

    const loan = rows[0];

    // 2️⃣ Vérifier que le livre n'est pas déjà retourné
    if (loan.status !== "BORROWED" && loan.status !== "LATE") {
      return res.status(400).json({ message: "Book already returned" });
    }

    // 3️⃣ Calculer si le retour est en retard
    // lateDays > 0 → retard, lateDays <= 0 → à temps
    const returnDate = new Date();
    const dueDate = new Date(loan.due_date);
    const msPerDay = 1000 * 60 * 60 * 24;
    const lateDays = Math.floor((returnDate - dueDate) / msPerDay);
    const isLate = lateDays > 0;

    // 4️⃣ Mettre à jour le statut du loan → RETURNED
    await pool.query(
      "UPDATE loans SET status='RETURNED', return_date=NOW() WHERE id=?",
      [loanId]
    );

    // 5️⃣ Remettre le stock du livre +1
    await pool.query(
      "UPDATE books SET available_quantity = available_quantity + 1 WHERE id=?",
      [loan.book_id]
    );

    // 5b. Déclencher le statut READY pour la plus ancienne réservation ACTIVE
    // Quand un livre est rendu, le premier utilisateur en attente est notifié
    const [activeReservations] = await pool.query(
      `SELECT id FROM reservations WHERE book_id = ? AND status = 'ACTIVE' ORDER BY reservation_date ASC LIMIT 1`,
      [loan.book_id]
    );
    if (activeReservations.length > 0) {
      await pool.query(
        "UPDATE reservations SET status = 'READY' WHERE id = ?",
        [activeReservations[0].id]
      );
    }

    // 6️⃣ Mettre à jour les points de l'utilisateur
    const [userRows] = await pool.query(
      "SELECT points, email FROM users WHERE id = ?",
      [loan.user_id]
    );
    const currentPoints = userRows[0].points;
    const userEmail = userRows[0].email;

    const [bookRows] = await pool.query("SELECT title FROM books WHERE id = ?", [loan.book_id]);
    const bookTitle = bookRows[0]?.title || "Unknown book";

    let newPoints;
    let pointsChange;
    let blockedUntil = null;

    if (isLate) {
      // Retard : -5 points par jour, minimum 0
      pointsChange = -(lateDays * 5);
      newPoints = Math.max(0, currentPoints + pointsChange);
      // Si 0 points → suspension automatique de 15 jours
      if (newPoints === 0) {
        blockedUntil = new Date();
        blockedUntil.setDate(blockedUntil.getDate() + 15);
      }
    } else {
      // Retour à temps : +10 points
      pointsChange = 10;
      newPoints = currentPoints + pointsChange;
    }

    // Sauvegarder les nouveaux points et la suspension éventuelle
    await pool.query(
      "UPDATE users SET points = ?, points_blocked_until = ? WHERE id = ?",
      [newPoints, blockedUntil, loan.user_id]
    );

    // 7️⃣ Créer une notification admin si le retour est en retard
    if (isLate) {
      const notifMessage = `"${bookTitle}" returned by ${userEmail} was ${lateDays} day${lateDays > 1 ? "s" : ""} late. ${Math.abs(pointsChange)} points deducted (${newPoints} pts remaining).`;
      await pool.query(
        "INSERT INTO notifications (type, message, loan_id) VALUES ('LATE_RETURN', ?, ?)",
        [notifMessage, loanId]
      );
    }

    // 8️⃣ Retourner la réponse avec les détails des points
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
