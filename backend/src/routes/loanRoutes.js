const express = require("express");
const router = express.Router();

// Test route
router.get("/", (req, res) => {
  res.json({ message: "Loans route working ✅" });
});

module.exports = router;