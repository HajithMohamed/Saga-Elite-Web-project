import React, { useEffect, useState, useCallback } from "react";
// eslint-disable-next-line no-unused-vars -- motion JSX
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  ShoppingBag,
  Menu,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";
import { API_V1_URL } from "@/lib/api";
import { useSocketEvent } from "@/hooks/use-socket-events";

// Mobile bottom-nav for the admin shell. Hidden on lg+ where the sidebar is
// always visible. The 5th slot opens the sidebar drawer so every menu item
// is still reachable — this bar isn't a replacement, just a fast path.
const PRIMARY_ITEMS = [
  {
    label: "Home",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
    permission: null,
  },
  {
    label: "Orders",
    path: "/admin/order",
    icon: ShoppingCart,
    permission: "orders",
  },
  {
    label: "Payments",
    path: "/admin/manual-payments",
    icon: CreditCard,
    permission: "verifyPayments",
    badgeKey: "payments",
  },
  {
    label: "Products",
    path: "/admin/product",
    icon: ShoppingBag,
    permission: "products",
  },
];

const AdminBottomNav = ({ onMenuToggle }) => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === "super_admin" || user?.role === "superadmin";
  const userPerms = user?.permissions || {};

  const [counts, setCounts] = useState({ payments: 0, alerts: 0 });

  const fetchCounts = useCallback(async () => {
    try {
      const fallback = { data: { success: true, data: { count: 0 } } };
      const [payRes, alertRes] = await Promise.all([
        axios
          .get(
            `${API_V1_URL}/admin/manual-payments?status=proof_submitted,pending_bank_confirmation&countOnly=true`,
            { withCredentials: true }
          )
          .catch(() => fallback),
        axios
          .get(`${API_V1_URL}/admin/alerts?countOnly=true`, { withCredentials: true })
          .catch(() => fallback),
      ]);
      setCounts({
        payments: payRes.data?.data?.count || 0,
        alerts: alertRes.data?.data?.count || 0,
      });
    } catch {
      /* silent — counts are decoration, not critical */
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    const id = setInterval(fetchCounts, 30000);
    return () => clearInterval(id);
  }, [fetchCounts]);

  useSocketEvent("payment:new_pending", fetchCounts);
  useSocketEvent("payment:refresh", fetchCounts);
  useSocketEvent("admin:refresh", fetchCounts);

  const visibleItems = PRIMARY_ITEMS.filter((item) => {
    if (isSuperAdmin) return true;
    return !item.permission || userPerms[item.permission];
  });

  const renderItem = (item) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    const badge = item.badgeKey ? counts[item.badgeKey] : 0;

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`relative flex flex-1 flex-col items-center justify-center gap-1 px-1 py-1.5 transition-colors ${isActive ? "text-gold-ink" : "text-muted"
          }`}
      >
        {isActive ? (
          <motion.span
            layoutId="bottom-nav-indicator"
            className="absolute inset-x-3 top-0 h-0.5 rounded-b-full bg-gold"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        ) : null}
        <div className="relative">
          <Icon className="h-5 w-5" />
          {badge > 0 ? (
            <span className="absolute -right-2 -top-1 min-w-[16px] rounded-full bg-amber-500 px-1 text-center text-[9px] font-bold leading-[14px] text-black">
              {badge > 99 ? "99+" : badge}
            </span>
          ) : null}
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.18em]">
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line/60 bg-page/95 backdrop-blur-sm lg:hidden"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-label="Admin quick navigation"
    >
      {visibleItems.map(renderItem)}
      <button
        type="button"
        onClick={onMenuToggle}
        className="relative flex flex-1 flex-col items-center justify-center gap-1 px-1 py-1.5 text-muted transition-colors hover:text-gold-ink"
        aria-label="Open admin menu"
      >
        <div className="relative">
          <Menu className="h-5 w-5" />
          {counts.alerts > 0 ? (
            <span className="absolute -right-2 -top-1 flex h-2 w-2 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-400" />
            </span>
          ) : null}
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.18em]">More</span>
      </button>
    </nav>
  );
};

export default AdminBottomNav;
