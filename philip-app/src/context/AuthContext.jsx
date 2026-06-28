// philip-app/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            const parsed = JSON.parse(stored);
            authService.me()
                .then(user => {
                    setUser({ ...parsed, ...user }); // update data terbaru
                    setRole(user.role);
                })
                .catch(() => {
                    // Token tidak valid, hapus localStorage
                    localStorage.removeItem("user");
                    setUser(null);
                    setRole(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const data = await authService.login({ email, password });
        // data = { token, user: { id, nama, email, role, ... } }
        const userData = { ...data.user, token: data.token };
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        setRole(userData.role);
        return userData;
    };

    const logout = async () => {
        try { await authService.logout(); } catch { }
        localStorage.removeItem("user");
        setUser(null);
        setRole(null);
    };

    return (
        <AuthContext.Provider value={{ user, role, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
