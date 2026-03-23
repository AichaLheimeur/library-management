require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const healthRoutes = require("./src/routes/health");
const authRoutes = require("./src/routes/authRoutes");
const bookRoutes = require("./src/routes/bookRoutes");
const loanRoutes = require("./src/routes/loanRoutes");
const reservationRoutes = require("./src/routes/reservationRoutes");
const penaltyRoutes = require("./src/routes/penaltyRoutes");
const userRoutes = require("./src/routes/userRoutes");
const reminderRoutes = require("./src/routes/reminderRoutes");
const wishlistRoutes = require("./src/routes/wishlistRoutes");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/docs/swagger");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Static files (book covers)
app.use("/images", express.static(path.join(__dirname, "public/images")));

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/penalties", penaltyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/wishlist", wishlistRoutes);

// Route racine
app.get("/", (req, res) => {
  res.json({ message: "Backend is running 🚀" });
});

// Démarrage du serveur seulement si lancé directement (pas lors des tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
