// supabase.js
import { createClient } from "@supabase/supabase-js";

// Wrap the native fetch to enforce a global timeout for Supabase requests.
// Be careful to combine with any existing signal and allow longer timeouts for auth endpoints.
const withTimeoutFetch = (defaultTimeoutMs = 12000, authTimeoutMs = 0) => {
    return (input, init = {}) => {
        const url = typeof input === "string" ? input : input?.url || "";
        const isAuth = typeof url === "string" && url.includes("/auth/v1/");
        const timeoutMs = isAuth ? authTimeoutMs : defaultTimeoutMs;

        const timeoutController = new AbortController();
        let combinedSignal = timeoutController.signal;

        // Combine with any existing signal so we don't override caller intent
        let polyfillCleanup;
        const existingSignal = init?.signal;
        if (existingSignal && existingSignal !== timeoutController.signal) {
            if (
                typeof AbortSignal !== "undefined" &&
                typeof AbortSignal.any === "function"
            ) {
                combinedSignal = AbortSignal.any([
                    existingSignal,
                    timeoutController.signal,
                ]);
            } else {
                // Polyfill combination: forward either abort to a new controller
                const controller = new AbortController();
                const onAbort = () => controller.abort();
                existingSignal.addEventListener("abort", onAbort);
                timeoutController.signal.addEventListener("abort", onAbort);
                combinedSignal = controller.signal;
                polyfillCleanup = () => {
                    try {
                        existingSignal.removeEventListener("abort", onAbort);
                    } catch (_) {}
                    try {
                        timeoutController.signal.removeEventListener(
                            "abort",
                            onAbort
                        );
                    } catch (_) {}
                };
            }
        }

        const mergedInit = { ...init, signal: combinedSignal };
        const timer =
            timeoutMs > 0
                ? setTimeout(() => timeoutController.abort(), timeoutMs)
                : null;
        return fetch(input, mergedInit).finally(() => {
            if (timer) clearTimeout(timer);
            if (polyfillCleanup) polyfillCleanup();
        });
    };
};

export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true, // saves the session in localStorage
            autoRefreshToken: true, // refresh expired tokens
        },
        // Apply fast-fail networking to all Supabase calls
        global: {
            // 12s default, no timeout for auth endpoints to avoid aborting login/session calls
            fetch: withTimeoutFetch(12000, 0),
        },
        // Keep defaults for db/realtime, but allow easier tweaking if needed later
        // db: { schema: 'public' },
        // realtime: { params: { eventsPerSecond: 2 } },
    }
);
