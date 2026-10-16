/**
 * Small in-memory limiter for sensitive endpoints. It keeps login brute-force
 * attempts bounded without adding another runtime dependency.
 */
module.exports = ({ windowMs = 15 * 60 * 1000, max = 10, key = (req) => req.ip } = {}) => {
  const attempts = new Map();
  let nextCleanup = 0;
  return (req, res, next) => {
    const now = Date.now();
    if (now >= nextCleanup) {
      for (const [entryKey, entry] of attempts) if (entry.resetAt <= now) attempts.delete(entryKey);
      nextCleanup = now + Math.min(windowMs, 60000);
    }
    const keyValue = String(key(req) || req.ip).slice(0, 320);
    const entry = attempts.get(keyValue);

    if (!entry || entry.resetAt <= now) {
      if (attempts.size >= 10000 && !entry) {
        res.set("Retry-After", "60");
        return res.status(429).json({ message: "Server sedang menerima banyak permintaan. Coba lagi sebentar." });
      }
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
};
