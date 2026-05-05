import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Star,
  LogOut,
  User,
  Package,
  ImagePlus,
  MessageSquare,
  Users,
  Shield,
  CreditCard,
  StarHalf,
  Landmark,
} from "lucide-react";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUserAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import axios from "axios";
import { useSocketEvent } from "@/hooks/use-socket-events";
import { API_V1_URL } from "@/lib/api";

const SideBar = ({ mobileOpen = false, onClose }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoading, user } = useSelector((state) => state.auth);

  const [pendingPaymentCount, setPendingPaymentCount] = useState(0);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [isLg, setIsLg] = useState(
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true
  );
  const prevPaymentRef = useRef(0);
  const prevReviewRef = useRef(0);
  const [paymentBounce, setPaymentBounce] = useState(0);
  const [reviewBounce, setReviewBounce] = useState(0);

  const fetchCounts = useCallback(async () => {
    try {
      const [paymentRes, reviewRes] = await Promise.all([
        axios.get(
          `${API_V1_URL}/admin/manual-payments?status=proof_submitted&countOnly=true`,
          { withCredentials: true }
        ),
        axios.get(`${API_V1_URL}/admin/reviews?status=pending&countOnly=true`, {
          withCredentials: true,
        }),
      ]);

      if (paymentRes.data?.success) {
        setPendingPaymentCount(paymentRes.data.data?.count || 0);
      }

      if (reviewRes.data?.success) {
        setPendingReviewCount(reviewRes.data.data?.count || 0);
      }
    } catch {
      setPendingPaymentCount(0);
      setPendingReviewCount(0);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchCounts();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchCounts]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = () => setIsLg(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const p = pendingPaymentCount;
    if (p > 0 && prevPaymentRef.current === 0 && p !== prevPaymentRef.current) {
      setPaymentBounce((k) => k + 1);
    } else if (p > prevPaymentRef.current && prevPaymentRef.current > 0) {
      setPaymentBounce((k) => k + 1);
    }
    prevPaymentRef.current = p;
  }, [pendingPaymentCount]);

  useEffect(() => {
    const r = pendingReviewCount;
    if (r > 0 && prevReviewRef.current === 0 && r !== prevReviewRef.current) {
      setReviewBounce((k) => k + 1);
    } else if (r > prevReviewRef.current && prevReviewRef.current > 0) {
      setReviewBounce((k) => k + 1);
    }
    prevReviewRef.current = r;
  }, [pendingReviewCount]);

  useSocketEvent("payment:new_pending", () => fetchCounts(), [fetchCounts]);
  useSocketEvent("admin:refresh", () => fetchCounts(), [fetchCounts]);
  useSocketEvent("payment:refresh", () => fetchCounts(), [fetchCounts]);
  useSocketEvent("review:refresh", () => fetchCounts(), [fetchCounts]);

  const isSuperAdminUser = user?.role === "super_admin" || user?.role === "superadmin";
  const userPerms = user?.permissions || {};

  const allMenuItems = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      permission: null, // everyone sees this
    },
    {
      label: "Pending Payments",
      path: "/admin/payments/pending",
      icon: <CreditCard className="h-5 w-5" />,
      badge: pendingPaymentCount,
      bounceKey: paymentBounce,
      permission: "verifyPayments",
    },
    {
      label: "Manual Payments",
      path: "/admin/manual-payments",
      icon: <Landmark className="h-5 w-5" />,
      permission: "verifyPayments",
    },
    {
      label: "Home Images",
      path: "/admin/home-images",
      icon: <ImagePlus className="h-5 w-5" />,
      permission: "products",
    },
    {
      label: "Products",
      path: "/admin/product",
      icon: <ShoppingBag className="h-5 w-5" />,
      permission: "products",
    },
    {
      label: "Orders",
      path: "/admin/order",
      icon: <ShoppingCart className="h-5 w-5" />,
      permission: "orders",
    },
    {
      label: "Review Moderation",
      path: "/admin/reviews",
      icon: <StarHalf className="h-5 w-5" />,
      badge: pendingReviewCount,
      bounceKey: reviewBounce,
      permission: "manageReviews",
    },
    {
      label: "Users",
      path: "/admin/users",
      icon: <Users className="h-5 w-5" />,
      permission: "users",
    },
    {
      label: "Notifications",
      path: "/admin/notifications",
      icon: <MessageSquare className="h-5 w-5" />,
      permission: "notifications",
    },
    {
      label: "Features",
      path: "/admin/feature",
      icon: <Star className="h-5 w-5" />,
      permission: "products",
    },
    {
      label: "Drops",
      path: "/admin/drop",
      icon: <Package className="h-5 w-5" />,
      permission: "drops",
    },
  ];

  // Super admins see everything; others filtered by their permissions
  const menuItems = isSuperAdminUser
    ? allMenuItems
    : allMenuItems.filter((item) => !item.permission || userPerms[item.permission]);

  if (isSuperAdminUser) {
    menuItems.push({
      label: "Super Admins",
      path: "/admin/super-admin",
      icon: <Shield className="h-5 w-5" />,
    });
  }

  const handleLogout = async () => {
    try {
      await dispatch(logoutUserAction()).unwrap();

      toast({
        title: "Logged out",
        description: "You have been signed out.",
        variant: "success",
      });

      navigate("/auth/login");
    } catch (err) {
      const msg =
        typeof err === "string" ? err : err?.message || "Logout failed";

      toast({
        title: "Logout failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const drawerOpen = isLg || mobileOpen;
  const drawerX = drawerOpen ? 0 : -260;

  return (
      <motion.div
        key="admin-sidebar"
        initial={false}
        animate={{ x: isLg ? 0 : drawerX }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-800 bg-black"
        style={{ willChange: "transform" }}
      >
        <div className="border-b border-gray-800 p-8">
          <Link to="/admin/dashboard" className="group block text-center" onClick={onClose}>
            <h1 className="font-serif text-2xl font-black uppercase tracking-tight text-[#D4AF37] transition-opacity group-hover:opacity-80">
              Saga <span className="text-white">Elite</span>
            </h1>

            <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.2em] text-gray-400">
              Rare Fit Forever
            </p>
          </Link>
        </div>

        <nav className="flex-1 space-y-4 px-4 py-8">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`group relative flex items-center gap-4 rounded-lg border px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? "border-[#D4AF37]/40 bg-[#D4AF37]/15 text-white shadow-lg shadow-[#D4AF37]/10"
                    : "border-transparent text-gray-400 hover:border-gray-800 hover:bg-gray-900"
                }`}
              >
                {isActive ? (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute bottom-0 left-0 top-0 w-[3px] rounded-r-full bg-[#D4AF37]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                ) : null}

                <motion.div
                  className="flex flex-1 items-center gap-4"
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className={`transition-transform duration-200 ${
                      isActive
                        ? "scale-110 text-black"
                        : "group-hover:scale-110 group-hover:text-[#D4AF37]"
                    }`}
                  >
                    {item.icon}
                  </div>

                  <span className="flex-1 font-sans text-sm font-bold uppercase tracking-wide">
                    {item.label}
                  </span>

                  {item.badge > 0 ? (
                    <motion.span
                      key={`${item.path}-badge-${item.bounceKey ?? 0}`}
                      initial={{ scale: 0 }}
                      animate={
                        item.bounceKey
                          ? { scale: [1, 1.35, 1] }
                          : { scale: 1, transition: { type: "spring", stiffness: 400, damping: 18 } }
                      }
                      transition={{ duration: item.bounceKey ? 0.45 : undefined }}
                      className="min-w-5 rounded-full bg-amber-500 px-2 py-0.5 text-center text-[10px] font-bold text-black"
                    >
                      {item.badge}
                    </motion.span>
                  ) : null}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-gray-800 p-6">
          <Link
            to="/admin/account"
            onClick={onClose}
            className={`group relative flex w-full items-center gap-4 rounded-lg border px-4 py-3 transition-all duration-200 ${
              location.pathname === "/admin/account"
                ? "border-[#D4AF37]/40 bg-[#D4AF37]/15 text-white"
                : "border-transparent text-gray-400 hover:border-gray-800 hover:bg-gray-900"
            }`}
          >
            {location.pathname === "/admin/account" ? (
              <motion.div
                layoutId="sidebar-indicator"
                className="absolute bottom-0 left-0 top-0 w-[3px] rounded-r-full bg-[#D4AF37]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            ) : null}
            <motion.div
              className="flex items-center gap-4"
              whileHover={{ x: 2 }}
              transition={{ duration: 0.2 }}
            >
              <User className="h-5 w-5" />
              <span className="font-sans text-sm font-bold uppercase tracking-wide">
                My Account
              </span>
            </motion.div>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoading}
            className={`flex w-full items-center gap-4 rounded-lg border border-transparent px-4 py-3 transition-all ${
              isLoading
                ? "cursor-not-allowed bg-gray-700 text-gray-400"
                : "text-gray-500 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
            }`}
          >
            <LogOut className="h-5 w-5" />
            <span className="font-sans text-sm font-bold uppercase tracking-wide">
              {isLoading ? "Logging out…" : "Log Out"}
            </span>
          </button>
        </div>
      </motion.div>
  );
};

export default SideBar;
