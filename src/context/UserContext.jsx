import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { supabase } from "../../supabaseClient";
import { useToastApi } from "@/components/ui/toast";

const UserContext = createContext({
    user: null,
    loading: true,
    logout: async () => {},
    refresh: async () => {},
});

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const toast = useToastApi();
    const isLoggingOutRef = useRef(false);
    const loggedOutRef = useRef(false);
    const startupWatchdogRef = useRef(null);
    const checkingSessionRef = useRef(false);
    const watchdogShownRef = useRef(false);

    const isSessionExpired = (session) => {
        try {
            const exp = session?.expires_at; // seconds since epoch (supabase-js v2)
            if (!exp) return false;
            const nowSec = Math.floor(Date.now() / 1000);
            // Consider session expired if within a small buffer to avoid races
            return nowSec >= exp - 5;
        } catch (_) {
            return false;
        }
    };

    // Centralized, robust logout that also flushes local caches
    const forceLogout = async (message) => {
        if (isLoggingOutRef.current) return; // debounce duplicate logouts
        isLoggingOutRef.current = true;
        try {
            // Best-effort sign out; don't block on errors
            await supabase.auth.signOut();
        } catch (_) {
            // ignore
        } finally {
            try {
                localStorage.removeItem("loggedInUser");
                localStorage.removeItem("supabase.auth.token");
            } catch (_) {
                // ignore
            }
            setUser(null);
            loggedOutRef.current = true;
            if (message) {
                try {
                    toast.info(message, { duration: 2500 });
                } catch (_) {
                    // ignore toast errors
                }
            }
            setLoading(false);
            // Allow future logins after a small delay
            setTimeout(() => {
                isLoggingOutRef.current = false;
            }, 100);
        }
    };

    const loadProfile = async (authUser) => {
        if (!authUser) return null;
        let profile = null;
        // Fail fast if browser is offline to avoid long waits
        if (typeof navigator !== "undefined" && navigator.onLine === false) {
            const err = new Error("OFFLINE");
            err.code = "OFFLINE";
            throw err;
        }
        try {
            // Rely on global fetch timeout configured in supabase client
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", authUser.id)
                .maybeSingle();
            if (error) {
                throw error;
            }
            // If the row is missing, treat as fatal (flush & require re-onboarding)
            if (!data) {
                const err = new Error("PROFILE_NOT_FOUND");
                err.code = "PROFILE_NOT_FOUND";
                throw err;
            }
            profile = data;
        } catch (err) {
            // Propagate so callers can decide to flush/logout
            throw err;
        }
        const merged = {
            id: authUser.id,
            email: authUser.email,
            ...(profile || {}),
        };
        try {
            localStorage.setItem("loggedInUser", JSON.stringify(merged));
        } catch (_) {
            // ignore quota/storage issues
        }
        return merged;
    };

    const refresh = async () => {
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const authUser = sessionData?.session?.user || null;
            if (authUser) {
                try {
                    const merged = await loadProfile(authUser);
                    if (merged) setUser(merged);
                } catch (err) {
                    console.warn(
                        "Profile refresh failed, logging out:",
                        err?.message || err
                    );
                    const msg =
                        err?.code === "PROFILE_NOT_FOUND"
                            ? "Your account was not found. Please sign in again."
                            : err?.code === "OFFLINE"
                            ? "You're offline. Please reconnect and sign in again."
                            : "Your session expired. Please sign in again.";
                    await forceLogout(msg);
                }
            } else {
                localStorage.removeItem("loggedInUser");
                setUser(null);
            }
        } catch (_) {}
    };

    useEffect(() => {
        let mounted = true;
        const refreshFromSession = async () => {
            if (loggedOutRef.current) return; // ignore background refresh after logout
            try {
                checkingSessionRef.current = true;
                const { data: sessionData } = await supabase.auth.getSession();
                const authUser = sessionData?.session?.user || null;
                const session = sessionData?.session || null;
                if (session && isSessionExpired(session)) {
                    await forceLogout(
                        "Your session expired. Please sign in again."
                    );
                    return;
                }
                if (authUser) {
                    // Keep current user if same id; otherwise refresh
                    if (!user || user.id !== authUser.id || !user.role) {
                        try {
                            const merged = await loadProfile(authUser);
                            if (mounted && merged) setUser(merged);
                        } catch (err) {
                            console.warn(
                                "Initial session load failed, logging out:",
                                err?.message || err
                            );
                            const isAbort =
                                err?.name === "AbortError" ||
                                /aborted/i.test(err?.message || "");
                            const msg =
                                err?.code === "PROFILE_NOT_FOUND"
                                    ? "Your account was not found. Please sign in again."
                                    : err?.code === "OFFLINE" || isAbort
                                    ? "You're offline. Please reconnect and sign in again."
                                    : "Your session expired. Please sign in again.";
                            await forceLogout(msg);
                        }
                    }
                } else {
                    localStorage.removeItem("loggedInUser");
                    if (mounted) setUser(null);
                }
            } catch (_) {
                // ignore
            } finally {
                checkingSessionRef.current = false;
            }
        };
        (async () => {
            try {
                setLoading(true);
                // Prefer session to avoid transient null user on hard refresh
                await refreshFromSession();
            } finally {
                if (mounted) setLoading(false);
                if (startupWatchdogRef.current) {
                    clearTimeout(startupWatchdogRef.current);
                    startupWatchdogRef.current = null;
                }
            }
        })();

        // Startup watchdog: don't let the app spin forever on bad networks
        startupWatchdogRef.current = setTimeout(() => {
            if (!mounted) return;
            if (isLoggingOutRef.current || loggedOutRef.current) return;
            // Only fire if we are actually stuck checking session
            if (!checkingSessionRef.current) return;
            if (watchdogShownRef.current) return;
            watchdogShownRef.current = true;
            setLoading(false);
            try {
                toast.info(
                    "Session check took too long. Please sign in again."
                );
            } catch (_) {}
        }, 8000);

        const { data: sub } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (
                    isLoggingOutRef.current ||
                    (loggedOutRef.current && event !== "SIGNED_IN")
                ) {
                    return; // ignore churn after logout
                }
                if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                    const authUser = session?.user;
                    if (authUser) {
                        try {
                            setLoading(true);
                            const merged = await loadProfile(authUser);
                            if (merged) setUser(merged);
                        } catch (err) {
                            console.warn(
                                "Auth change profile load failed, logging out:",
                                err?.message || err
                            );
                            const isAbort =
                                err?.name === "AbortError" ||
                                /aborted/i.test(err?.message || "");
                            const msg =
                                err?.code === "PROFILE_NOT_FOUND"
                                    ? "Your account was not found. Please sign in again."
                                    : err?.code === "OFFLINE" || isAbort
                                    ? "You're offline. Please reconnect and sign in again."
                                    : "Your session expired. Please sign in again.";
                            await forceLogout(msg);
                        } finally {
                            setLoading(false);
                        }
                        // A fresh sign-in clears logout guard
                        loggedOutRef.current = false;
                    }
                } else if (event === "SIGNED_OUT") {
                    localStorage.removeItem("loggedInUser");
                    setUser(null);
                    setLoading(false);
                } else if (event === "TOKEN_REFRESH_FAILED") {
                    // Fail fast if token refresh fails
                    await forceLogout(
                        "Your session expired. Please sign in again."
                    );
                    setLoading(false);
                }
            }
        );

        const onVisibility = () => {
            if (loggedOutRef.current) return;
            if (document.visibilityState === "visible") {
                refreshFromSession();
            }
        };
        document.addEventListener("visibilitychange", onVisibility);

        // Also react to browser online events to avoid stale loading screens
        const onOnline = () => refreshFromSession();
        const onOffline = () => {
            // If we go offline, show logged-out state quickly to avoid spinners
            try {
                localStorage.removeItem("loggedInUser");
            } catch (_) {}
            setUser(null);
        };
        window.addEventListener("online", onOnline);
        window.addEventListener("offline", onOffline);

        return () => {
            mounted = false;
            sub.subscription?.unsubscribe?.();
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
            if (startupWatchdogRef.current) {
                clearTimeout(startupWatchdogRef.current);
                startupWatchdogRef.current = null;
            }
        };
    }, []);

    const logout = forceLogout;

    const value = useMemo(
        () => ({ user, loading, logout, refresh }),
        [user, loading]
    );
    return (
        <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
}

export function useUserContext() {
    return useContext(UserContext);
}
