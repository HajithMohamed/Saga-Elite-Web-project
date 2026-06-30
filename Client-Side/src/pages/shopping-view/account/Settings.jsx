import React, { useState } from "react";
import { Settings2, Globe, BellRing, Trash2, Check, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  const [preferences, setPreferences] = useState({
    language: "english",
    currency: "lkr",
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
  });

  const handleToggle = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    toast({ title: "Preference updated", variant: "success" });
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      <div>
         <h1 className="font-sans text-2xl font-bold text-[#fafafa] mb-1">Account Settings</h1>
         <p className="se-body text-[14px] text-[#99907c]">Manage your preferences, notifications, and language settings.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
         {/* ── PREFERENCES ── */}
         <div className="bg-[#1A1A1A] border border-white/5 rounded-[24px] p-6 md:p-8 h-max">
            <h2 className="font-sans font-bold text-[18px] text-[#fafafa] mb-6 flex items-center gap-3">
               <Globe className="w-5 h-5 text-[#99907c]" /> Regional Preferences
            </h2>
            
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#99907c]">Language</label>
                  <select 
                    value={preferences.language}
                    onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                    className="w-full h-[52px] bg-[#131313] border border-white/10 rounded-[12px] px-4 text-[#fafafa] focus:border-[#F2CA50] focus:outline-none transition-colors appearance-none"
                  >
                    <option value="english">English</option>
                  </select>
               </div>
               
               <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#99907c]">Currency</label>
                  <select 
                    value={preferences.currency}
                    onChange={(e) => setPreferences({...preferences, currency: e.target.value})}
                    className="w-full h-[52px] bg-[#131313] border border-white/10 rounded-[12px] px-4 text-[#fafafa] focus:border-[#F2CA50] focus:outline-none transition-colors appearance-none"
                  >
                    <option value="lkr">LKR - Sri Lankan Rupee</option>
                  </select>
               </div>
            </div>
         </div>

         {/* ── NOTIFICATIONS ── */}
         <div className="bg-[#1A1A1A] border border-white/5 rounded-[24px] p-6 md:p-8 h-max">
            <h2 className="font-sans font-bold text-[18px] text-[#fafafa] mb-6 flex items-center gap-3">
               <BellRing className="w-5 h-5 text-[#99907c]" /> Notification Settings
            </h2>
            
            <div className="space-y-6">
               {[
                 { key: "emailNotifications", label: "Email Notifications", desc: "Receive order updates and exclusive drops via email." },
                 { key: "smsNotifications", label: "SMS Alerts", desc: "Get real-time delivery tracking via SMS." },
                 { key: "pushNotifications", label: "Push Notifications", desc: "Browser notifications for immediate updates." },
               ].map((item) => (
                 <div key={item.key} className="flex items-center justify-between gap-4">
                    <div>
                       <h4 className="text-[14px] font-bold text-[#fafafa] mb-1">{item.label}</h4>
                       <p className="text-[12px] text-[#99907c]">{item.desc}</p>
                    </div>
                    <button 
                      onClick={() => handleToggle(item.key)}
                      className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${preferences[item.key] ? 'bg-[#F2CA50]' : 'bg-white/10'}`}
                    >
                       <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${preferences[item.key] ? 'translate-x-7 bg-[#0e0e0e]' : 'translate-x-1'}`} />
                    </button>
                 </div>
               ))}
            </div>
         </div>

         {/* ── DANGER ZONE ── */}
         <div className="lg:col-span-2 bg-red-500/5 border border-red-500/20 rounded-[24px] p-6 md:p-8 mt-4">
            <h2 className="font-sans font-bold text-[18px] text-red-400 mb-2 flex items-center gap-3">
               <AlertTriangle className="w-5 h-5" /> Danger Zone
            </h2>
            <p className="text-[13px] text-[#99907c] mb-6 max-w-2xl">
               Permanently delete your account and all associated data. This action cannot be undone and you will lose access to your order history and wishlist.
            </p>
            <button 
              onClick={() => {
                if(window.confirm("Are you absolutely sure you want to delete your account? This action is irreversible.")) {
                  toast({ title: "Account deletion requested", description: "Support will contact you shortly to confirm.", variant: "destructive" })
                }
              }}
              className="h-[48px] px-6 bg-red-500/10 text-red-400 border border-red-500/20 rounded-[12px] font-sans font-bold uppercase tracking-wider text-[11px] hover:bg-red-500/20 transition-colors flex items-center gap-2"
            >
               <Trash2 className="w-4 h-4" /> Delete Account
            </button>
         </div>
      </div>
    </div>
  );
};

export default Settings;
