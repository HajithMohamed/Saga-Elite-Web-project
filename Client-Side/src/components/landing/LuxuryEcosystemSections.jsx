import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    },
    {
      id: "rewards",
      icon: Gift,
      title: "Saga Elite Rewards",
      description: "Loyalty is currency. Scale the tiers to unlock private drops, early access, and exclusive tactical gear.",
    },
    {
      id: "checkout",
      icon: CreditCard,
      title: "Flexible Acquisition",
      description: "Frictionless checkout. Split your payments or use standard fiat. Secure your gear before the timer ends.",
    }
  ];

  return (
    <section className="bg-background border-y border-border py-[80px] px-4 md:px-6">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center md:text-left mb-[64px] max-w-2xl">
          <h2 className="font-display text-[32px] md:text-[40px] text-foreground font-bold leading-tight mb-4">
            The Saga Ecosystem
          </h2>
          <p className="font-sans text-[14px] tracking-[0.1em] text-secondary-foreground uppercase">
            Master the mechanics of acquisition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, idx) => (
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2, duration: 0.6 }}
              className="group relative bg-card p-[32px] md:p-[48px] rounded-lg border border-border hover:border-accent/50 hover:shadow-medium transition-all duration-500 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500 group-hover:scale-110 transform origin-center">
                <pillar.icon className="w-48 h-48 text-foreground" />
              </div>
              
              <div className="relative z-10">
                <pillar.icon className="w-8 h-8 text-secondary-foreground group-hover:text-accent transition-colors duration-300 mb-[32px]" />
                <h3 className="font-display text-[24px] font-bold text-foreground mb-4">
                  {pillar.title}
                </h3>
                <p className="font-sans text-secondary-foreground text-[16px] leading-relaxed mb-[32px]">
                  {pillar.description}
                </p>
                <div className="h-[1px] w-12 bg-border group-hover:w-full group-hover:bg-accent/50 transition-all duration-700" />
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
            className="bg-surface/90 backdrop-blur-md border border-border p-4 flex items-center gap-4 rounded-md shadow-large"
          >
            {activity.inventory ? (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent/10 flex items-center justify-center shrink-0 rounded-sm">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-sans text-[10px] text-accent uppercase tracking-[0.1em] mb-1 font-bold">
                    High Demand
                  </p>
                  <p className="font-sans text-[12px] text-foreground">
                    Only <span className="font-bold text-accent">{activity.remaining}</span> {activity.item} remaining.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-background flex items-center justify-center shrink-0 rounded-sm border border-border">
                  <User className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="font-sans text-[10px] text-secondary-foreground uppercase tracking-[0.1em] mb-1 font-bold">
                    Live Activity
                  </p>
                  <p className="font-sans text-[12px] text-foreground">
                    <span className="font-bold text-foreground">{activity.user}</span> {activity.action} <span className="text-accent">{activity.item}</span>.
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
    <section className="bg-background py-[96px] px-4 md:px-6 border-b border-border">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-[48px] border-b border-border pb-[24px]">
          <div>
            <h2 className="font-display text-[32px] md:text-[40px] text-foreground font-bold leading-tight">
              The Vault
            </h2>
            <p className="font-sans text-[12px] tracking-[0.1em] text-secondary-foreground uppercase mt-2">
              Archived Pieces. Never returning.
            </p>
          </div>
          <Link to="/shopping/drops" className="hidden md:inline-flex items-center gap-2 font-sans text-[12px] text-secondary-foreground hover:text-foreground uppercase tracking-[0.1em] transition-colors font-bold">
            View Full Archive <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex gap-[32px] overflow-x-auto snap-x hide-scrollbar pb-[32px]">
          {pastDrops.map((drop) => (
            <div 
              key={drop.id || drop.slug}
              className="snap-start shrink-0 w-[280px] md:w-[350px] relative group"
            >
              <div className="aspect-[4/5] bg-surface relative overflow-hidden grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 border border-border rounded-lg">
                <img 
                  src={drop.image || drop.coverImageUrl || "https://images.unsplash.com/photo-1550639525-c97d455acf70?q=80"} 
                  alt={drop.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-colors duration-500" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="font-display text-[32px] md:text-[48px] text-foreground/20 font-bold -rotate-12 border-y-2 border-foreground/20 py-2">
                    Archived
                  </span>
                </div>
              </div>
              <div className="mt-[16px]">
                <p className="font-sans text-[10px] text-secondary-foreground uppercase tracking-[0.1em] mb-1 font-bold">
                  Chapter {drop.chapter || "01"}
                </p>
                <h4 className="font-display text-[20px] text-foreground font-bold">
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
