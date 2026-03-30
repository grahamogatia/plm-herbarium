import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

function AdminRoute() {
  const { currentUser, isAdmin } = useAuth();

  if (!currentUser || !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
