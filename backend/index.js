require("dotenv").config();
const express = require("express");

const healthRoutes = require("./src/routes/health");
const authRoutes = require("./src/routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global
app.use(express.json());

// Routes
app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);

// Route racine
app.get("/", (req, res) => {
  res.json({ message: "Backend is running 🚀" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});