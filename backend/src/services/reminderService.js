const pool = require("../config/db");
const nodemailer = require("nodemailer");

// ─────────────────────────────────────────
// Requête : emprunts dont la due_date approche
// ─────────────────────────────────────────
async function getLoansDueSoon(days = 3) {
  const [loans] = await pool.query(
    `SELECT l.id AS loan_id, l.due_date, l.borrow_date,
            u.email AS user_email,
            b.title AS book_title, b.author AS book_author
     FROM loans l
     JOIN users u ON l.user_id = u.id
     JOIN books b ON l.book_id = b.id
     WHERE l.status = 'BORROWED'
     AND l.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
     ORDER BY l.due_date ASC`,
    [days]
  );
  return loans;
}

// ─────────────────────────────────────────
// Envoi ou simulation d'un email de rappel
// ─────────────────────────────────────────
async function sendReminderEmail(loan) {
  const subject = `Rappel : retour du livre "${loan.book_title}"`;
  const text = [
    `Bonjour,`,
    ``,
    `Ceci est un rappel automatique de votre bibliothèque.`,
    ``,
    `Le livre "${loan.book_title}" (${loan.book_author}) que vous avez emprunté`,
    `doit être retourné avant le ${new Date(loan.due_date).toLocaleDateString("fr-FR")}.`,
    ``,
    `Merci de le rapporter à temps pour éviter toute pénalité.`,
    ``,
    `— Library Management`,
  ].join("\n");

  const smtpConfigured =
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (smtpConfigured) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: loan.user_email,
      subject,
      text,
    });

    return { status: "sent", to: loan.user_email };
  } else {
    // Mode simulation : log dans la console
    console.log("─────────────────────────────────────");
    console.log("[REMINDER SIMULATION]");
    console.log(`To      : ${loan.user_email}`);
    console.log(`Subject : ${subject}`);
    console.log(`Body    :\n${text}`);
    console.log("─────────────────────────────────────");

    return { status: "simulated", to: loan.user_email };
  }
}

module.exports = { getLoansDueSoon, sendReminderEmail };
