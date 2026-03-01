function isAdmin(req, res, next) {
  // req.user est créé par protect()
  if (!req.user) {
    return res.status(401).json({
      ok: false,
      message: "Not authorized",
    });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      ok: false,
      message: "Forbidden: ADMIN only",
    });
  }

  next();
}

module.exports = { isAdmin };
