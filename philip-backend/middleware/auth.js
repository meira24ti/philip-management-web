// philip-backend/middleware/auth.js
const pool = require("../config/db");
const { verifyAccessToken, passwordVersion } = require("../utils/authTokens");

module.exports = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
        return res.status(401).json({ message: "Token tidak ditemukan" });

    const token = authHeader.slice(7);
    let decoded;
    try {
        decoded = verifyAccessToken(token);
        if (decoded.purpose !== "access" || typeof decoded.id !== "string" || typeof decoded.jti !== "string") throw new Error("Invalid session");
    } catch {
        return res.status(401).json({ message: "Token tidak valid atau kadaluarsa" });
    }
    try {
        const [rows] = await pool.query(`SELECT id_user, nama, email, role, password_hash,
          (SELECT password_version FROM auth_sessions WHERE id_session=? AND id_user=? AND expires_at>UTC_TIMESTAMP()) AS session_password_version
          FROM user WHERE id_user=? AND is_active=1 LIMIT 1`, [decoded.jti, decoded.id, decoded.id]);
        const user = rows[0];
        if (!user || !user.session_password_version || user.session_password_version !== passwordVersion(user.password_hash)) {
            return res.status(401).json({ message: "Sesi sudah berakhir. Silakan login kembali." });
        }
        req.user = { id: user.id_user, nama: user.nama, email: user.email, role: user.role };
        req.sessionId = decoded.jti;
        return next();
    } catch (error) { return next(error); }
};
