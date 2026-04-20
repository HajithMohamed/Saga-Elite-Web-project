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
import { fetchUserOrders } from "@/store/order-slice";

import { changePasswordFormControls } from "@/config";
import CommonForm from "@/components/common-components/CommonForm";
import { toast } from "@/hooks/use-toast";
import PasswordStrengthMeter from "@/components/common-components/PasswordStrengthMeter";

const Account = () => {
  const { user } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.cart.wishlist);
  const { userOrders, isLoading: orderLoading } = useSelector((state) => state.order);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const homeLink = isAdmin ? "/admin/dashboard" : "/shopping/home";

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
    dispatch(fetchUserOrders());
  }, [dispatch]);

  useEffect(() => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const newErrors = {};

    if (formData.newPassword && !passwordRegex.test(formData.newPassword)) {
      newErrors.newPassword =
        "Must be 8+ chars with uppercase, lowercase, number, and special character.";
    }

    if (
      formData.passwordConfirm &&
      formData.newPassword !== formData.passwordConfirm
    ) {
      newErrors.passwordConfirm = "Passwords do not match.";
    }

    setErrors(newErrors);
  }, [formData]);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (Object.keys(errors).length > 0) return;

    setIsLoading(true);
    try {
      const res = await dispatch(changePasswordAction(formData)).unwrap();

      toast({
        title: "Success",
        description: res.message || "Password updated",
        variant: "success",
      });

      setFormData({ oldPassword: "", newPassword: "", passwordConfirm: "" });
      setShowChangePassword(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err?.message || "Password change failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUserAction()).unwrap();
      navigate("/auth/login");
    } catch (err) {
      toast({
        title: "Logout failed",
        description: err?.message || "Try again",
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
    : "—";

  const inputClasses =
    "bg-transparent border-b border-gray-700 text-white focus:border-[#D4AF37]";
  const labelClasses = "text-white";
  const buttonClasses =
    "bg-[#D4AF37] text-black font-bold uppercase py-2 rounded";

  return (
    <div className="min-h-screen bg-[#060606] text-white">
      <div className="container mx-auto max-w-5xl px-4 py-10">

        {/* breadcrumb */}
        <nav className="flex gap-2 text-xs text-gray-500 mb-8 uppercase">
          <Link to={homeLink}>{isAdmin ? "Dashboard" : "Home"}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#D4AF37]">Account</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT PROFILE */}
          <div className="lg:col-span-4">
            <div className="bg-[#0a0a0a] border border-[#D4AF37]/10 rounded-2xl p-6 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] font-bold text-xl">
                {initials}
              </div>

              <h2 className="mt-4 font-bold">{displayName}</h2>
              <p className="text-sm text-gray-400">{user?.email}</p>

              <p className="mt-3 text-xs text-gray-500">
                Member since {memberSince}
              </p>
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="lg:col-span-8 space-y-6">

            {/* ACCOUNT INFO */}
            <div className="bg-[#0a0a0a] border border-[#D4AF37]/10 rounded-2xl p-6">
              <h3 className="text-[#D4AF37] uppercase text-xs mb-4">
                Account Details
              </h3>

              <p>Email: {user?.email}</p>
              <p>Role: {user?.role}</p>
              <p>Status: {user?.isVerified ? "Verified" : "Not Verified"}</p>
            </div>

            {/* WISHLIST */}
            <div className="bg-[#0a0a0a] border border-[#D4AF37]/10 rounded-2xl p-6">
              <h3 className="text-[#D4AF37] uppercase text-xs mb-4">
                Wishlist
              </h3>

              {wishlistItems.length === 0 ? (
                <p className="text-gray-400">No items in wishlist</p>
              ) : (
                wishlistItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between border-b border-gray-800 py-2"
                  >
                    <span>{item.name}</span>
                    <button
                      onClick={() =>
                        dispatch(removeFromWishlistAction(item.id))
                      }
                      className="text-red-400 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* ORDERS */}
            <div className="bg-[#0a0a0a] border border-[#D4AF37]/10 rounded-2xl p-6">
              <h3 className="text-[#D4AF37] uppercase text-xs mb-4">
                Orders
              </h3>

              {orderLoading ? (
                <p>Loading...</p>
              ) : userOrders.length === 0 ? (
                <p className="text-gray-400">No orders yet</p>
              ) : (
                userOrders.map((order) => (
                  <div key={order._id} className="border-b border-gray-800 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="font-medium">Order: <span className="text-[#D4AF37]">{order._id}</span></p>
                        <p className="text-sm text-gray-400">Status: {order.status}</p>
                      </div>
                      <Link
                        to="/shopping/order-tracking"
                        state={{ orderId: order._id }}
                        className="text-[#D4AF37] text-xs uppercase tracking-widest font-bold hover:text-white"
                      >
                        Track Order
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* LOGOUT */}
            <div className="bg-[#0a0a0a] border border-red-500/20 rounded-2xl p-6">
              {!confirmLogout ? (
                <button
                  onClick={() => setConfirmLogout(true)}
                  className="text-red-400 uppercase text-xs"
                >
                  Sign Out
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setConfirmLogout(false)}>
                    Cancel
                  </button>
                  <button onClick={handleLogout} className="text-red-500">
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