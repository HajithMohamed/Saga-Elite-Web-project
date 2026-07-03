import React, { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Key, LogOut, Shield, Mail, Calendar, Phone, ShieldCheck } from "lucide-react";
import { logoutUserAction, changePasswordAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import { changePasswordFormControls } from "@/config";
import CommonForm from "@/components/common-components/CommonForm";
import PasswordStrengthMeter from "@/components/common-components/PasswordStrengthMeter";

const AdminAccount = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    passwordConfirm: "",
  });

  const changePasswordControls = useMemo(() => {
    return changePasswordFormControls;
  }, []);

  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (formData.newPassword !== formData.passwordConfirm) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const response = await dispatch(changePasswordAction(formData)).unwrap();
      toast({
        title: "Password updated",
        description: response.message || "Your password has been saved.",
        variant: "success",
      });
      setFormData({ oldPassword: "", newPassword: "", passwordConfirm: "" });
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

  const displayName = user?.email?.split("@")[0] || "Admin";
  const initials = displayName.slice(0, 2).toUpperCase();
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "-";

  const isPasswordFormIncomplete = !formData.oldPassword || !formData.newPassword || !formData.passwordConfirm;
  const inputClasses = "bg-transparent border-b border-line text-ink-2 focus:border-gold-ink";
  const labelClasses = "text-muted";
  const buttonClasses = "bg-gold text-black font-bold uppercase py-3 rounded";

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="font-sans text-2xl font-bold uppercase tracking-wider text-ink">Admin Profile</h1>
        <p className="mt-1 text-sm text-muted">Manage your account details and security settings.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-1 rounded-2xl border border-line/60 bg-panel p-6 text-center"
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gold/10 text-3xl font-bold text-gold-ink">
            {initials}
          </div>
          <h2 className="mt-4 text-xl font-bold text-ink">{displayName}</h2>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold-ink">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="uppercase tracking-wider">{user?.role}</span>
          </div>
        </motion.div>

        {/* Details & Security */}
        <div className="col-span-1 lg:col-span-2 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-line/60 bg-panel p-6"
          >
            <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-gold-ink">Profile Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 border-b border-line/30 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-page">
                  <Mail className="h-4 w-4 text-muted" />
                </div>
                <div>
                  <p className="text-xs uppercase text-muted">Email Address</p>
                  <p className="text-sm font-medium text-ink">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 border-b border-line/30 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-page">
                  <Phone className="h-4 w-4 text-muted" />
                </div>
                <div>
                  <p className="text-xs uppercase text-muted">Phone Number</p>
                  <p className="text-sm font-medium text-ink">{user?.phoneNumber || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-page">
                  <Calendar className="h-4 w-4 text-muted" />
                </div>
                <div>
                  <p className="text-xs uppercase text-muted">Member Since</p>
                  <p className="text-sm font-medium text-ink">{memberSince}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-line/60 bg-panel p-6"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gold-ink">Security</h3>
                <p className="mt-1 text-xs text-muted">Update your administrator password.</p>
              </div>
              <button
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-page px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink-2 transition-colors hover:border-gold-ink hover:text-gold-ink"
              >
                <Key className="h-3.5 w-3.5" />
                {showChangePassword ? "Close" : "Change"}
              </button>
            </div>

            <AnimatePresence>
              {showChangePassword && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-5 rounded-xl bg-page p-5">
                    <CommonForm
                      formControls={changePasswordControls}
                      formData={formData}
                      setFormData={setFormData}
                      onSubmit={handleChangePassword}
                      buttonText={isSubmittingPassword ? "Saving..." : "Save Password"}
                      inputClass={inputClasses}
                      labelClass={labelClasses}
                      buttonClass={buttonClasses}
                      buttonDisabled={isPasswordFormIncomplete}
                      isLoading={isSubmittingPassword}
                    />
                    <PasswordStrengthMeter password={formData.newPassword} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminAccount;
