const express = require("express");
const router = express.Router();

// Route test temporaire
router.get("/", (req, res) => {
  res.json({ message: "Books route working" });
});

module.exports = router;

