const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const { signToken } = require("../utils/jwt");
const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

// =======================
// ✅ REGISTER
// =======================
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: "Email and password are required",
      });
    }

    const [existingUser] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        ok: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hashedPassword]
    );

    const token = signToken({
      id: result.insertId,
      email,
      role: "USER",
    });

    return res.status(201).json({
      ok: true,
      token,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      message: "Server error",
    });
  }
});


// =======================
// ✅ LOGIN
// =======================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: "Email and password are required",
      });
    }

    const [rows] = await pool.query(
      "SELECT id, email, password, role FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        ok: false,
        message: "Invalid credentials",
      });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        ok: false,
        message: "Invalid credentials",
      });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return res.json({
      ok: true,
      token,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      message: "Server error",
    });
  }
});


// =======================
// ✅ PROTECTED ROUTE
// =======================
router.get("/me", protect, (req, res) => {
  return res.json({
    ok: true,
    user: req.user,
  });
});

module.exports = router;


router.get("/admin-test", protect, isAdmin, (req, res) => {
  res.json({
    ok: true,
    message: "Welcome ADMIN",
  });
});

