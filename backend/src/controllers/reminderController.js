const { getLoansDueSoon, sendReminderEmail } = require("../services/reminderService");

// GET /api/reminders/due-soon
// Admin: list loans due within N days (default 3)
exports.getDueSoon = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 3;

    if (days < 1 || days > 30) {
      return res.status(400).json({ message: "days must be between 1 and 30" });
    }

    const loans = await getLoansDueSoon(days);

    return res.json({
      days_window: days,
      count: loans.length,
      loans,
    });
  } catch (error) {
    console.error("getDueSoon error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/reminders/send
// Admin: send (or simulate) reminder emails for loans due soon
exports.sendReminders = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 3;

    const loans = await getLoansDueSoon(days);

    if (loans.length === 0) {
      return res.json({
        message: "No loans due soon. No reminders sent.",
        count: 0,
      });
    }

    const results = [];

    for (const loan of loans) {
      const result = await sendReminderEmail(loan);
      results.push({
        loan_id: loan.loan_id,
        book_title: loan.book_title,
        due_date: loan.due_date,
        ...result,
      });
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const simulated = results.filter((r) => r.status === "simulated").length;

    return res.json({
      message:
        sent > 0
          ? `${sent} reminder(s) sent by email.`
          : `${simulated} reminder(s) simulated (SMTP not configured).`,
      results,
    });
  } catch (error) {
    console.error("sendReminders error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
