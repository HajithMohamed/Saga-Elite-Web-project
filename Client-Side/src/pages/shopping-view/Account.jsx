import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Key,
  LogOut,
  Package,
  CheckCircle2,
  Clock3,
  Heart,
  Mail,
  Phone,
  ShoppingBag,
  Star,
  TicketPercent,
} from "lucide-react";

import { logoutUserAction, changePasswordAction, checkAuthAction } from "@/store/auth-slice";
import { fetchWishlistAction } from "@/store/cart-slice";
import { fetchUserOrders } from "@/store/order-slice";
import axiosInstance from "@/api/axiosInstance";
import { changePasswordFormControls } from "@/config";
import CommonForm from "@/components/common-components/CommonForm";
import PasswordStrengthMeter from "@/components/common-components/PasswordStrengthMeter";
import StatusBadge from "@/components/common-components/StatusBadge";
import { toast } from "@/hooks/use-toast";

const SL_MOBILE_PREFIXES = ["70", "71", "72", "74", "75", "76", "77", "78"];
const isValidSLPhone = (raw) => {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return false;
  let local = digits;
  if (local.startsWith("0094")) local = local.slice(4);
  else if (local.startsWith("94") && local.length === 11) local = local.slice(2);
  else if (local.startsWith("0") && local.length === 10) local = local.slice(1);
  if (local.length !== 9) return false;
  return SL_MOBILE_PREFIXES.includes(local.slice(0, 2));
};

