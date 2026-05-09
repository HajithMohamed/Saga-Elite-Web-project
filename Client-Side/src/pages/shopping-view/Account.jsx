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
} from "lucide-react";

import { logoutUserAction, changePasswordAction, checkAuthAction } from "@/store/auth-slice";
import { fetchWishlistAction } from "@/store/cart-slice";
import { fetchUserOrders } from "@/store/order-slice";
import axiosInstance from "@/api/axiosInstance";

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
import { changePasswordFormControls } from "@/config";
import CommonForm from "@/components/common-components/CommonForm";
import PasswordStrengthMeter from "@/components/common-components/PasswordStrengthMeter";
import StatusBadge from "@/components/common-components/StatusBadge";
import { toast } from "@/hooks/use-toast";

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

  // Phone editor — backed by GET/PATCH /user/me. We mirror redux state here
  // because the auth slice's user object may not include phoneNumber until
  // the next checkAuth refresh; tracking it locally keeps the UI snappy.
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
        ? {
            ...control,
            placeholder: "Current password (leave blank if not set yet)",
          }
        : control
    );
  }, [user?.provider]);

  useEffect(() => {
    dispatch(fetchWishlistAction());
    dispatch(fetchUserOrders());
  }, [dispatch]);

  // Pull the current phone from the dedicated /user/me endpoint on first
  // render. Avoids any case where the cached redux user is stale (e.g.
  // login happened before the field existed in the response shape).
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
      .catch(() => {
        // Not fatal — the editor falls back to the redux user's phone, if any.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSavePhone = async () => {
    setPhoneError(null);
    if (!isValidSLPhone(phoneInput)) {
      setPhoneError(
        "Enter a valid Sri Lankan mobile (e.g. 077 123 4567)."
      );
      return;
    }
    try {
      setPhoneSaving(true);
      const res = await axiosInstance.patch("/user/me", {
        phoneNumber: phoneInput,
      });
      const updated = res?.data?.data?.phoneNumber || "";
      setPhoneOnRecord(updated);
      setPhoneInput(updated);
      setPhoneEditMode(false);
      // Refresh redux user so headers / banners update too.
      dispatch(checkAuthAction());
      toast({
        title: "Phone updated",
        description:
          "WhatsApp notifications will be sent to this number from now on.",
        variant: "success",
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not update your phone number.";
      setPhoneError(msg);
      toast({
        title: "Update failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setPhoneSaving(false);
    }
  };

  useEffect(() => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const nextErrors = {};

    if (formData.newPassword && !passwordRegex.test(formData.newPassword)) {
      nextErrors.newPassword =
        "Must be 8+ chars with uppercase, lowercase, number, and special character.";
    }

    if (
      formData.passwordConfirm &&
      formData.newPassword !== formData.passwordConfirm
    ) {
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

      toast({
        title: "Password updated",
        description: response.message || "Your password has been saved.",
        variant: "success",
      });

      setFormData({
        oldPassword: "",
        newPassword: "",
        passwordConfirm: "",
      });
      setShowChangePassword(false);
    } catch (error) {
      toast({
        title: "Password update failed",
        description: error?.message || error || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUserAction()).unwrap();
      navigate("/auth/login");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: error?.message || error || "Try again.",
        variant: "destructive",
      });
    }
  };

  const displayName = user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "-";

  const totalOrders = userOrders.length;
  const deliveredOrders = userOrders.filter((order) => order.status === "delivered").length;
  const activeOrders = userOrders.filter((order) =>
    [
      "pending",
      "pending_payment",
      "verification_pending",
      "confirmed",
      "proof_submitted",
      "processing",
      "shipped",
    ].includes(order.status)
  ).length;
  const latestOrder = userOrders[0] || null;

  const inputClasses =
    "bg-transparent border-b border-border text-on-surface focus:border-[#D4AF37]";
  const labelClasses = "text-on-surface";
  const buttonClasses =
    "bg-[#D4AF37] text-black font-bold uppercase py-3 rounded";
  const isPasswordFormIncomplete =
    !formData.newPassword ||
    !formData.passwordConfirm ||
    (user?.provider !== "google" && !formData.oldPassword);

  const quickLinks = [
    {
      to: "/shopping/orders",
      label: "Orders",
      sub: "Track and history",
      icon: Package,
    },
    {
      to: "/shopping/wishlist",
      label: "Wishlist",
      sub: `${wishlistItems.length} saved`,
      icon: Heart,
    },
    {
      to: "/shopping/product-list",
      label: "Shop",
      sub: "Browse catalog",
      icon: ShoppingBag,
    },
    {
      to: "/contact",
      label: "Contact",
      sub: "Support & hours",
      icon: Mail,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <div className="container mx-auto max-w-7xl px-4 py-10 md:px-6">
        <nav className="mb-8 flex gap-2 text-xs uppercase text-muted-foreground">
          <Link to={homeLink}>{isAdmin ? "Dashboard" : "Home"}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#D4AF37]">Account</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[#D4AF37]/10 bg-surface-container-low p-6 text-center dark:bg-[#090909]"
            >
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#D4AF37]/10 text-xl font-bold text-[#D4AF37]">
                {initials}
                {user?.provider === "google" ? (
                  <span
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-white shadow-sm"
                    title="Signed in with Google"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </span>
                ) : null}
              </div>

              <h2 className="mt-4 font-bold">{displayName}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                Member since {memberSince}
              </p>
            </motion.div>
          </div>

          <div className="space-y-6 lg:col-span-8">
            <div className="rounded-2xl border border-[#D4AF37]/10 bg-surface-container-low p-6 dark:bg-[#090909]">
              <h3 className="mb-4 text-xs uppercase text-[#D4AF37]">
                Account Details
              </h3>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  {user?.email}
                </p>
                <p>
                  <span className="text-muted-foreground">Role:</span>{" "}
                  {user?.role}
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  {user?.isVerified ? "Verified" : "Not Verified"}
                </p>
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">Sign-in:</span>
                  {user?.provider === "google" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      Google
                    </span>
                  ) : (
                    <span>Email & password</span>
                  )}
                </p>
              </div>
            </div>

            {/* Contact details — phone is editable here. Required for WhatsApp
                OTPs / order updates. Empty state nudges the user with an
                amber prompt; especially relevant for Google-OAuth signups
                where no phone was collected. */}
            <div className="rounded-2xl border border-[#D4AF37]/10 bg-surface-container-low p-6 dark:bg-[#090909]">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-xs uppercase text-[#D4AF37]">
                  <Phone className="h-3.5 w-3.5" /> Contact Details
                </h3>
                {!phoneEditMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneInput(phoneOnRecord || "");
                      setPhoneError(null);
                      setPhoneEditMode(true);
                    }}
                    className="text-xs uppercase tracking-wider text-[#D4AF37] hover:text-[#D4AF37]/80"
                  >
                    {phoneOnRecord ? "Edit" : "Add"}
                  </button>
                )}
              </div>

              {!phoneOnRecord && !phoneEditMode ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                  <p className="font-semibold">
                    Add your mobile number to enable WhatsApp.
                  </p>
                  <p className="mt-1 text-amber-200/80">
                    We use it for OTPs, order confirmations, and shipping
                    updates. We don't share your number — ever.
                  </p>
                </div>
              ) : null}

              {phoneEditMode ? (
                <div className="space-y-3">
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                    Mobile number
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value);
                      if (phoneError) setPhoneError(null);
                    }}
                    placeholder="077 123 4567"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none"
                  />
                  {phoneError ? (
                    <p className="text-xs text-rose-400">{phoneError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Sri Lankan mobile only — formats: 077 123 4567 or
                      +94 77 123 4567.
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSavePhone}
                      disabled={phoneSaving}
                      className="rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition-opacity disabled:opacity-60"
                    >
                      {phoneSaving ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneEditMode(false);
                        setPhoneInput(phoneOnRecord || "");
                        setPhoneError(null);
                      }}
                      disabled={phoneSaving}
                      className="rounded-lg border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : phoneOnRecord ? (
                <p className="text-sm">
                  <span className="text-muted-foreground">Mobile:</span>{" "}
                  <span className="font-mono">{phoneOnRecord}</span>
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {quickLinks.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={link.to}
                    className="group flex items-start gap-4 rounded-2xl border border-border bg-surface-container-low p-5 transition-all hover:border-[#D4AF37]/40 hover:shadow-[0_8px_30px_rgba(212,175,55,0.08)] dark:bg-[#090909]"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] transition-colors group-hover:bg-[#D4AF37]/20">
                      <link.icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="font-semibold">{link.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {link.sub}
                      </span>
                    </span>
                    <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[#D4AF37]/10 bg-surface-container-low p-6 dark:bg-[#090909]">
              <div>
                <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-[#D4AF37]">
                  My Wishlist
                </h3>
                <p className="text-sm text-muted-foreground">
                  {wishlistItems.length}{" "}
                  {wishlistItems.length === 1 ? "item" : "items"} saved
                </p>
              </div>
              <Link
                to="/shopping/wishlist"
                className="flex items-center gap-2 rounded-full bg-muted px-6 py-2 text-sm font-semibold transition-colors hover:bg-[#D4AF37] hover:text-black dark:bg-white/5 dark:text-white"
              >
                View Wishlist <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-2xl border border-[#D4AF37]/10 bg-surface-container-low p-6 dark:bg-[#090909]">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xs uppercase text-[#D4AF37]">
                    Order Summary
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Quick view of your order activity. Open the full orders page
                    for complete history.
                  </p>
                </div>
                <Link
                  to="/shopping/orders"
                  className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-[#D4AF37] hover:text-black dark:bg-white/5 dark:text-white"
                >
                  <Package className="h-4 w-4" />
                  View All Orders
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-muted/40 p-5 dark:bg-[#050505]">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    Total Orders
                  </p>
                  <p className="mt-2 text-2xl font-bold">{totalOrders}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/40 p-5 dark:bg-[#050505]">
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <Clock3 className="h-4 w-4" />
                    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                      Active Orders
                    </p>
                  </div>
                  <p className="mt-2 text-2xl font-bold">{activeOrders}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/40 p-5 dark:bg-[#050505]">
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <CheckCircle2 className="h-4 w-4" />
                    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                      Delivered
                    </p>
                  </div>
                  <p className="mt-2 text-2xl font-bold">{deliveredOrders}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-border bg-muted/40 p-5 dark:bg-[#050505]">
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Latest Order
                </p>
                {latestOrder ? (
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium break-all">{latestOrder._id}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        Status: <StatusBadge status={latestOrder.status} />
                      </p>
                    </div>
                    <Link
                      to={`/shopping/order-tracking?orderId=${latestOrder._id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-[#D4AF37] hover:underline"
                    >
                      Track Latest Order
                    </Link>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No orders placed yet.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#D4AF37]/10 bg-surface-container-low p-6 dark:bg-[#090909]">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="mb-2 text-xs uppercase text-[#D4AF37]">
                    Change Password
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {user?.provider === "google"
                      ? "You can add or update a local password here. If you have never set one before, the current password field can stay empty."
                      : "Update your password here for better account security."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChangePassword((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-[#D4AF37] hover:text-black dark:bg-white/5 dark:text-white"
                >
                  <Key className="h-4 w-4" />
                  {showChangePassword ? "Hide" : "Open"}
                </button>
              </div>

              <AnimatePresence initial={false}>
                {showChangePassword ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-5 rounded-2xl border border-border bg-muted/30 p-5 dark:bg-[#050505]">
                      <CommonForm
                        formControls={changePasswordControls}
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleChangePassword}
                        buttonText={
                          isSubmittingPassword ? "Saving..." : "Save Password"
                        }
                        inputClass={inputClasses}
                        labelClass={labelClasses}
                        buttonClass={buttonClasses}
                        formErrors={errors}
                        buttonDisabled={
                          isPasswordFormIncomplete ||
                          Object.keys(errors).length > 0
                        }
                        isLoading={isSubmittingPassword}
                      />
                      <PasswordStrengthMeter password={formData.newPassword} />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="rounded-2xl border border-red-500/20 bg-surface-container-low p-6 dark:bg-[#090909]">
              {!confirmLogout ? (
                <button
                  onClick={() => setConfirmLogout(true)}
                  className="inline-flex items-center gap-2 text-xs uppercase text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmLogout(false)}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400"
                  >
                    Confirm
                  </button>
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
