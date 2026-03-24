const pool = require("../config/db");

// GET /api/users/me
// User: get own profile
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

// GET /api/users
// Admin: get all users (without password)
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

// GET /api/users/:id
// Admin: get a user by id (without password)
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

// PUT /api/users/:id/validate
// Admin: toggle is_validated for a user
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

// PUT /api/users/:id/points
// Admin: manually adjust a user's points
exports.adjustPoints = async (req, res) => {
  try {
    const { id } = req.params;
    const { points } = req.body;

    if (points === undefined || points === null || isNaN(points)) {
      return res.status(400).json({ message: "points is required and must be a number" });
    }

    // Get old points before update
    const [userRows] = await pool.query("SELECT points FROM users WHERE id = ?", [id]);
    if (userRows.length === 0) return res.status(404).json({ message: "User not found" });
    const oldPoints = userRows[0].points;

    const newPoints = Math.max(0, Math.min(200, parseInt(points)));
    const change = newPoints - oldPoints;

    // If points > 0, lift the suspension
    if (newPoints > 0) {
      await pool.query(
        "UPDATE users SET points = ?, points_blocked_until = NULL WHERE id = ?",
        [newPoints, id]
      );
    } else {
      await pool.query("UPDATE users SET points = ? WHERE id = ?", [newPoints, id]);
    }

    // Log the change
    await pool.query(
      "INSERT INTO points_log (user_id, change_points, reason) VALUES (?, ?, ?)",
      [id, change, `Manual adjustment by admin: ${oldPoints} → ${newPoints} pts`]
    );

    return res.json({ message: "Points updated successfully", points: newPoints });
  } catch (error) {
    console.error("adjustPoints error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/users/:id/points-log
// Admin: get points history for a user
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

// DELETE /api/users/:id
// Admin: delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
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