const Account = () => {
  const { user } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.cart.wishlist?.items ?? []);
  const { userOrders } = useSelector((state) => state.order);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const homeLink = isAdmin ? "/admin/dashboard" : "/shopping/home";

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const [phoneInput, setPhoneInput] = useState("");
  const [phoneOnRecord, setPhoneOnRecord] = useState(user?.phoneNumber || "");
  const [phoneEditMode, setPhoneEditMode] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState(null);
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = useState({});

  const changePasswordControls = useMemo(() => {
    if (user?.provider !== "google") {
      return changePasswordFormControls;
    }
    return changePasswordFormControls.map((control) =>
      control.name === "oldPassword"
        ? { ...control, placeholder: "Current password (leave blank if not set yet)" }
        : control
    );
  }, [user?.provider]);

  useEffect(() => {
    dispatch(fetchWishlistAction());
    dispatch(fetchUserOrders());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    axiosInstance
      .get("/user/me")
      .then((res) => {
        if (cancelled) return;
        const phone = res?.data?.data?.phoneNumber || "";
        setPhoneOnRecord(phone);
        setPhoneInput(phone);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleSavePhone = async () => {
    setPhoneError(null);
    if (!isValidSLPhone(phoneInput)) {
      setPhoneError("Enter a valid Sri Lankan mobile (e.g. 077 123 4567).");
      return;
    }
    try {
      setPhoneSaving(true);
      const res = await axiosInstance.patch("/user/me", { phoneNumber: phoneInput });
      const updated = res?.data?.data?.phoneNumber || "";
      setPhoneOnRecord(updated);
      setPhoneInput(updated);
      setPhoneEditMode(false);
      dispatch(checkAuthAction());
      toast({
        title: "Phone updated",
        description: "WhatsApp notifications will be sent to this number from now on.",
        variant: "success",
      });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Could not update your phone number.";
      setPhoneError(msg);
      toast({ title: "Update failed", description: msg, variant: "destructive" });
    } finally {
      setPhoneSaving(false);
    }
  };

  useEffect(() => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const nextErrors = {};
    if (formData.newPassword && !passwordRegex.test(formData.newPassword)) {
      nextErrors.newPassword = "Must be 8+ chars with uppercase, lowercase, number, and special character.";
    }
    if (formData.passwordConfirm && formData.newPassword !== formData.passwordConfirm) {
      nextErrors.passwordConfirm = "Passwords do not match.";
    }
    setErrors(nextErrors);
  }, [formData]);

  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (Object.keys(errors).length > 0) return;
    setIsSubmittingPassword(true);
    try {
      const response = await dispatch(changePasswordAction(formData)).unwrap();
      toast({ title: "Password updated", description: response.message || "Your password has been saved.", variant: "success" });
      setFormData({ oldPassword: "", newPassword: "", passwordConfirm: "" });
      setShowChangePassword(false);
    } catch (error) {
      toast({ title: "Password update failed", description: error?.message || error || "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUserAction()).unwrap();
      navigate("/auth/login");
    } catch (error) {
      toast({ title: "Logout failed", description: error?.message || error || "Try again.", variant: "destructive" });
    }
  };

  const displayName = user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "-";

  const totalOrders = userOrders.length;
  const deliveredOrders = userOrders.filter((order) => order.status === "delivered").length;
  const activeOrders = userOrders.filter((order) =>
    ["pending", "pending_payment", "verification_pending", "confirmed", "proof_submitted", "processing", "shipped"].includes(order.status)
  ).length;
  const latestOrder = userOrders[0] || null;

  const inputClasses = "bg-transparent border-b border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-gold-ink2";
  const labelClasses = "text-gray-700 dark:text-gray-300";
  const buttonClasses = "bg-gold-deep text-black font-bold uppercase py-3 rounded mt-4";
  const isPasswordFormIncomplete = !formData.newPassword || !formData.passwordConfirm || (user?.provider !== "google" && !formData.oldPassword);

  const quickLinks = [
    { to: "/shopping/orders", label: "Orders", sub: "Track and history", icon: Package },
    { to: "/shopping/rewards", label: "My Rewards", sub: "Coupons & perks", icon: TicketPercent },
    { to: "/account/my-reviews", label: "My Reviews", sub: "View & manage", icon: Star },
    { to: "/shopping/wishlist", label: "Wishlist", sub: `${wishlistItems.length} saved`, icon: Heart },
    { to: "/shopping/product-list", label: "Shop", sub: "Browse catalog", icon: ShoppingBag },
    { to: "/contact", label: "Contact", sub: "Support & hours", icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-ivory dark:bg-page text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="container mx-auto max-w-7xl px-4 py-10 md:px-6">
        <nav className="mb-8 flex gap-2 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          <Link to={homeLink} className="hover:text-black dark:hover:text-ink transition-colors">{isAdmin ? "Dashboard" : "Home"}</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gold-ink2">Account</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Profile Sidebar */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-ink/10 dark:bg-panel"
            >
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 dark:bg-card shadow-inner">
                <span className="text-3xl font-bold text-gray-800 dark:text-gray-200">{initials}</span>
                {user?.provider === "google" && (
                  <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-ink dark:border-panel bg-white shadow-sm" title="Signed in with Google">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </span>
                )}
              </div>
              <h2 className="mt-5 text-xl font-bold text-gray-900 dark:text-ink">{displayName}</h2>
              <p className="mt-1 font-medium text-gray-600 dark:text-gray-400">{user?.email}</p>
              <div className="mt-6 border-t border-gray-100 pt-6 dark:border-ink/10">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  Member since {memberSince}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="space-y-8 lg:col-span-8">
            
            {/* Account Details */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-ink/10 dark:bg-panel">
              <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-gold-ink2">
                Account Details
              </h3>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Email Address</p>
                  <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">{user?.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Account Role</p>
                  <p className="mt-1 font-medium capitalize text-gray-900 dark:text-gray-100">{user?.role}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</p>
                  <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                    {user?.isVerified ? "Verified" : "Not Verified"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Sign-in Method</p>
                  <div className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                    {user?.provider === "google" ? (
                      <span className="inline-flex items-center rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                        Google
                      </span>
                    ) : (
                      "Email & Password"
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-ink/10 dark:bg-panel">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gold-ink2">
                  <Phone className="h-4 w-4" /> Contact Details
                </h3>
                {!phoneEditMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneInput(phoneOnRecord || "");
                      setPhoneError(null);
                      setPhoneEditMode(true);
                    }}
                    className="text-xs font-bold uppercase tracking-wider text-gray-600 transition-colors hover:text-black dark:text-gray-400 dark:hover:text-ink"
                  >
                    {phoneOnRecord ? "Edit Number" : "Add Number"}
                  </button>
                )}
              </div>

              {!phoneOnRecord && !phoneEditMode && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <p className="font-semibold text-amber-800 dark:text-amber-100">Add your mobile number for updates</p>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-200/80">We use it for OTPs, order confirmations, and shipping updates.</p>
                  <button
                    onClick={() => { setPhoneInput(""); setPhoneError(null); setPhoneEditMode(true); }}
                    className="mt-4 rounded bg-gold-deep px-4 py-2 text-xs font-bold uppercase tracking-widest text-black shadow-sm transition hover:bg-yellow-500"
                  >
                    Add Number Now
                  </button>
                </div>
              )}

              {phoneEditMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Mobile Number</label>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => { setPhoneInput(e.target.value); setPhoneError(null); }}
                      placeholder="077 123 4567"
                      className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-900 transition focus:border-gold-ink2 focus:ring-1 focus:ring-gold-ink2 dark:border-gray-700 dark:text-gray-100"
                    />
                    {phoneError ? (
                      <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{phoneError}</p>
                    ) : (
                      <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">Sri Lankan mobile only (e.g. 077 123 4567).</p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSavePhone}
                      disabled={phoneSaving}
                      className="rounded bg-gold-deep px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-yellow-500 disabled:opacity-50"
                    >
                      {phoneSaving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={() => { setPhoneEditMode(false); setPhoneInput(phoneOnRecord || ""); setPhoneError(null); }}
                      disabled={phoneSaving}
                      className="rounded border border-gray-300 bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-ink/5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : phoneOnRecord ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Mobile Number</p>
                  <p className="mt-1 font-mono text-lg font-medium text-gray-900 dark:text-gray-100">{phoneOnRecord}</p>
                </div>
              ) : null}
            </div>

            {/* Quick Links Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {quickLinks.map((link, i) => (
                <motion.div key={link.to} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link
                    to={link.to}
                    className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gold-ink2/50 hover:shadow-md dark:border-ink/10 dark:bg-panel"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-600 transition group-hover:bg-gold-deep/10 group-hover:text-gold-ink2 dark:bg-ink/5 dark:text-gray-400">
                      <link.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-gray-100">{link.label}</h4>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{link.sub}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 transition group-hover:translate-x-1 group-hover:text-gold-ink2" />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-ink/10 dark:bg-panel">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gold-ink2">Order Summary</h3>
                <Link
                  to="/shopping/orders"
                  className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-800 transition hover:bg-gray-200 dark:bg-ink/5 dark:text-ink dark:hover:bg-ink/10"
                >
                  <Package className="h-4 w-4" /> View All
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 dark:border-ink/5 dark:bg-card">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Total Orders</p>
                  <p className="mt-2 text-3xl font-black text-gray-900 dark:text-ink">{totalOrders}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 dark:border-ink/5 dark:bg-card">
                  <div className="flex items-center gap-2 text-gold-ink2">
                    <Clock3 className="h-4 w-4" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Active</p>
                  </div>
                  <p className="mt-2 text-3xl font-black text-gray-900 dark:text-ink">{activeOrders}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 dark:border-ink/5 dark:bg-card">
                  <div className="flex items-center gap-2 text-gold-ink2">
                    <CheckCircle2 className="h-4 w-4" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Delivered</p>
                  </div>
                  <p className="mt-2 text-3xl font-black text-gray-900 dark:text-ink">{deliveredOrders}</p>
                </div>
              </div>

              {latestOrder && (
                <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-5 dark:border-ink/5 dark:bg-card">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Latest Order</p>
                  <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-mono text-sm font-bold text-gray-900 dark:text-ink break-all">{latestOrder._id}</p>
                      <div className="mt-2">
                        <StatusBadge status={latestOrder.status} />
                      </div>
                    </div>
                    <Link
                      to={`/shopping/order-tracking?orderId=${latestOrder._id}`}
                      className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-gold-ink2 hover:underline"
                    >
                      Track Order <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Security */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-ink/10 dark:bg-panel">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gold-ink2">Security</h3>
                  <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">Update your password to keep your account secure.</p>
                </div>
                <button
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-card dark:text-ink dark:hover:bg-ink/5"
                >
                  <Key className="h-4 w-4 text-gold-ink2" /> {showChangePassword ? "Close" : "Change"}
                </button>
              </div>

              <AnimatePresence>
                {showChangePassword && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-6 dark:border-ink/5 dark:bg-card">
                      <CommonForm
                        formControls={changePasswordControls}
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleChangePassword}
                        buttonText={isSubmittingPassword ? "Saving..." : "Save Password"}
                        inputClass={inputClasses}
                        labelClass={labelClasses}
                        buttonClass={buttonClasses}
                        formErrors={errors}
                        buttonDisabled={isPasswordFormIncomplete || Object.keys(errors).length > 0}
                        isLoading={isSubmittingPassword}
                      />
                      <div className="mt-4">
                        <PasswordStrengthMeter password={formData.newPassword} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Logout */}
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-[#1a0f0f]">
              {!confirmLogout ? (
                <button onClick={() => setConfirmLogout(true)} className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-red-600 dark:text-red-400 transition hover:text-red-700">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <p className="text-sm font-bold text-red-800 dark:text-red-300">Are you sure you want to sign out?</p>
                  <div className="flex gap-3">
                    <button onClick={handleLogout} className="rounded bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-ink transition hover:bg-red-700">
                      Yes, Sign Out
                    </button>
                    <button onClick={() => setConfirmLogout(false)} className="rounded border border-red-300 bg-transparent px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-700 transition hover:bg-red-100 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
