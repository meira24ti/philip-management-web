// philip-app/src/components/Toast.jsx — komponen toast terpusat
import { useState, useCallback, useRef, useEffect } from "react";
import { ToastContext } from "./ToastContext";

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef(new Set());
    useEffect(() => { const activeTimers = timers.current; return () => activeTimers.forEach(clearTimeout); }, []);

    const showToast = useCallback((message, type = "success", duration = 3000) => {
        const id = crypto.randomUUID();
        setToasts(prev => [...prev, { id, message, type }]);
        const timer = setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); timers.current.delete(timer); }, duration);
        timers.current.add(timer);
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
            <div className="toast toast-top toast-end z-50 gap-2" aria-live="polite" aria-relevant="additions">
                {toasts.map(t => (
                    <div key={t.id} className={`alert ${typeClass[t.type] || "alert-success"} shadow-lg text-sm`}>
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
