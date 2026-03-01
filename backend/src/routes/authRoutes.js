const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const { signToken } = require("../utils/jwt");

// ✅ REGISTER
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Vérification des champs
    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: "Email and password are required",
      });
    }

    // 2️⃣ Vérifier si utilisateur existe déjà
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

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Insert user
    const [result] = await pool.query(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hashedPassword]
    );

    // 5️⃣ Generate JWT
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

// ✅ LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Vérification des champs
    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: "Email and password are required",
      });
    }

    // 2️⃣ Chercher l'utilisateur
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

    // 3️⃣ Comparer password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        ok: false,
        message: "Invalid credentials",
      });
    }

    // 4️⃣ Generate JWT
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

module.exports = router;