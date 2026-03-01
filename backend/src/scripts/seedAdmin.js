require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("❌ ADMIN_EMAIL or ADMIN_PASSWORD missing in .env");
    process.exit(1);
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1) Vérifier si l'admin existe déjà
    const [rows] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (rows.length > 0) {
      // ✅ Update role + password (IMPORTANT)
      await pool.query(
        "UPDATE users SET role='ADMIN', password=? WHERE email=?",
        [hashedPassword, email]
      );
      console.log(`✅ Admin updated (role=ADMIN + password reset) (${email})`);
    } else {
      // 2) Créer admin
      await pool.query(
        "INSERT INTO users (email, password, role, is_validated) VALUES (?, ?, 'ADMIN', TRUE)",
        [email, hashedPassword]
      );
      console.log(`✅ Admin created (${email})`);
    }
  } catch (err) {
    console.error("❌ Seed admin error:", err);
    process.exit(1);
  } finally {
    // ✅ Ne ferme pas le pool avec end() si ton backend tourne
    // pool.end();  // <-- on laisse commenté
    process.exit(0);
  }
}

seedAdmin();