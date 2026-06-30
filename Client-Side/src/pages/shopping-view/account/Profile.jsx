import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Camera, User, Phone, Mail, Calendar, Check, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import axiosInstance from "@/api/axiosInstance";
import { checkAuthAction } from "@/store/auth-slice";

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    gender: "",
    birthday: ""
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || user.userName?.split(" ")[0] || "",
        lastName: user.lastName || user.userName?.split(" ").slice(1).join(" ") || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        gender: user.gender || "",
        birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : ""
      });
    }
  }, [user]);

  // Calculate profile completion
  const fields = ['firstName', 'lastName', 'email', 'phoneNumber', 'gender', 'birthday'];
  const completedFields = fields.filter(f => formData[f] && formData[f].trim() !== "").length;
  const completionPercentage = Math.round((completedFields / fields.length) * 100);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axiosInstance.patch("/user/me", formData);
      await dispatch(checkAuthAction());
      toast({ title: "Profile updated successfully", variant: "success" });
      setIsEditing(false);
    } catch (err) {
      toast({ title: "Update failed", description: err?.response?.data?.message || "Could not update profile", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = () => {
    // Mock upload since API might not support it yet
    toast({ title: "Photo selected", description: "Profile photo upload will be available soon." });
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      
      {/* ── HEADER CARD ── */}
      <div className="bg-[#1A1A1A] border border-white/5 rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-[#F2CA50]/5 rounded-full blur-[80px] pointer-events-none" />
         
         {/* Profile Photo */}
         <div className="relative group shrink-0">
            <div className="w-[100px] h-[100px] md:w-[140px] md:h-[140px] rounded-full bg-[#131313] border border-white/10 flex items-center justify-center overflow-hidden">
               {user?.photoUrl ? (
                 <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <User className="w-12 h-12 text-[#99907c]" />
               )}
            </div>
            <button 
              onClick={handlePhotoUpload}
              className="absolute bottom-0 right-0 md:bottom-2 md:right-2 w-10 h-10 rounded-full bg-[#F2CA50] text-[#0e0e0e] flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
               <Camera className="w-5 h-5" />
            </button>
         </div>

         <div className="flex-1 text-center md:text-left z-10">
            <h1 className="se-serif text-3xl text-[#fafafa] mb-1">{formData.firstName} {formData.lastName}</h1>
            <p className="se-body text-[#99907c] text-[14px]">Member since {new Date(user?.createdAt || Date.now()).getFullYear()}</p>
            
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="mt-6 h-[48px] px-8 bg-[#131313] border border-white/10 rounded-[12px] text-[11px] font-bold uppercase tracking-wider text-[#fafafa] hover:border-[#F2CA50] transition-colors"
              >
                Edit Profile
              </button>
            )}
         </div>

         {/* Completion Ring */}
         <div className="shrink-0 flex flex-col items-center z-10">
            <div className="relative w-24 h-24 flex items-center justify-center mb-2">
               <svg className="w-full h-full transform -rotate-90">
                 <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                 <circle 
                   cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" 
                   strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * completionPercentage) / 100}
                   className="text-[#F2CA50] transition-all duration-1000 ease-out" 
                 />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="font-sans font-bold text-lg text-[#fafafa]">{completionPercentage}%</span>
               </div>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-[#99907c]">Profile Complete</span>
         </div>
      </div>

      {/* ── SUGGESTIONS ── */}
      {completionPercentage < 100 && (
         <div className="bg-[#F2CA50]/5 border border-[#F2CA50]/20 rounded-[20px] p-6 flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-[#F2CA50] shrink-0 mt-0.5" />
            <div>
               <h3 className="font-sans font-bold text-[15px] text-[#fafafa] mb-2">Complete your profile</h3>
               <p className="text-[13px] text-[#99907c] mb-4">Adding a phone number and birthday ensures you receive delivery updates and exclusive birthday rewards.</p>
               <div className="flex gap-4">
                  {!formData.phoneNumber && <span className="text-[11px] font-bold text-[#F2CA50] uppercase tracking-wider">+ Add Phone Number</span>}
                  {!formData.birthday && <span className="text-[11px] font-bold text-[#F2CA50] uppercase tracking-wider">+ Add Birthday</span>}
               </div>
            </div>
         </div>
      )}

      {/* ── PROFILE FORM ── */}
      <div className="bg-[#1A1A1A] border border-white/5 rounded-[24px] p-6 md:p-8">
         <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <label className="text-[10px] uppercase tracking-widest text-[#99907c]">First Name</label>
               <input 
                 type="text" 
                 disabled={!isEditing}
                 value={formData.firstName}
                 onChange={e => setFormData({...formData, firstName: e.target.value})}
                 className="w-full h-[52px] bg-[#131313] border border-white/10 rounded-[12px] px-4 text-[#fafafa] focus:border-[#F2CA50] focus:outline-none transition-colors disabled:opacity-50"
               />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] uppercase tracking-widest text-[#99907c]">Last Name</label>
               <input 
                 type="text" 
                 disabled={!isEditing}
                 value={formData.lastName}
                 onChange={e => setFormData({...formData, lastName: e.target.value})}
                 className="w-full h-[52px] bg-[#131313] border border-white/10 rounded-[12px] px-4 text-[#fafafa] focus:border-[#F2CA50] focus:outline-none transition-colors disabled:opacity-50"
               />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] uppercase tracking-widest text-[#99907c]">Email Address</label>
               <div className="relative">
                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#99907c]" />
                 <input 
                   type="email" 
                   disabled={true} 
                   value={formData.email}
                   className="w-full h-[52px] bg-[#131313] border border-white/10 rounded-[12px] pl-12 pr-4 text-[#fafafa] opacity-50 cursor-not-allowed"
                 />
               </div>
               <p className="text-[11px] text-[#99907c]">Email cannot be changed.</p>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] uppercase tracking-widest text-[#99907c]">Phone Number</label>
               <div className="relative">
                 <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#99907c]" />
                 <input 
                   type="text" 
                   disabled={!isEditing}
                   value={formData.phoneNumber}
                   placeholder="e.g. 077 123 4567"
                   onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                   className="w-full h-[52px] bg-[#131313] border border-white/10 rounded-[12px] pl-12 pr-4 text-[#fafafa] focus:border-[#F2CA50] focus:outline-none transition-colors disabled:opacity-50"
                 />
               </div>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] uppercase tracking-widest text-[#99907c]">Gender</label>
               <select 
                 disabled={!isEditing}
                 value={formData.gender}
                 onChange={e => setFormData({...formData, gender: e.target.value})}
                 className="w-full h-[52px] bg-[#131313] border border-white/10 rounded-[12px] px-4 text-[#fafafa] focus:border-[#F2CA50] focus:outline-none transition-colors disabled:opacity-50 appearance-none"
               >
                 <option value="">Select Gender</option>
                 <option value="male">Male</option>
                 <option value="female">Female</option>
                 <option value="prefer_not_to_say">Prefer not to say</option>
               </select>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] uppercase tracking-widest text-[#99907c]">Birthday</label>
               <div className="relative">
                 <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#99907c]" />
                 <input 
                   type="date" 
                   disabled={!isEditing}
                   value={formData.birthday}
                   onChange={e => setFormData({...formData, birthday: e.target.value})}
                   className="w-full h-[52px] bg-[#131313] border border-white/10 rounded-[12px] pl-12 pr-4 text-[#fafafa] focus:border-[#F2CA50] focus:outline-none transition-colors disabled:opacity-50 [color-scheme:dark]"
                 />
               </div>
            </div>
         </div>

         {isEditing && (
            <div className="mt-8 pt-8 border-t border-white/5 flex gap-4">
               <button 
                 onClick={handleSave}
                 disabled={isSaving}
                 className="h-[52px] px-8 bg-[#F2CA50] text-[#0e0e0e] rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px] hover:-translate-y-1 transition-transform disabled:opacity-70 disabled:hover:translate-y-0"
               >
                 {isSaving ? "Saving..." : "Save Changes"}
               </button>
               <button 
                 onClick={() => {
                   setIsEditing(false);
                   // Reset to original data
                   setFormData({
                     firstName: user.firstName || user.userName?.split(" ")[0] || "",
                     lastName: user.lastName || user.userName?.split(" ").slice(1).join(" ") || "",
                     email: user.email || "",
                     phoneNumber: user.phoneNumber || "",
                     gender: user.gender || "",
                     birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : ""
                   });
                 }}
                 disabled={isSaving}
                 className="h-[52px] px-8 bg-transparent text-[#fafafa] border border-white/10 rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px] hover:border-white/30 transition-colors"
               >
                 Cancel
               </button>
            </div>
         )}
      </div>

    </div>
  );
};

export default Profile;
