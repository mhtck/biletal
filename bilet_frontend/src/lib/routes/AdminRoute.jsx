import React from "react";
import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (user.admin) {
    return children;
  } else {
    console.log("Tost Mesajı ekle");
    return <Navigate to="/login" replace />;
  }
};

export default AdminRoute;
