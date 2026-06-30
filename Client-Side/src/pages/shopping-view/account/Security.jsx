import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Shield, Key, Mail, Smartphone, Monitor, CheckCircle2, AlertTriangle } from "lucide-react";
import { changePasswordAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";

const Security = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) return;
    setIsSubmitting(true);
    try {
      const response = await dispatch(changePasswordAction(formData)).unwrap();
      toast({ title: "Password updated", description: response.message || "Your password has been successfully changed.", variant: "success" });
      setFormData({ oldPassword: "", newPassword: "", passwordConfirm: "" });
    } catch (error) {
      toast({ title: "Password update failed", description: error?.message || error || "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateStrength = (pwd) => {
    let score = 0;
    if (pwd.length > 7) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[@$!%*?&]/.test(pwd)) score++;
    return score;
  };
  const strength = calculateStrength(formData.newPassword);
  const strengthColor = strength < 2 ? "bg-red-500" : strength < 4 ? "bg-orange-400" : "bg-emerald-400";
  const strengthText = strength < 2 ? "Weak" : strength < 4 ? "Fair" : "Strong";

  return (
    <div className="space-y-8 pb-12 font-sans">
      <div>
         <h1 className="font-sans text-2xl font-bold text-[#fafafa] mb-1">Security</h1>
         <p className="se-body text-[14px] text-[#99907c]">Manage your password, verification, and active sessions.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-8">
         
         {/* ── CHANGE PASSWORD ── */}
         <div className="space-y-6">
            <div className="bg-[#1A1A1A] border border-white/5 rounded-[24px] p-6 md:p-8">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                     <Key className="w-5 h-5 text-[#99907c]" />
                  </div>
                  <h2 className="font-sans font-bold text-[18px] text-[#fafafa]">Change Password</h2>
               </div>

               {user?.provider === "google" && (
                 <div className="bg-[#F2CA50]/5 border border-[#F2CA50]/20 rounded-[12px] p-4 mb-6">
                    <p className="text-[13px] text-[#F2CA50]">You signed in with Google. You only need to set a new password if you want to log in with email directly.</p>
                 </div>
               )}

               <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase tracking-widest text-[#99907c]">Current Password</label>
                     <input 
                       type="password" 
                       value={formData.oldPassword}
                       onChange={e => setFormData({...formData, oldPassword: e.target.value})}
                       placeholder={user?.provider === "google" ? "Leave blank if not set" : ""}
                       className="w-full h-[52px] bg-[#131313] border border-white/10 rounded-[12px] px-4 text-[#fafafa] focus:border-[#F2CA50] focus:outline-none transition-colors"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase tracking-widest text-[#99907c]">New Password</label>
                     <input 
                       type="password" 
                       value={formData.newPassword}
                       onChange={e => setFormData({...formData, newPassword: e.target.value})}
                       className="w-full h-[52px] bg-[#131313] border border-white/10 rounded-[12px] px-4 text-[#fafafa] focus:border-[#F2CA50] focus:outline-none transition-colors"
                     />
                     {formData.newPassword && (
                        <div className="mt-2">
                           <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-[#99907c]">Password Strength</span>
                              <span className={strengthColor.replace('bg-', 'text-')}>{strengthText}</span>
                           </div>
                           <div className="flex gap-1 h-1.5 w-full">
                              {[1, 2, 3, 4].map(idx => (
                                 <div key={idx} className={`flex-1 rounded-full ${idx <= strength ? strengthColor : 'bg-white/10'}`} />
                              ))}
                           </div>
                        </div>
                     )}
                     {errors.newPassword && <p className="text-[11px] text-red-400 mt-1">{errors.newPassword}</p>}
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase tracking-widest text-[#99907c]">Confirm New Password</label>
                     <input 
                       type="password" 
                       value={formData.passwordConfirm}
                       onChange={e => setFormData({...formData, passwordConfirm: e.target.value})}
                       className="w-full h-[52px] bg-[#131313] border border-white/10 rounded-[12px] px-4 text-[#fafafa] focus:border-[#F2CA50] focus:outline-none transition-colors"
                     />
                     {errors.passwordConfirm && <p className="text-[11px] text-red-400 mt-1">{errors.passwordConfirm}</p>}
                  </div>
                  
                  <button 
                     type="submit"
                     disabled={isSubmitting || Object.keys(errors).length > 0 || !formData.newPassword || !formData.passwordConfirm}
                     className="mt-4 h-[52px] w-full sm:w-auto px-8 bg-[#F2CA50] text-[#0e0e0e] rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px] hover:-translate-y-1 transition-transform disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                     {isSubmitting ? "Updating..." : "Update Password"}
                  </button>
               </form>
            </div>
         </div>

         {/* ── SIDE COLUMN (Verification & Sessions) ── */}
         <div className="space-y-6">
            
            {/* Email Verification */}
            <div className="bg-[#1A1A1A] border border-white/5 rounded-[24px] p-6">
               <h3 className="font-sans font-bold text-[16px] text-[#fafafa] mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#F2CA50]" /> Account Status
               </h3>
               
               <div className="flex items-start gap-4 pb-4 border-b border-white/5">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                     <Mail className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                     <h4 className="text-[13px] font-bold text-[#fafafa] mb-1">Email Verified</h4>
                     <p className="text-[11px] text-[#99907c]">{user?.email}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto mt-1 shrink-0" />
               </div>

               <div className="flex items-start gap-4 pt-4">
                  <div className="w-10 h-10 rounded-full bg-[#131313] border border-white/5 flex items-center justify-center shrink-0">
                     <Smartphone className="w-5 h-5 text-[#99907c]" />
                  </div>
                  <div>
                     <h4 className="text-[13px] font-bold text-[#fafafa] mb-1">Two-Factor Auth</h4>
                     <p className="text-[11px] text-[#99907c]">Not enabled</p>
                  </div>
                  <button onClick={() => toast({ title: "Coming soon", description: "2FA will be available in a future update." })} className="text-[10px] font-bold uppercase tracking-widest text-[#F2CA50] ml-auto mt-1 shrink-0 hover:underline">
                     Enable
                  </button>
               </div>
            </div>

            {/* Active Devices */}
            <div className="bg-[#1A1A1A] border border-white/5 rounded-[24px] p-6">
               <h3 className="font-sans font-bold text-[16px] text-[#fafafa] mb-4 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-[#F2CA50]" /> Active Devices
               </h3>
               
               <div className="space-y-4">
                  <div className="flex items-start gap-3">
                     <div className="w-8 h-8 rounded-full bg-[#F2CA50]/10 flex items-center justify-center shrink-0">
                        <Monitor className="w-4 h-4 text-[#F2CA50]" />
                     </div>
                     <div>
                        <h4 className="text-[13px] font-bold text-[#fafafa]">Windows PC (Current)</h4>
                        <p className="text-[11px] text-[#99907c]">Chrome • Colombo, LK</p>
                     </div>
                  </div>
               </div>
               
               <button onClick={() => toast({ title: "Coming soon" })} className="mt-6 w-full h-[40px] border border-white/10 rounded-[12px] text-[11px] font-bold uppercase tracking-wider text-[#fafafa] hover:border-red-500/30 hover:text-red-400 transition-colors">
                  Log out all devices
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Security;
