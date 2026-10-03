import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const CheckAuth = ({ isAuthenticated, user, children }) => {
  const location = useLocation();
  const pathname = location.pathname;
  const normalizedRole = String(user?.role || "").toLowerCase();
  const isAdminLike = ["admin", "super_admin", "superadmin", "sub_admin"].includes(normalizedRole);

  // Product browsing, cart, checkout, and payment lookup remain available to
  // guests; account and order history routes require an authenticated user.
  const isShoppingRoute = pathname.startsWith("/shopping");
  const isProtectedShoppingRoute =
    pathname.startsWith("/shopping/account") ||
    pathname === "/shopping/orders" ||
    pathname.startsWith("/shopping/orders/") ||
    pathname.startsWith("/shopping/rewards") ||
    pathname === "/shopping/wishlist" ||
    pathname.startsWith("/shopping/wishlist/");

  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/auth/") ||
    pathname === "/un-auth-page";

  if (!isAuthenticated && !isPublicRoute && (!isShoppingRoute || isProtectedShoppingRoute)) {
    return <Navigate to="/" replace />;
  }
  if (
    isAuthenticated &&
    (pathname === "/auth/login" || pathname === "/auth/register")
  ) {
    if (isAdminLike) {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/shopping/home" replace />;
    }
  }
  if (
    isAuthenticated &&
    isAdminLike &&
    isShoppingRoute
  ) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (
    isAuthenticated &&
    !isAdminLike &&
    pathname.startsWith("/admin")
  ) {
    return <Navigate to="/un-auth-page" replace />;
  }
  return <>{children}</>;
};

export default CheckAuth;
