// philip-app/src/components/Toast.jsx — komponen toast terpusat
import { useState, useCallback } from "react";
import { ToastContext } from "./ToastContext";

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = "success", duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }, []);

    const typeClass = {
        success: "alert-success",
        error: "alert-error",
        warning: "alert-warning",
        info: "alert-info",
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast toast-top toast-end z-50 gap-2">
                {toasts.map(t => (
                    <div key={t.id} className={`alert ${typeClass[t.type] || "alert-success"} shadow-lg text-sm`}>
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

