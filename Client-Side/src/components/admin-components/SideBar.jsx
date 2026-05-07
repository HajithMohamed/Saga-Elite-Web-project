import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Gift,
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
  FileText,
  Inbox,
  Newspaper,
  Settings,
  BarChart3,
  BadgePercent,
  Tag,
  Truck,
  Bell,
  FolderOpen,
  Globe,
  Layers3,
} from "lucide-react";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUserAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import axios from "axios";
import { useSocketEvent } from "@/hooks/use-socket-events";
import { API_V1_URL } from "@/lib/api";

const SECTION_LABELS = {
  Commerce: ["Products", "Drops", "Collections", "Offers & Deals", "Coupons", "Gifts"],
  Fulfilment: ["Orders", "Pending Payments", "Manual Payments", "Shipping"],
  Customers: ["Users", "Review Moderation"],
  Content: ["Home Images", "Media Library", "Community"],
  Marketing: ["Notifications", "Newsletter", "Contact Inquiries"],
  Settings: [
    "Site Config",
    "SEO & Branding",
    "Analytics",
    "Drop Analytics",
    "Features",
  ],
};

const SECTION_ORDER = [
  "Commerce",
  "Fulfilment",
  "Customers",
  "Content",
  "Marketing",
  "Settings",
];

const findSectionFor = (label) => {
  for (const section of SECTION_ORDER) {
    if (SECTION_LABELS[section].includes(label)) return section;
  }
  return null;
};

