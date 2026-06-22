import { Navigate } from "react-router-dom";

export default function AdminProtectedRoute({ children }) {

  const token = localStorage.getItem("token");
  const adminLoggedIn =
    localStorage.getItem("adminLoggedIn");

  if (!token || !adminLoggedIn) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}