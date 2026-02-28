require("dotenv").config();
const express = require("express");
const healthRoutes = require("./src/routes/health");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Brancher les routes
app.use("/health", healthRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Backend is running 🚀" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});