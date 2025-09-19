import { Navigate } from "react-router-dom";
import { useAuth } from "./UserProvider";

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <Navigate to="/" />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "admin") {
      return <Navigate to="/adminhome" replace />;
    }
    if (user.role === "user") {
      return <Navigate to="/home" replace />;
    }
    return <Navigate to="/" replace />; // fallback
  }

  return children;
};

export default PrivateRoute;