import React from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext.jsx";
import { Button } from "@/components/ui/button";

export default function Banned() {
    const { user, logout } = useUserContext();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout("You have been logged out.");
        navigate("/", { replace: true });
    };

    const archived = !!user?.archived_at;
    const archivedReason = user?.archived_reason?.trim();
    const archivedAt =
        archived && user?.archived_at
            ? (() => {
                  const date = new Date(user.archived_at);
                  return Number.isNaN(date.getTime())
                      ? null
                      : date.toLocaleString();
              })()
            : null;
    const heading = archived ? "Account Archived" : "Account Banned";

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
            <div className="bg-white p-8 rounded shadow-md max-w-md w-full text-center">
                <h1 className="text-2xl font-bold text-red-700 mb-2">
                    {heading}
                </h1>
                <div className="space-y-4 text-sm text-[#1E1E1E]">
                    <p>
                        Your account is currently disabled and access to the
                        platform has been revoked.
                    </p>
                    {archived && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left">
                            <p className="font-medium text-red-700">
                                Archive details
                            </p>
                            {archivedReason && (
                                <p className="mt-1 text-red-800 whitespace-pre-wrap">
                                    {archivedReason}
                                </p>
                            )}
                            {archivedAt && (
                                <p className="mt-2 text-xs text-red-600">
                                    Effective {archivedAt}
                                </p>
                            )}
                        </div>
                    )}
                    <p>
                        If you believe this was a mistake or wish to appeal,
                        please contact our support team at{" "}
                        <span className="font-semibold">rentall@gmail.com</span>{" "}
                        using your registered email.
                    </p>
                </div>
                <div className="mt-6">
                    <Button
                        onClick={handleLogout}
                        className="bg-red-600 text-white hover:bg-red-700 w-full"
                    >
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    );
}
