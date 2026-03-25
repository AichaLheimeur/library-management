const pool = require("../config/db");

/**
 * POST /api/reservations
 * Utilisateur : réserver un livre indisponible
 * - Vérifie que le compte est validé et non suspendu
 * - Vérifie que le livre existe
 * - Vérifie que le livre est indisponible (available_quantity = 0)
 * - Empêche les doublons : un user ne peut pas réserver 2x le même livre
 * - Crée la réservation avec statut ACTIVE
 *
 * Statuts possibles d'une réservation :
 * - ACTIVE   : en attente, le livre n'est pas encore disponible
 * - READY    : le livre vient d'être rendu, l'utilisateur peut l'emprunter
 * - COMPLETED: l'utilisateur a emprunté le livre après la réservation
 * - CANCELLED: l'utilisateur a annulé sa réservation
 */
exports.createReservation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { book_id } = req.body;

    if (!book_id) {
      return res.status(400).json({ message: "book_id is required" });
    }

    // 1. Vérifier que le compte est validé et non suspendu
    const [userRows] = await pool.query(
      "SELECT is_validated, points_blocked_until FROM users WHERE id = ?",
      [userId]
    );
    if (userRows.length === 0 || !userRows[0].is_validated) {
      return res.status(403).json({ message: "Your account is pending validation by the library." });
    }
    const { points_blocked_until } = userRows[0];
    if (points_blocked_until && new Date(points_blocked_until) > new Date()) {
      return res.status(403).json({ message: "Your account is suspended. You cannot reserve books." });
    }

    // 2. Vérifier que le livre existe
    const [books] = await pool.query("SELECT * FROM books WHERE id = ?", [book_id]);
    if (books.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    const book = books[0];

    // 3. On ne réserve que si le livre est indisponible
    // Si disponible → l'utilisateur doit emprunter directement
    if (book.available_quantity > 0) {
      return res.status(400).json({
        message: "Book is available, you can borrow it directly",
      });
    }

    // 4. Empêcher les doublons : vérifier qu'il n'y a pas déjà une réservation ACTIVE
    const [existing] = await pool.query(
      "SELECT id FROM reservations WHERE user_id = ? AND book_id = ? AND status = 'ACTIVE'",
      [userId, book_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({
        message: "You already have an active reservation for this book",
      });
    }

    // 5. Créer la réservation avec statut ACTIVE
    const reservationDate = new Date();
    const [result] = await pool.query(
      `INSERT INTO reservations (user_id, book_id, reservation_date, status)
       VALUES (?, ?, ?, 'ACTIVE')`,
      [userId, book_id, reservationDate]
    );

    return res.status(201).json({
      message: "Reservation created successfully",
      reservation_id: result.insertId,
    });
  } catch (error) {
    console.error("createReservation error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/reservations/me
 * Utilisateur : récupérer ses propres réservations
 * Retourne toutes les réservations avec les infos du livre
 * Triées par date de réservation décroissante
 */
exports.getMyReservations = async (req, res) => {
  try {
    const userId = req.user.id;

    const [reservations] = await pool.query(
      `SELECT r.id, r.book_id, b.title, b.author, b.image_url, r.reservation_date, r.status
       FROM reservations r
       JOIN books b ON r.book_id = b.id
       WHERE r.user_id = ?
       ORDER BY r.reservation_date DESC`,
      [userId]
    );

    return res.json(reservations);
  } catch (error) {
    console.error("getMyReservations error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/reservations/:id
 * Utilisateur : annuler une réservation
 * - Seules les réservations ACTIVE ou READY peuvent être annulées
 * - Si READY annulée → remettre le stock du livre +1
 *   (car le stock avait été "réservé" pour cet utilisateur)
 */
exports.cancelReservation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // 1. Vérifier que la réservation existe et appartient à cet utilisateur
    const [rows] = await pool.query(
      "SELECT * FROM reservations WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const reservation = rows[0];

    // 2. Seules les réservations ACTIVE ou READY peuvent être annulées
    if (reservation.status !== "ACTIVE" && reservation.status !== "READY") {
      return res.status(400).json({
        message: "Only active or ready reservations can be cancelled",
      });
    }

    // 3. Mettre à jour le statut → CANCELLED
    await pool.query(
      "UPDATE reservations SET status = 'CANCELLED' WHERE id = ?",
      [id]
    );

    // 4. Si la réservation était READY, remettre le stock du livre +1
    // car le livre avait été "réservé" pour cet utilisateur
    if (reservation.status === "READY") {
      await pool.query(
        "UPDATE books SET available_quantity = available_quantity + 1 WHERE id = ?",
        [reservation.book_id]
      );
    }

    return res.json({ message: "Reservation cancelled successfully" });
  } catch (error) {
    console.error("cancelReservation error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/reservations/history
 * Admin : supprimer toutes les réservations annulées
 * Permet de nettoyer l'historique
 */
exports.adminClearHistory = async (req, res) => {
  try {
    await pool.query("DELETE FROM reservations WHERE status = 'CANCELLED'");
    return res.json({ message: "Reservation history cleared" });
  } catch (error) {
    console.error("adminClearHistory error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/reservations
 * Admin : récupérer toutes les réservations de tous les utilisateurs
 * Inclut l'email de l'utilisateur et les infos du livre
 */
exports.getAllReservations = async (req, res) => {
  try {
    const [reservations] = await pool.query(
      `SELECT r.id, r.user_id, u.email, r.book_id, b.title, b.author,
              r.reservation_date, r.status
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       JOIN books b ON r.book_id = b.id
       ORDER BY r.reservation_date DESC`
    );

    return res.json(reservations);
  } catch (error) {
    console.error("getAllReservations error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