const SideBar = ({ mobileOpen = false, onClose }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoading, user } = useSelector((state) => state.auth);

  const [pendingPaymentCount, setPendingPaymentCount] = useState(0);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [agingAlertCount, setAgingAlertCount] = useState(0);
  const [isLg, setIsLg] = useState(
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true
  );
  const prevPaymentRef = useRef(0);
  const prevReviewRef = useRef(0);
  const prevAgingRef = useRef(0);
  const [paymentBounce, setPaymentBounce] = useState(0);
  const [reviewBounce, setReviewBounce] = useState(0);
  const [agingBounce, setAgingBounce] = useState(0);

  const fetchCounts = useCallback(async () => {
    try {
      const [paymentRes, reviewRes, agingRes] = await Promise.all([
        axios.get(
          `${API_V1_URL}/admin/manual-payments?status=proof_submitted&countOnly=true`,
          { withCredentials: true }
        ),
        axios.get(`${API_V1_URL}/admin/reviews?status=pending&countOnly=true`, {
          withCredentials: true,
        }),
        axios
          .get(`${API_V1_URL}/admin/products/aging?countOnly=true`, {
            withCredentials: true,
          })
          .catch(() => ({ data: { success: true, data: { count: 0 } } })),
      ]);

      if (paymentRes.data?.success) {
        setPendingPaymentCount(paymentRes.data.data?.count || 0);
      }

      if (reviewRes.data?.success) {
        setPendingReviewCount(reviewRes.data.data?.count || 0);
      }

      if (agingRes.data?.success) {
        setAgingAlertCount(agingRes.data.data?.count || 0);
      }
    } catch {
      setPendingPaymentCount(0);
      setPendingReviewCount(0);
      setAgingAlertCount(0);
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

  useEffect(() => {
    const a = agingAlertCount;
    if (a > 0 && prevAgingRef.current === 0 && a !== prevAgingRef.current) {
      setAgingBounce((k) => k + 1);
    } else if (a > prevAgingRef.current && prevAgingRef.current > 0) {
      setAgingBounce((k) => k + 1);
    }
    prevAgingRef.current = a;
  }, [agingAlertCount]);

  useSocketEvent("payment:new_pending", () => fetchCounts(), [fetchCounts]);
  useSocketEvent("admin:refresh", () => fetchCounts(), [fetchCounts]);
  useSocketEvent("payment:refresh", () => fetchCounts(), [fetchCounts]);
  useSocketEvent("review:refresh", () => fetchCounts(), [fetchCounts]);

  const isSuperAdminUser = user?.role === "super_admin" || user?.role === "superadmin";
  const userPerms = user?.permissions || {};

  const allMenuItems = [
    // Overview
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      permission: null,
    },

    // Commerce
    {
      label: "Products",
      path: "/admin/product",
      icon: <ShoppingBag className="h-5 w-5" />,
      permission: "products",
    },
    {
      label: "Drops",
      path: "/admin/drop",
      icon: <Package className="h-5 w-5" />,
      permission: "drops",
    },
    {
      label: "Collections",
      path: "/admin/collections",
      icon: <Layers3 className="h-5 w-5" />,
      permission: "products",
    },
    {
      label: "Offers & Deals",
      path: "/admin/offers",
      icon: <BadgePercent className="h-5 w-5" />,
      badge: agingAlertCount,
      bounceKey: agingBounce,
      permission: "products",
    },
    {
      label: "Coupons",
      path: "/admin/coupons",
      icon: <Tag className="h-5 w-5" />,
      permission: "sendCampaigns",
    },
    {
      label: "Gifts",
      path: "/admin/gifts",
      icon: <Gift className="h-5 w-5" />,
      permission: "products",
    },

    // Fulfilment
    {
      label: "Orders",
      path: "/admin/order",
      icon: <ShoppingCart className="h-5 w-5" />,
      permission: "orders",
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
      label: "Shipping",
      path: "/admin/shipping",
      icon: <Truck className="h-5 w-5" />,
      permission: "manageInventory",
      comingSoon: true,
    },

    // Customers
    {
      label: "Users",
      path: "/admin/users",
      icon: <Users className="h-5 w-5" />,
      permission: "users",
    },
    {
      label: "Review Moderation",
      path: "/admin/reviews",
      icon: <StarHalf className="h-5 w-5" />,
      badge: pendingReviewCount,
      bounceKey: reviewBounce,
      permission: "manageReviews",
    },

    // Content
    {
      label: "Home Images",
      path: "/admin/home-images",
      icon: <ImagePlus className="h-5 w-5" />,
      permission: "products",
    },
    {
      label: "Media Library",
      path: "/admin/media",
      icon: <FolderOpen className="h-5 w-5" />,
      permission: "products",
    },
    {
      label: "Community",
      path: "/admin/community",
      icon: <Globe className="h-5 w-5" />,
      permission: "sendCampaigns",
      comingSoon: true,
    },

    // Marketing
    {
      label: "Notifications",
      path: "/admin/notifications",
      icon: <Bell className="h-5 w-5" />,
      permission: "notifications",
    },
    {
      label: "Newsletter",
      path: "/admin/newsletter",
      icon: <Newspaper className="h-5 w-5" />,
      permission: null,
    },
    {
      label: "Contact Inquiries",
      path: "/admin/contact-inquiries",
      icon: <Inbox className="h-5 w-5" />,
      permission: null,
    },

    // Settings
    {
      label: "Site Config",
      path: "/admin/about-content",
      icon: <Settings className="h-5 w-5" />,
      permission: null,
      superAdminOnly: true,
    },
    {
      label: "SEO & Branding",
      path: "/admin/seo",
      icon: <Globe className="h-5 w-5" />,
      permission: null,
      superAdminOnly: true,
      comingSoon: true,
    },
    {
      label: "Analytics",
      path: "/admin/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      permission: "analytics",
    },
    {
      label: "Drop Analytics",
      path: "/admin/drop-analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      permission: "analytics",
    },
    {
      label: "Features",
      path: "/admin/feature",
      icon: <Star className="h-5 w-5" />,
      permission: "products",
    },
  ];

  // Super admins see everything; others filtered by their permissions
  const menuItems = (isSuperAdminUser
    ? allMenuItems
    : allMenuItems.filter((item) => {
        if (item.superAdminOnly) return false;
        return !item.permission || userPerms[item.permission];
      })
  ).filter((item) => !item.hidden);

  if (isSuperAdminUser) {
    menuItems.push({
      label: "Super Admins",
      path: "/admin/super-admin",
      icon: <Shield className="h-5 w-5" />,
      _section: null,
    });
  }

  // Build a render order: Dashboard first (no section), then grouped sections, then super-admin trail.
  const renderGroups = [];
  const overviewItems = menuItems.filter((i) => i.label === "Dashboard");
  if (overviewItems.length) {
    renderGroups.push({ section: null, items: overviewItems });
  }

  SECTION_ORDER.forEach((section) => {
    const items = menuItems.filter((i) => findSectionFor(i.label) === section);
    if (items.length) renderGroups.push({ section, items });
  });

  const trailingItems = menuItems.filter(
    (i) => i.label !== "Dashboard" && !findSectionFor(i.label)
  );
  if (trailingItems.length) {
    renderGroups.push({ section: null, items: trailingItems });
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

  const renderItem = (item) => {
    const isActive = location.pathname === item.path;
    const dimmed = item.comingSoon;

    return (
      <Link
        key={item.path + item.label}
        to={item.path}
        onClick={onClose}
        className={`group relative flex items-center gap-4 rounded-lg border px-4 py-3 transition-all duration-200 ${
          isActive
            ? "border-[#f2ca50]/50 bg-[#f2ca50]/10 text-[#f2ca50] shadow-[0_0_20px_rgba(242,202,80,0.15)]"
            : "border-transparent text-[#99907c] hover:border-[#4d4635] hover:bg-[#131313] hover:text-[#e5e2e1]"
        } ${dimmed ? "opacity-60" : ""}`}
      >
        {isActive ? (
          <motion.div
            layoutId="sidebar-indicator"
            className="absolute bottom-0 left-0 top-0 w-[3px] rounded-r-full bg-[#f2ca50]"
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
                : "group-hover:scale-110 group-hover:text-[#f2ca50]"
            }`}
          >
            {item.icon}
          </div>

          <span className="flex-1 font-sans text-sm font-bold uppercase tracking-wide">
            {item.label}
          </span>

          {item.comingSoon ? (
            <span className="rounded-sm border border-[#4d4635]/60 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-[#574500]">
              Soon
            </span>
          ) : item.badge > 0 ? (
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
  };

  return (
      <motion.div
        key="admin-sidebar"
        initial={false}
        animate={{ x: isLg ? 0 : drawerX }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#4d4635]/60 bg-[#0a0a0a]"
        style={{ willChange: "transform" }}
      >
        <div className="border-b border-[#4d4635]/60 px-5 py-5">
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-3"
            onClick={onClose}
          >
            <img
              src="/LOGO.png"
              alt="Saga Elite"
              className="h-8 w-8 shrink-0 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div>
              <div className="se-label text-[10px] font-bold tracking-[0.34em] text-[#f2ca50]">
                SAGA ELITE
              </div>
              <div className="se-body mt-0.5 text-[10px] tracking-[0.22em] text-[#99907c]">
                Admin Panel
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
          {renderGroups.map((group, groupIdx) => (
            <div key={`group-${groupIdx}-${group.section || "top"}`} className="space-y-2">
              {group.section ? (
                <p className="px-4 pb-1 pt-4 font-sans text-[9px] uppercase tracking-[0.3em] text-[#4d4635] select-none">
                  {group.section}
                </p>
              ) : null}
              <div className="space-y-2">{group.items.map(renderItem)}</div>
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-[#4d4635]/60 p-6">
          <Link
            to="/admin/account"
            onClick={onClose}
            className={`group relative flex w-full items-center gap-4 rounded-lg border px-4 py-3 transition-all duration-200 ${
              location.pathname === "/admin/account"
                ? "border-[#f2ca50]/40 bg-[#f2ca50]/15 text-white"
                : "border-transparent text-[#99907c] hover:border-[#4d4635]/60 hover:bg-[#131313]"
            }`}
          >
            {location.pathname === "/admin/account" ? (
              <motion.div
                layoutId="sidebar-indicator"
                className="absolute bottom-0 left-0 top-0 w-[3px] rounded-r-full bg-[#f2ca50]"
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
                ? "cursor-not-allowed bg-[#131313] text-[#99907c]"
                : "text-[#99907c] hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
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
