import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const CheckAuth = ({ isAuthenticated, user, children }) => {
  const location = useLocation();
  const isAdminLike = user?.role === "admin" || user?.role === "super_admin" || user?.role === "superadmin";

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
    if (isAdminLike) {
      return <Navigate to="/admin/dashboard" />;
    } else {
      return <Navigate to="/shopping/home" />;
    }
  }
  if (
    isAuthenticated &&
    isAdminLike &&
    location.pathname.includes("shop")
  ) {
    return <Navigate to="/admin/dashboard" />;
  }
  if (
    isAuthenticated &&
    !isAdminLike &&
    location.pathname.includes("admin")
  ) {
    return <Navigate to="/un-auth-page" />;
  }
  return <>{children}</>;
};

export default CheckAuth;
