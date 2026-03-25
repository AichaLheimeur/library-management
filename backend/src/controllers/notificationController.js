const pool = require("../config/db");

/**
 * GET /api/notifications
 * Admin : récupérer toutes les notifications non lues
 *
 * Logique en 3 étapes :
 * 1. Chercher les emprunts en retard sans notification existante (OVERDUE_LOAN)
 * 2. Créer une notification pour chaque nouvel emprunt en retard
 * 3. Retourner toutes les notifications non lues
 *
 * Deux types de notifications :
 * - OVERDUE_LOAN : livre pas encore rendu et date limite dépassée
 * - LATE_RETURN  : livre rendu en retard (créée automatiquement dans returnBook)
 */
exports.getNotifications = async (req, res) => {
  try {
    // 1. Trouver les emprunts en retard (due_date < maintenant, status = BORROWED)
    //    qui n'ont pas encore de notification dans la table
    const [overdueLoans] = await pool.query(
      `SELECT l.id, l.user_id, l.due_date, u.email, b.title
       FROM loans l
       JOIN users u ON l.user_id = u.id
       JOIN books b ON l.book_id = b.id
       WHERE l.status = 'BORROWED'
         AND l.due_date < NOW()
         AND l.id NOT IN (SELECT loan_id FROM notifications WHERE loan_id IS NOT NULL)`
    );

    // 2. Créer une notification OVERDUE_LOAN pour chaque emprunt en retard trouvé
    for (const loan of overdueLoans) {
      const dueDate = new Date(loan.due_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const message = `"${loan.title}" borrowed by ${loan.email} was due on ${dueDate} and has not been returned yet.`;
      await pool.query(
        "INSERT INTO notifications (type, message, loan_id) VALUES ('OVERDUE_LOAN', ?, ?)",
        [message, loan.id]
      );
    }

    // 3. Retourner toutes les notifications non lues, les plus récentes en premier
    const [notifications] = await pool.query(
      "SELECT * FROM notifications WHERE is_read = FALSE ORDER BY created_at DESC"
    );

    return res.json(notifications);
  } catch (error) {
    console.error("getNotifications error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/notifications/:id/read
 * Admin : marquer une notification comme lue
 * La notification disparaît du badge mais reste dans l'historique
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE id = ?", [id]);
    return res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("markAsRead error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/notifications/read-all
 * Admin : marquer toutes les notifications comme lues d'un coup
 * Le badge passe à 0
 */
exports.markAllAsRead = async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE");
    return res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("markAllAsRead error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
