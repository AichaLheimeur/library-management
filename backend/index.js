require("dotenv").config();
const express = require("express");

const healthRoutes = require("./src/routes/health");
const authRoutes = require("./src/routes/authRoutes");
const bookRoutes = require("./src/routes/bookRoutes");
const loanRoutes = require("./src/routes/loanRoutes");
const reservationRoutes = require("./src/routes/reservationRoutes");
const penaltyRoutes = require("./src/routes/penaltyRoutes");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/docs/swagger");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global
app.use(express.json());

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/penalties", penaltyRoutes);

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
