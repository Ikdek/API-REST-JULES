const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "5m";

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET non défini : utilisation d'un secret de développement");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const hashBuffer = Buffer.from(hash, "hex");
  const candidate = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(hashBuffer, candidate);
}

function generateToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.set("WWW-Authenticate", 'Bearer error="invalid_token"');
    return res.status(401).json({ error: "Jeton invalide" });
  }
}

module.exports = { hashPassword, verifyPassword, generateToken, authenticate };
