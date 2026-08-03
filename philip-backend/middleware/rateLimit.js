const attempts = new Map();

/**
 * Small in-memory limiter for sensitive endpoints. It keeps login brute-force
 * attempts bounded without adding another runtime dependency.
 */
module.exports = ({ windowMs = 15 * 60 * 1000, max = 10, key = (req) => req.ip } = {}) =>
  (req, res, next) => {
    const now = Date.now();
    const keyValue = String(key(req) || req.ip);
    const entry = attempts.get(keyValue);

    if (!entry || entry.resetAt <= now) {
      attempts.set(keyValue, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        message: "Terlalu banyak percobaan. Silakan coba lagi beberapa menit lagi.",
      });
    }

    entry.count += 1;
    attempts.set(keyValue, entry);
    next();
  };
