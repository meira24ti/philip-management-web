// philip-backend/middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
        return res.status(401).json({ message: "Token tidak ditemukan" });

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, nama, email, role }
        next();
    } catch {
        return res.status(401).json({ message: "Token tidak valid atau kadaluarsa" });
    }
};
