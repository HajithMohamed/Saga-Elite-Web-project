import React, { useState, useEffect } from "react";
import { Plus, MapPin, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";
import AppLoader from "@/components/ui/AppLoader";

const Addresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAddresses = async () => {
    try {
      const res = await axiosInstance.get("/user/addresses");
      if (res.data?.success) {
        setAddresses(res.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleDelete = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await axiosInstance.delete(`/user/addresses/${addressId}`);
      toast({ title: "Address deleted", variant: "success" });
      setAddresses(addresses.filter(a => a._id !== addressId));
    } catch (error) {
      toast({ title: "Failed to delete address", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <AppLoader message="Loading addresses..." />;
  }

  return (
    <div className="space-y-8 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="font-sans text-2xl font-bold text-[#fafafa] mb-1">Saved Addresses</h1>
           <p className="se-body text-[14px] text-[#99907c]">Manage your delivery addresses for faster checkout.</p>
        </div>
        <button 
          onClick={() => toast({ title: "Coming soon", description: "Adding addresses here will be available soon. Please add during checkout." })}
          className="h-[48px] px-6 bg-[#F2CA50] text-[#0e0e0e] rounded-[12px] font-sans font-bold uppercase tracking-wider text-[11px] hover:-translate-y-1 transition-transform flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-[#1A1A1A] border border-white/5 rounded-[24px] p-12 flex flex-col items-center justify-center text-center">
           <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-[#99907c]" />
           </div>
           <h3 className="font-sans font-bold text-lg text-[#fafafa] mb-2">No Saved Addresses</h3>
           <p className="text-[14px] text-[#99907c] max-w-sm mb-6">You haven't saved any delivery addresses yet. Add one now to speed up your next purchase.</p>
           <button 
             onClick={() => toast({ title: "Coming soon", description: "Adding addresses here will be available soon." })}
             className="h-[48px] px-6 border border-[#F2CA50] text-[#F2CA50] rounded-[12px] font-sans font-bold uppercase tracking-wider text-[11px] hover:bg-[#F2CA50]/10 transition-colors"
           >
             Add Address
           </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <div key={address._id} className="bg-[#1A1A1A] border border-white/5 rounded-[24px] p-6 relative group overflow-hidden">
               {address.isDefault && (
                 <div className="absolute top-0 right-0 bg-[#F2CA50] text-[#0e0e0e] px-3 py-1 rounded-bl-[16px] text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 z-10">
                    <CheckCircle2 className="w-3 h-3" /> Default
                 </div>
               )}
               <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                     <MapPin className="w-5 h-5 text-[#99907c]" />
                  </div>
                  <div className="flex-1">
                     <h4 className="font-sans font-bold text-[16px] text-[#fafafa] mb-1">{address.fullName}</h4>
                     <p className="text-[13px] text-[#99907c] leading-relaxed mb-4">
                        {address.address}<br />
                        {address.city}, {address.pincode}<br />
                        Phone: {address.phone}
                     </p>
                     
                     <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                        <button 
                          onClick={() => toast({ title: "Coming soon", description: "Edit functionality will be available soon." })}
                          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#99907c] hover:text-[#F2CA50] transition-colors"
                        >
                           <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(address._id)}
                          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#99907c] hover:text-red-400 transition-colors ml-auto"
                        >
                           <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Addresses;
