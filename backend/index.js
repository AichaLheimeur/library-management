require("dotenv").config();
const express = require("express");

const healthRoutes = require("./src/routes/health");
const authRoutes = require("./src/routes/authRoutes");
const bookRoutes = require("./src/routes/bookRoutes");
const loanRoutes = require("./src/routes/loanRoutes");
const reservationRoutes = require("./src/routes/reservationRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global
app.use(express.json());

// Routes
app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/reservations", reservationRoutes);

// Route racine
app.get("/", (req, res) => {
  res.json({ message: "Backend is running 🚀" });
});

// Toujours en dernier
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
