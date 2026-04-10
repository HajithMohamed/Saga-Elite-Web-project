import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Shield,
  Key,
  LogOut,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Crown,
  Calendar,
} from "lucide-react";
import { logoutUserAction, changePasswordAction } from "@/store/auth-slice";
import { fetchWishlistAction, removeFromWishlistAction } from "@/store/cart-slice";
import { changePasswordFormControls } from "@/config";
import CommonForm from "@/components/common-components/CommonForm";
import { toast } from "@/hooks/use-toast";
import PasswordStrengthMeter from "@/components/common-components/PasswordStrengthMeter";

/* ─────────────────────────── main component ─────────────────────────────── */
const Account = () => {
  const { user } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.cart.wishlist);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const homeLink = isAdmin ? "/admin/dashboard" : "/shopping/home";

  /* ── change-password form state ── */
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchWishlistAction());
  }, [dispatch]);

  useEffect(() => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const newErrors = {};
    if (formData.newPassword && !passwordRegex.test(formData.newPassword)) {
      newErrors.newPassword =
        "Must be 8+ chars with uppercase, lowercase, number, and special character (@$!%*?&).";
    }
    if (
      formData.passwordConfirm &&
      formData.newPassword !== formData.passwordConfirm
    ) {
      newErrors.passwordConfirm = "Passwords do not match.";
    }
    setErrors(newErrors);
  }, [formData]);

  /* ── handlers ── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Invalid form",
        description: "Fix the errors above before submitting.",
        variant: "destructive",
      });
      return;
    }
    if (
      !formData.oldPassword ||
      !formData.newPassword ||
      !formData.passwordConfirm
    ) {
      toast({
        title: "All fields required",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await dispatch(changePasswordAction(formData)).unwrap();
      toast({
        title: "Password updated",
        description: response.message || "Your password has been changed.",
        variant: "success",
      });
      setFormData({ oldPassword: "", newPassword: "", passwordConfirm: "" });
      setShowChangePassword(false);
    } catch (err) {
      const msg =
        typeof err === "string" ? err : err?.message || "Password change failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUserAction()).unwrap();
      toast({
        title: "Signed out",
        description: "See you next time.",
        variant: "success",
      });
      navigate("/auth/login");
    } catch (err) {
      toast({
        title: "Logout failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  /* ── shared form styles ── */
  const inputClasses =
    "bg-transparent border-b border-gray-700 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:ring-0 font-sans";
  const labelClasses = "text-white";
  const buttonClasses =
    "bg-[#D4AF37] text-black font-bold uppercase tracking-wide py-2 rounded shadow w-full";

  /* ── derived display values ── */
  const displayName = user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "—";

  /* ──────────────────────────── JSX ──────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#060606] text-white">
      {/* subtle top accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />

      <div className="container mx-auto max-w-5xl px-4 md:px-8 py-10 md:py-16">
        {/* ── breadcrumb ── */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-10 tracking-widest uppercase">
          <Link to={homeLink} className="hover:text-[#D4AF37] transition-colors">
            {isAdmin ? "Dashboard" : "Home"}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#D4AF37]">Account</span>
        </nav>

        {/* ── two-column grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT — profile card */}
          <div className="lg:col-span-4">
            <div className="relative bg-[#0a0a0a] border border-[#D4AF37]/10 rounded-2xl overflow-hidden">
              {/* decorative header strip */}
              <div className="h-24 bg-gradient-to-br from-[#D4AF37]/15 via-[#D4AF37]/5 to-transparent" />

              <div className="px-6 pb-8 -mt-12 flex flex-col items-center text-center">
                {/* avatar */}
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-[#0a0a0a] ring-2 ring-[#D4AF37]/30 shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#D4AF37]/10 border-4 border-[#0a0a0a] ring-2 ring-[#D4AF37]/30 flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-[#D4AF37] tracking-wider select-none">
                      {initials}
                    </span>
                  </div>
                )}

                <h2 className="mt-4 text-lg font-bold tracking-wide">
                  {displayName}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>

                {/* role badge */}
                <span
                  className={`mt-3 inline-flex items-center gap-1.5 text-[10px] px-3 py-1 rounded-full border font-bold tracking-widest uppercase ${
                    isAdmin
                      ? "border-[#D4AF37]/50 text-[#D4AF37] bg-[#D4AF37]/5"
                      : "border-gray-700 text-gray-400 bg-white/[0.02]"
                  }`}
                >
                  {isAdmin && <Crown className="w-3 h-3" />}
                  {user?.role || "user"}
                </span>

                {/* member since */}
                <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  Member since {memberSince}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — details + actions */}
          <div className="lg:col-span-8 space-y-6">
            {/* ── details card ── */}
            <div className="bg-[#0a0a0a] border border-[#D4AF37]/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#D4AF37]/10">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                  Account Details
                </h3>
              </div>

              <div className="divide-y divide-[#D4AF37]/5">
                {/* email */}
                <div className="flex items-center gap-4 px-6 py-5">
                  <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/5 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.15em]">
                      Email Address
                    </p>
                    <p className="text-sm text-white mt-0.5 truncate">
                      {user?.email || "—"}
                    </p>
                  </div>
                </div>

                {/* sign-in method */}
                <div className="flex items-center gap-4 px-6 py-5">
                  <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/5 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.15em]">
                      Sign-in Method
                    </p>
                    <p className="text-sm text-white mt-0.5 capitalize flex items-center gap-2">
                      {user?.provider === "google" ? (
                        <>
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
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
                          Google
                        </>
                      ) : (
                        <>
                          <Key className="w-3.5 h-3.5 text-gray-400" />
                          Email & Password
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* account status */}
                <div className="flex items-center gap-4 px-6 py-5">
                  <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/5 flex items-center justify-center shrink-0">
                    {user?.isVerified ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.15em]">
                      Account Status
                    </p>
                    <p
                      className={`text-sm mt-0.5 font-medium ${
                        user?.isVerified ? "text-green-400" : "text-yellow-400"
                      }`}
                    >
                      {user?.isVerified ? "Verified" : "Not Verified"}
                    </p>
                  </div>
                </div>

                {/* role */}
                <div className="flex items-center gap-4 px-6 py-5">
                  <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/5 flex items-center justify-center shrink-0">
                    <Crown className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.15em]">
                      Role
                    </p>
                    <p className="text-sm text-white mt-0.5 capitalize">
                      {user?.role || "user"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── wishlist summary ── */}
            <div className="bg-[#0a0a0a] border border-[#D4AF37]/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-[#D4AF37]/10">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                  My Wishlist
                </h3>
                <p className="text-sm text-gray-400 mt-2">
                  Saved items you want to revisit later.
                </p>
              </div>
              <div className="px-6 py-6">
                {wishlistItems.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No saved products yet. Add items to your wishlist from the shop.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {wishlistItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-neutral-800 bg-[#111] p-4"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={item.image || "/LOGO.png"}
                            alt={item.name}
                            className="h-16 w-16 rounded-2xl object-cover"
                          />
                          <div>
                            <p className="text-sm font-bold text-white uppercase tracking-[0.05em]">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{item.brand}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm text-[#D4AF37] font-bold">
                            LKR {Math.round(item.basePrice * (1 - (item.discountPercent || 0) / 100)).toLocaleString()}
                          </p>
                          <button
                            type="button"
                            onClick={() => dispatch(removeFromWishlistAction(item.id))}
                            className="text-xs uppercase tracking-[0.2em] text-gray-300 hover:text-[#D4AF37]"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── security: change password (local accounts only) ── */}
            {user?.provider === "local" && (
              <div className="bg-[#0a0a0a] border border-[#D4AF37]/10 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/5 flex items-center justify-center shrink-0 group-hover:bg-[#D4AF37]/10 transition-colors">
                      <Key className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                        Security
                      </h3>
                      <p className="text-sm text-gray-400 mt-0.5">
                        Change your password
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                      showChangePassword ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {showChangePassword && (
                  <div className="px-6 pb-6 border-t border-[#D4AF37]/10 pt-5 space-y-5">
                    {/* password strength meter */}
                    <PasswordStrengthMeter password={formData.newPassword} />

                    <CommonForm
                      formControls={changePasswordFormControls}
                      formData={formData}
                      setFormData={setFormData}
                      formErrors={errors}
                      onSubmit={handleChangePassword}
                      buttonText="Update Password"
                      isLoading={isLoading}
                      inputClass={inputClasses}
                      labelClass={labelClasses}
                      buttonClass={buttonClasses}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── danger zone: sign out ── */}
            <div className="bg-[#0a0a0a] border border-red-500/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-red-500/5 flex items-center justify-center shrink-0">
                    <LogOut className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
                      Sign Out
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      End your current session
                    </p>
                  </div>
                </div>

                {!confirmLogout ? (
                  <button
                    onClick={() => setConfirmLogout(true)}
                    className="text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Sign Out
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmLogout(false)}
                      className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLogout}
                      className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* bottom decorative line */}
        <div className="mt-16 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
        <p className="text-center text-[10px] text-gray-600 tracking-[0.2em] uppercase mt-4">
          Saga Elite &mdash; Rare Fit Forever
        </p>
      </div>
    </div>
  );
};

export default Account;