import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Key, LogOut, Package, CheckCircle2, Clock3 } from "lucide-react";

import { logoutUserAction, changePasswordAction } from "@/store/auth-slice";
import { fetchWishlistAction } from "@/store/cart-slice";
import { fetchUserOrders } from "@/store/order-slice";
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
    ["pending", "verification_pending", "confirmed", "shipped"].includes(order.status)
  ).length;
  const latestOrder = userOrders[0] || null;

  const inputClasses =
    "bg-transparent border-b border-gray-700 text-white focus:border-[#D4AF37]";
  const labelClasses = "text-white";
  const buttonClasses =
    "bg-[#D4AF37] text-black font-bold uppercase py-3 rounded";
  const isPasswordFormIncomplete =
    !formData.newPassword ||
    !formData.passwordConfirm ||
    (user?.provider !== "google" && !formData.oldPassword);

  return (
    <div className="min-h-screen bg-[#060606] text-white">
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <nav className="mb-8 flex gap-2 text-xs uppercase text-gray-500">
          <Link to={homeLink}>{isAdmin ? "Dashboard" : "Home"}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#D4AF37]">Account</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-[#D4AF37]/10 bg-[#0a0a0a] p-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#D4AF37]/10 text-xl font-bold text-[#D4AF37]">
                {initials}
              </div>

              <h2 className="mt-4 font-bold">{displayName}</h2>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <p className="mt-3 text-xs text-gray-500">Member since {memberSince}</p>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-8">
            <div className="rounded-2xl border border-[#D4AF37]/10 bg-[#0a0a0a] p-6">
              <h3 className="mb-4 text-xs uppercase text-[#D4AF37]">
                Account Details
              </h3>

              <p>Email: {user?.email}</p>
              <p>Role: {user?.role}</p>
              <p>Status: {user?.isVerified ? "Verified" : "Not Verified"}</p>
              <p>Sign-in method: {user?.provider || "local"}</p>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[#D4AF37]/10 bg-[#0a0a0a] p-6">
              <div>
                <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-[#D4AF37]">
                  My Wishlist
                </h3>
                <p className="text-sm text-gray-400">
                  {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"} saved
                </p>
              </div>
              <Link
                to="/shopping/wishlist"
                className="flex items-center gap-2 rounded-full bg-white/5 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#D4AF37] hover:text-black"
              >
                View Wishlist <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-2xl border border-[#D4AF37]/10 bg-[#0a0a0a] p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xs uppercase text-[#D4AF37]">
                    Order Summary
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Quick view of your order activity. Open the full orders page for complete history.
                  </p>
                </div>
                <Link
                  to="/shopping/orders"
                  className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#D4AF37] hover:text-black"
                >
                  <Package className="h-4 w-4" />
                  View All Orders
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/5 bg-[#050505] p-5">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500">Total Orders</p>
                  <p className="mt-2 text-2xl font-bold text-white">{totalOrders}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-[#050505] p-5">
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <Clock3 className="h-4 w-4" />
                    <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500">Active Orders</p>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">{activeOrders}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-[#050505] p-5">
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <CheckCircle2 className="h-4 w-4" />
                    <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500">Delivered</p>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">{deliveredOrders}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/5 bg-[#050505] p-5">
                <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500">Latest Order</p>
                {latestOrder ? (
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-white break-all">{latestOrder._id}</p>
                      <p className="mt-1 text-sm text-gray-400">
                        Status: <StatusBadge status={latestOrder.status} />
                      </p>
                    </div>
                    <Link
                      to={`/shopping/order-tracking?orderId=${latestOrder._id}`}
                      className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] hover:text-white"
                    >
                      Track Latest Order
                    </Link>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-gray-400">No orders placed yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#D4AF37]/10 bg-[#0a0a0a] p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="mb-2 text-xs uppercase text-[#D4AF37]">
                    Change Password
                  </h3>
                  <p className="text-sm text-gray-400">
                    {user?.provider === "google"
                      ? "You can add or update a local password here. If you have never set one before, the current password field can stay empty."
                      : "Update your password here for better account security."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChangePassword((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#D4AF37] hover:text-black"
                >
                  <Key className="h-4 w-4" />
                  {showChangePassword ? "Hide" : "Open"}
                </button>
              </div>

              {showChangePassword && (
                <div className="space-y-5 rounded-2xl border border-white/5 bg-[#050505] p-5">
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
                  <PasswordStrengthMeter password={formData.newPassword} />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-red-500/20 bg-[#0a0a0a] p-6">
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
