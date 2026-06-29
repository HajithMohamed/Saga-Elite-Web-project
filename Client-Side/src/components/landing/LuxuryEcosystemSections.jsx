import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, CreditCard, Lock, Zap, ArrowRight, User } from "lucide-react";
import { Link } from "react-router-dom";

// 3. The "How It Works" / Ecosystem Grid
export const EcosystemGrid = () => {
  const pillars = [
    {
      id: "drop",
      icon: Lock,
      title: "The Drop",
      description: "Exclusive, time-limited releases. Scarcity is not a tactic; it is our ethos. Once a drop is archived, it never returns.",
      accent: "#f2ca50"
    },
    {
      id: "rewards",
      icon: Gift,
      title: "Saga Elite Rewards",
      description: "Loyalty is currency. Scale the tiers to unlock private drops, early access, and exclusive tactical gear.",
      accent: "#FAF7F2"
    },
    {
      id: "checkout",
      icon: CreditCard,
      title: "Flexible Acquisition",
      description: "Frictionless checkout. Split your payments or use standard fiat. Secure your gear before the timer ends.",
      accent: "#d0c5af"
    }
  ];

  return (
    <section className="bg-[#0a0a0a] border-y border-[#1f1f1f] py-20 px-6">
      <div className="max-w-[1440px] mx-auto">
        <div className="text-center md:text-left mb-16 max-w-2xl">
          <h2 className="font-display text-3xl md:text-5xl text-[#FAF7F2] uppercase mb-4">
            The Saga Ecosystem
          </h2>
          <p className="font-mono text-xs tracking-[0.2em] text-[#8c8577] uppercase">
            Master the mechanics of acquisition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {pillars.map((pillar, idx) => (
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2, duration: 0.6 }}
              className="group relative bg-[#050505] p-8 md:p-12 border border-[#1f1f1f] hover:border-[#f2ca50]/50 transition-colors duration-500 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500 group-hover:scale-110 transform origin-center">
                <pillar.icon className="w-48 h-48 text-[#FAF7F2]" />
              </div>
              
              <div className="relative z-10">
                <pillar.icon className="w-8 h-8 text-[#555] group-hover:text-[#f2ca50] transition-colors duration-300 mb-8" />
                <h3 className="font-display text-2xl text-[#FAF7F2] uppercase mb-4">
                  {pillar.title}
                </h3>
                <p className="font-sans text-[#99907c] text-sm leading-relaxed mb-8">
                  {pillar.description}
                </p>
                <div className="h-[1px] w-12 bg-[#333] group-hover:w-full group-hover:bg-[#f2ca50]/50 transition-all duration-700" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 4. Live Activity & Social Proof Section
export const LiveActivityOverlay = () => {
  const [activity, setActivity] = useState(null);

  const activities = [
    { user: "User from Colombo", action: "just secured", item: "Nocturne Cargo Pants" },
    { user: "User from Kandy", action: "unlocked", item: "Elite Tier Status" },
    { user: "User from Galle", action: "just secured", item: "Phantom Windbreaker" },
    { inventory: true, item: "Nocturne Cargo Pants", remaining: 12 },
  ];

  useEffect(() => {
    let index = 0;
    setActivity(activities[0]);

    const interval = setInterval(() => {
      index = (index + 1) % activities.length;
      setActivity(activities[index]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-40 max-w-sm pointer-events-none hidden md:block">
      <AnimatePresence mode="wait">
        {activity && (
          <motion.div
            key={activity.user || activity.item}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="bg-[#050505]/90 backdrop-blur-md border border-[#1f1f1f] p-4 flex items-center gap-4 shadow-2xl"
          >
            {activity.inventory ? (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#f2ca50]/10 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-[#f2ca50]" />
                </div>
                <div>
                  <p className="font-mono text-[10px] text-[#f2ca50] uppercase tracking-widest mb-1">
                    High Demand
                  </p>
                  <p className="font-sans text-xs text-[#FAF7F2]">
                    Only <span className="font-bold text-[#f2ca50]">{activity.remaining}</span> {activity.item} remaining.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#111] flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-[#555]" />
                </div>
                <div>
                  <p className="font-mono text-[10px] text-[#8c8577] uppercase tracking-widest mb-1">
                    Live Activity
                  </p>
                  <p className="font-sans text-xs text-[#FAF7F2]">
                    <span className="font-bold text-[#d0c5af]">{activity.user}</span> {activity.action} <span className="text-[#f2ca50]">{activity.item}</span>.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 5. The Vault / Archive (Past Drops)
export const ArchiveCarousel = ({ pastDrops = [] }) => {
  if (!pastDrops || pastDrops.length === 0) return null;

  return (
    <section className="bg-[#050505] py-24 px-6 border-b border-[#1f1f1f]">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-[#1f1f1f] pb-6">
          <div>
            <h2 className="font-display text-3xl md:text-4xl text-[#555] uppercase">
              The Vault
            </h2>
            <p className="font-mono text-[10px] tracking-[0.3em] text-[#333] uppercase mt-2">
              Archived Pieces. Never returning.
            </p>
          </div>
          <Link to="/shopping/drops" className="hidden md:inline-flex items-center gap-2 font-mono text-[10px] text-[#555] hover:text-[#FAF7F2] uppercase tracking-widest transition-colors">
            View Full Archive <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex gap-6 overflow-x-auto snap-x hide-scrollbar pb-8">
          {pastDrops.map((drop) => (
            <div 
              key={drop.id || drop.slug}
              className="snap-start shrink-0 w-[280px] md:w-[350px] relative group"
            >
              <div className="aspect-[4/5] bg-[#0a0a0a] relative overflow-hidden grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 border border-[#1f1f1f]">
                <img 
                  src={drop.image || drop.coverImageUrl || "https://images.unsplash.com/photo-1550639525-c97d455acf70?q=80"} 
                  alt={drop.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-colors duration-500" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="font-display text-5xl text-[#FAF7F2]/20 uppercase -rotate-12 border-y-2 border-[#FAF7F2]/20 py-2">
                    Archived
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <p className="font-mono text-[9px] text-[#555] uppercase tracking-widest mb-1">
                  Chapter {drop.chapter || "01"}
                </p>
                <h4 className="font-display text-xl text-[#8c8577] uppercase">
                  {drop.name}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
