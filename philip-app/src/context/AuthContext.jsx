import { useState, useEffect } from "react";
import { authService } from "../services/authService";
import { AuthContext } from "./useAuth";
import { readSession, clearSession } from "../utils/sessionStorage";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);
  const [loading, setLoading] = useState(() => Boolean(readSession()));
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    const stored = readSession();
    if (!stored) return;
    let active = true;
    authService.me().then(data => {
      if (!active) return;
      const verified = { ...stored, ...data };
      localStorage.setItem("user", JSON.stringify(verified));
      setUser(verified);
    }).catch(error => {
      if (!active) return;
      if (error.response?.status === 401) {
        clearSession();
        setUser(null);
      } else {
        setConnectionError(true);
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    const next = { ...data.user, token: data.token };
    localStorage.setItem("user", JSON.stringify(next));
    setUser(next);
    return next;
  };

  const endSession = () => { clearSession(); setUser(null); };
  const logout = async () => {
    try { await authService.logout(); } catch { /* The local session still ends if the network is unavailable. */ }
    endSession();
  };
  const updateUser = updates => {
    const next = { ...user, ...updates };
    localStorage.setItem("user", JSON.stringify(next));
    setUser(next);
  };

  if (loading) return <main className="min-h-screen grid place-items-center" aria-busy="true"><p role="status">Memeriksa sesi…</p></main>;
  if (connectionError) return <main className="min-h-screen grid place-items-center p-6 text-center"><div role="alert"><p>Sesi belum dapat diperiksa. Periksa koneksi lalu coba lagi.</p><button className="btn bg-red-800 text-white mt-4" onClick={() => window.location.reload()}>Coba lagi</button></div></main>;
  return <AuthContext.Provider value={{ user, role: user?.role || null, login, logout, endSession, updateUser, loading }}>{children}</AuthContext.Provider>;
}
