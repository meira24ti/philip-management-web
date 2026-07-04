// philip-app/src/context/AuthContext.jsx
import { useState, useEffect } from "react";
import { authService } from "../services/authService";
import { AuthContext } from "./useAuth";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
      try {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    });
    const [role, setRole] = useState(() => {
      try {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored).role : null;
      } catch {
        return null;
      }
    });
    const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("user")));

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) {
            return;
        }

        let isActive = true;
        const parsed = JSON.parse(stored);
        authService.me()
            .then((userData) => {
                if (!isActive) return;
                setUser({ ...parsed, ...userData });
                setRole(userData.role);
            })
            .catch(() => {
                if (!isActive) return;
                localStorage.removeItem("user");
                setUser(null);
                setRole(null);
            })
            .finally(() => {
                if (isActive) setLoading(false);
            });

        return () => {
            isActive = false;
        };
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
        try {
            await authService.logout();
        } catch {
            // ignore logout failures and clear local auth state
        }
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
