const pool = require("../config/db");

/**
 * GET /api/users/me
 * Utilisateur connecté : récupérer son propre profil
 * Retourne : id, email, role, is_validated, points, points_blocked_until, created_at
 */
exports.getMe = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, email, role, is_validated, points, points_blocked_until, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    return res.json(rows[0]);
  } catch (error) {
    console.error("getMe error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/users
 * Admin : récupérer la liste de tous les utilisateurs
 * Le mot de passe n'est jamais retourné (sécurité)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, email, role, is_validated, points, points_blocked_until, created_at FROM users"
    );
    return res.json(users);
  } catch (error) {
    console.error("getAllUsers error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/users/:id
 * Admin : récupérer un utilisateur par son ID
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      "SELECT id, email, role, is_validated, created_at FROM users WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error("getUserById error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/users/:id/validate
 * Admin : valider l'inscription d'un utilisateur
 * - L'utilisateur ne peut pas emprunter avant d'être validé
 * - Une fois validé, is_validated passe à TRUE
 */
exports.validateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      "SELECT id, is_validated FROM users WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Vérifier que l'utilisateur n'est pas déjà validé
    if (rows[0].is_validated) {
      return res.status(400).json({ message: "User is already validated" });
    }

    await pool.query("UPDATE users SET is_validated = 1 WHERE id = ?", [id]);

    return res.json({
      message: "User validated successfully",
      is_validated: true,
    });
  } catch (error) {
    console.error("validateUser error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/users/:id
 * Admin : supprimer un utilisateur
 * - Un admin ne peut pas supprimer son propre compte
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Empêcher l'admin de se supprimer lui-même
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("deleteUser error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/users/:id/points
 * Admin : ajuster manuellement les points d'un utilisateur
 * - Les points sont entre 0 et 200
 * - Si les points > 0, la suspension est automatiquement levée
 * - Chaque ajustement est enregistré dans points_log pour l'historique
 */
exports.adjustPoints = async (req, res) => {
  try {
    const { id } = req.params;
    const { points, reason } = req.body;

    if (points === undefined || points === null) {
      return res.status(400).json({ message: "points is required" });
    }

    // Limiter les points entre 0 et 200
    const newPoints = Math.min(200, Math.max(0, parseInt(points)));

    // Récupérer les anciens points pour calculer le changement
    const [rows] = await pool.query("SELECT points FROM users WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });

    const oldPoints = rows[0].points;
    const change = newPoints - oldPoints;

    // Si les nouveaux points > 0, lever la suspension (points_blocked_until = NULL)
    const blockedUntil = newPoints > 0 ? null : undefined;
    if (newPoints > 0) {
      await pool.query("UPDATE users SET points = ?, points_blocked_until = NULL WHERE id = ?", [newPoints, id]);
    } else {
      await pool.query("UPDATE users SET points = ? WHERE id = ?", [newPoints, id]);
    }

    // Enregistrer l'ajustement dans l'historique des points
    await pool.query(
      "INSERT INTO points_log (user_id, change_points, reason) VALUES (?, ?, ?)",
      [id, change, reason || "Admin adjustment"]
    );

    return res.json({ message: "Points updated", points: newPoints, blockedUntil });
  } catch (error) {
    console.error("adjustPoints error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/users/:id/points-log
 * Admin : récupérer l'historique des points d'un utilisateur
 * Retourne tous les changements de points triés du plus récent au plus ancien
 */
exports.getPointsLog = async (req, res) => {
  try {
    const { id } = req.params;
    const [logs] = await pool.query(
      "SELECT * FROM points_log WHERE user_id = ? ORDER BY created_at DESC",
      [id]
    );
    return res.json(logs);
  } catch (error) {
    console.error("getPointsLog error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
