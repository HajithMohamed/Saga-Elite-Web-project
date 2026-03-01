import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const CheckAuth = ({ isAuthenticated, user, children }) => {
  const location = useLocation();
  if (
    !isAuthenticated &&
    !(
      location.pathname.includes("login") ||
      location.pathname.includes("register") ||
      location.pathname.includes('verify-otp') ||
      location.pathname.includes('forgot-password') ||
      location.pathname.includes('reset-password-otp') ||
      location.pathname.includes('set-new-password')
    )
  ) {
    return <Navigate to="/auth/login" />;
  }
  if (
    isAuthenticated &&
    (location.pathname.includes("login") ||
      location.pathname.includes("register"))
  ) {
    if (user?.role === "admin") {
      return <Navigate to="/admin/dashboard" />;
    } else {
      return <Navigate to="/shopping/home" />;
    }
  }
  if (
    isAuthenticated &&
    user?.role === "admin" &&
    location.pathname.includes("shop")
  ) {
    return <Navigate to="/admin/dashboard" />;
  }
  if (
    isAuthenticated &&
    user?.role !== "admin" &&
    location.pathname.includes("admin")
  ) {
    return <Navigate to="/un-auth-page" />;
  }
  return <>{children}</>;
};

export default CheckAuth;
