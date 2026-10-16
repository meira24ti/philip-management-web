const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const ISSUER = "philip-api";
const ACCESS_AUDIENCE = "philip-web";
const RESET_AUDIENCE = "philip-password-reset";
const passwordVersion = hash => crypto.createHash("sha256").update(hash).digest("hex");
const tokenOptions = audience => ({ algorithms: ["HS256"], issuer: ISSUER, audience });

function signAccessToken(user, sessionId) {
  return jwt.sign({ id: user.id_user, purpose: "access" }, process.env.JWT_SECRET, {
    algorithm: "HS256", issuer: ISSUER, audience: ACCESS_AUDIENCE, jwtid: sessionId,
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
}
function signResetToken(user) {
  return jwt.sign({ sub: user.id_user, purpose: "password_reset", version: passwordVersion(user.password_hash) }, process.env.JWT_SECRET, {
    algorithm: "HS256", issuer: ISSUER, audience: RESET_AUDIENCE, expiresIn: "15m",
  });
}
module.exports = { passwordVersion, signAccessToken, signResetToken,
  verifyAccessToken: token => jwt.verify(token, process.env.JWT_SECRET, tokenOptions(ACCESS_AUDIENCE)),
  verifyResetToken: token => jwt.verify(token, process.env.JWT_SECRET, tokenOptions(RESET_AUDIENCE)),
};
