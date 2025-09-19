import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Inbox from "./pages/Inbox";
import Notification from "./pages/Notification";
import AdminHome from "./pages/admin/AdminHome";
import PendingUser from "./pages/admin/pages/PendingUser";
import PendingItems from "./pages/admin/pages/PendingItems";
import ViewRentingHistory from "./pages/admin/pages/ViewRentingHistory";
import PendingBookings from "./pages/admin/pages/PendingBookings";
import { UserProvider } from "./hooks/UserProvider";
import PrivateRoute from "./hooks/PrivateRoute";

const App = () => {
    return (
        <UserProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/home"
                        element={
                            <PrivateRoute allowedRoles={["user"]}>
                                <Home />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/inbox"
                        element={
                            <PrivateRoute allowedRoles={["user"]}>
                                <Inbox />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/notifications"
                        element={
                            <PrivateRoute allowedRoles={["user"]}>
                                <Notification />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/adminhome"
                        element={
                            <PrivateRoute allowedRoles={["admin"]}>
                                <AdminHome />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/pending-users"
                        element={
                            <PrivateRoute allowedRoles={["admin"]}>
                                <PendingUser />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/pending-items"
                        element={
                            <PrivateRoute allowedRoles={["admin"]}>
                                <PendingItems />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/pending-bookings"
                        element={
                            <PrivateRoute allowedRoles={["admin"]}>
                                <PendingBookings />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/renting-history"
                        element={
                            <PrivateRoute allowedRoles={["admin"]}>
                                <ViewRentingHistory />
                            </PrivateRoute>
                        }
                    />
                </Routes>
            </Router>
        </UserProvider>
    );
};

export default App;
