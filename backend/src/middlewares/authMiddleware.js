const jwt = require("jsonwebtoken");

function protect(req, res, next) {
  try {
    let token;

    // 1️⃣ Vérifier si le header Authorization existe
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      // Format attendu : "Bearer TOKEN"
      token = req.headers.authorization.split(" ")[1];
    }

    // 2️⃣ Si pas de token → accès refusé
    if (!token) {
      return res.status(401).json({
        ok: false,
        message: "Not authorized, no token",
      });
    }

    // 3️⃣ Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4️⃣ Attacher les infos utilisateur à la requête
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: "Not authorized, invalid token",
    });
  }
}

module.exports = { protect };