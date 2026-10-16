export function readSession() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user && typeof user === "object" && typeof user.token === "string" && ["admin", "marketing", "direktur"].includes(user.role) ? user : null;
  } catch { return null; }
}

export function clearSession() {
  try { localStorage.removeItem("user"); } catch { /* Storage can be disabled by the browser. */ }
}
