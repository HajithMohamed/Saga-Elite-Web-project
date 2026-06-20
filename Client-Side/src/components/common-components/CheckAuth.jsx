import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const CheckAuth = ({ isAuthenticated, user, children }) => {
  const location = useLocation();
  const isAdminLike = user?.role === "admin" || user?.role === "super_admin" || user?.role === "superadmin" || user?.role === "sub_admin";

  // Allow public access to shopping routes EXCEPT account/orders (checkout & cart now allowed for guests)
  const isShoppingRoute = location.pathname.startsWith("/shopping");
  const isProtectedShoppingRoute = location.pathname.includes("account") ||
                                   location.pathname.includes("orders") ||
                                   location.pathname.includes("rewards") ||
                                   location.pathname.includes("wishlist");

  const isPublicRoute = location.pathname === "/" ||
    location.pathname.includes("login") ||
    location.pathname.includes("register") ||
    location.pathname.includes('verify-otp') ||
    location.pathname.includes('forgot-password') ||
    location.pathname.includes('verify-reset-otp') ||
    location.pathname.includes('reset-password-otp') ||
    location.pathname.includes('set-new-password');

  if (!isAuthenticated && !isPublicRoute && (!isShoppingRoute || isProtectedShoppingRoute)) {
    return <Navigate to="/" />;
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
