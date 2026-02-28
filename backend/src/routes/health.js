const router = require("express").Router();
const db = require("../config/db");

// Test API simple
router.get("/", (req, res) => {
  res.json({ ok: true, service: "API running ✅" });
});

// Test connexion base de données
router.get("/db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 + 1 AS result");
    res.json({ ok: true, db: rows[0] });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
