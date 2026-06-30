import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications, markNotificationRead } from "@/store/notification-slice";
import { useSocketEvent } from "@/hooks/use-socket-events";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AppLoader from "@/components/ui/AppLoader";
import { toast } from "@/hooks/use-toast";

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const { items, unreadCount, isLoading } = useSelector((state) => state.notification);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  useSocketEvent("notification:refresh", () => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkRead = (id) => {
    dispatch(markNotificationRead(id));
  };

  const handleMarkAllRead = () => {
    // Mock implementation for Mark All Read
    items.forEach(n => {
      if (!n.isRead) dispatch(markNotificationRead(n._id));
    });
    toast({ title: "All marked as read", variant: "success" });
  };

  const filteredItems = items.filter(n => {
    if (filter === "unread") return !n.isRead;
    return true;
  });

  if (isLoading && items.length === 0) {
    return <AppLoader message="Loading notifications..." />;
  }

  return (
    <div className="space-y-8 pb-12 font-sans">
      
      {/* ── HEADER & ACTIONS ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
         <div>
            <h1 className="font-sans text-2xl font-bold text-[#fafafa] mb-1">Notifications</h1>
            <p className="se-body text-[14px] text-[#99907c]">You have <span className="text-[#F2CA50] font-bold">{unreadCount}</span> unread messages.</p>
         </div>
         
         <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-[#131313] border border-white/5 rounded-[12px] p-1">
               <button 
                 onClick={() => setFilter("all")}
                 className={`px-4 py-1.5 rounded-[8px] text-[11px] font-bold uppercase tracking-wider transition-colors ${filter === "all" ? 'bg-white/10 text-[#fafafa]' : 'text-[#99907c] hover:text-[#fafafa]'}`}
               >
                 All
               </button>
               <button 
                 onClick={() => setFilter("unread")}
                 className={`px-4 py-1.5 rounded-[8px] text-[11px] font-bold uppercase tracking-wider transition-colors ${filter === "unread" ? 'bg-white/10 text-[#fafafa]' : 'text-[#99907c] hover:text-[#fafafa]'}`}
               >
                 Unread
               </button>
            </div>
            
            {unreadCount > 0 && (
               <button 
                 onClick={handleMarkAllRead}
                 className="h-[36px] px-4 flex items-center gap-2 bg-[#F2CA50]/10 text-[#F2CA50] rounded-[12px] text-[10px] font-bold uppercase tracking-wider hover:bg-[#F2CA50]/20 transition-colors"
               >
                 <CheckCheck className="w-3.5 h-3.5" /> Mark all read
               </button>
            )}
         </div>
      </div>

      {/* ── NOTIFICATIONS LIST ── */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#1A1A1A] border border-white/5 rounded-[24px] p-12 flex flex-col items-center justify-center text-center">
           <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-[#99907c]" />
           </div>
           <h3 className="font-sans font-bold text-lg text-[#fafafa] mb-2">You're all caught up!</h3>
           <p className="text-[14px] text-[#99907c] max-w-sm">There are no new notifications to show right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredItems.map((notification, i) => (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`relative bg-[#1A1A1A] border rounded-[20px] p-6 transition-colors group ${
                  notification.isRead ? 'border-white/5 opacity-80' : 'border-[#F2CA50]/30 shadow-[0_4px_24px_rgba(242,202,80,0.05)]'
                }`}
              >
                 {!notification.isRead && (
                   <div className="absolute top-6 left-0 w-1 h-8 bg-[#F2CA50] rounded-r-full" />
                 )}
                 
                 <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 ml-2">
                    <div className="flex-1">
                       <h2 className={`font-sans font-bold text-[16px] mb-1 ${notification.isRead ? 'text-[#fafafa]' : 'text-[#F2CA50]'}`}>
                          {notification.title}
                       </h2>
                       <p className="se-body text-[14px] text-[#e5e2e1]/80 max-w-3xl leading-relaxed">
                          {notification.message}
                       </p>
                       <p className="mt-3 text-[10px] uppercase tracking-widest text-[#99907c]">
                          {new Date(notification.createdAt).toLocaleString()}
                       </p>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                       {!notification.isRead && (
                          <button
                            onClick={() => handleMarkRead(notification._id)}
                            className="h-[36px] px-4 bg-white/5 text-[#fafafa] rounded-[10px] text-[10px] font-bold uppercase tracking-wider hover:bg-[#F2CA50] hover:text-[#0e0e0e] transition-colors"
                          >
                            Mark Read
                          </button>
                       )}
                       <button
                         onClick={() => toast({ title: "Coming soon", description: "Delete notification feature will be available soon." })}
                         className="w-9 h-9 flex items-center justify-center rounded-[10px] text-[#99907c] hover:bg-red-500/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                       >
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
