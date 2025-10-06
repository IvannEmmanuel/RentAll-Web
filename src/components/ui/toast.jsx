import React, { createContext, useCallback, useContext } from "react";
import Swal from "sweetalert2";

// Keep a minimal context API so existing imports don’t break, but delegate to SweetAlert2
const ToastContext = createContext({
    success: (msg, opts) => {},
    error: (msg, opts) => {},
    info: (msg, opts) => {},
});

export function ToastProvider({ children }) {
    const success = useCallback((message, opts = {}) => {
        const { duration, sticky, ...rest } = opts;
        Swal.fire({
            icon: "success",
            title: rest.title || "Success",
            text: message,
            timer: sticky ? undefined : duration ?? 2500,
            showConfirmButton: !!sticky ? true : false,
            timerProgressBar: !sticky,
            ...rest,
        });
    }, []);

    const error = useCallback((message, opts = {}) => {
        const { duration, sticky, ...rest } = opts;
        Swal.fire({
            icon: "error",
            title: rest.title || "Error",
            text: message,
            timer: sticky ? undefined : duration ?? 3000,
            showConfirmButton: !!sticky,
            ...rest,
        });
    }, []);

    const info = useCallback((message, opts = {}) => {
        const { duration, sticky, ...rest } = opts;
        Swal.fire({
            icon: "info",
            title: rest.title || "Info",
            text: message,
            timer: sticky ? undefined : duration ?? 2500,
            showConfirmButton: !!sticky ? true : false,
            timerProgressBar: !sticky,
            ...rest,
        });
    }, []);

    const value = React.useMemo(
        () => ({ success, error, info }),
        [success, error, info]
    );
    return (
        <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}

export function useToastApi() {
    // Keep the same hook API used throughout the app
    const { success, error, info } = useToast();
    return React.useMemo(
        () => ({ success, error, info }),
        [success, error, info]
    );
}
