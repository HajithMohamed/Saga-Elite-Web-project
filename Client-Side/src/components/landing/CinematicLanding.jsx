import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { formatLkr } from "@/utils/currency";
import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

// BRAND MANIFESTO SECTION
export const BrandManifesto = () => {
  // Static editorial copy.
  const heading = "Built for the";
  const highlight = "rare few.";
  const body =
    "Every drop is intentionally limited. No mass production. No restocks. No trend chasing. We craft narrative-driven pieces that blur the line between fashion and identity.";
  const tag = "This is not fast fashion";

  return (
    <section className="relative bg-[#050505] border-y border-[#1a1a1a] py-16 md:py-20 overflow-hidden">
      {/* Ambient animated grain & glow */}
      <div className="absolute inset-0 bg-grain opacity-60 z-0"></div>
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-[#f2ca50]/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <div className="max-w-[1440px] mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
        {/* Massive Serif Statement */}
        <div className="lg:w-1/2">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[50px] md:text-[80px] leading-[0.95] text-[#FAF7F2] uppercase tracking-tighter"
          >
            {heading} <br />{" "}
            <span className="text-[#f2ca50] italic pr-4">{highlight}</span>
          </motion.h2>
        </div>

        {/* Manifesto Paragraph */}
        <div className="lg:w-1/2 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="border-l border-[#f2ca50]/30 pl-8"
          >
            <p className="font-sans text-lg md:text-xl text-[#d0c5af] leading-relaxed mb-6 max-w-lg">
              {body}
            </p>
            <div className="flex items-center gap-3">
              <span className="w-12 h-[1px] bg-[#f2ca50]"></span>
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#f2ca50]">
                {tag}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// EDITORIAL METRICS STRIP
export const EditorialMetrics = () => {
  const metrics = [
    { value: "03", label: "Drops Released" },
    { value: "124", label: "Pieces Archived" },
    { value: "19", label: "Districts Shipped" },
    { value: "0", label: "Restocks" },
  ];

  return (
    <section className="bg-[#0e0e0e] border-y border-[#1f1f1f] py-8 md:py-12">
      <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x-0 md:divide-x divide-[#2a2a2a]">
        {metrics.map((m, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center text-center"
          >
            <span className="font-display text-4xl md:text-5xl text-[#FAF7F2] mb-2">
              {m.value}
            </span>
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#99907c]">
              {m.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

// DROP STORY SECTION
export const DropStory = () => {
  return (
    <section className="relative h-[500px] w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?q=80&w=2070"
          alt="Drop Inspiration"
          className="w-full h-full object-cover opacity-50"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
        <div className="absolute inset-0 bg-grain opacity-30 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 h-full max-w-[1440px] mx-auto px-6 flex flex-col justify-end pb-24 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl bg-[#050505]/60 backdrop-blur-md border border-[#4d4635]/40 p-8 md:p-12"
        >
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#f2ca50] block mb-4">
            Chapter 01 — The Arrival
          </span>

          <h2 className="font-display text-3xl md:text-5xl text-[#FAF7F2] uppercase mb-6 leading-tight">
            Inspired by underground Colombo nights & unfinished architecture.
          </h2>

          <p className="font-sans text-[#d0c5af] leading-relaxed mb-8">
            The collection embraces raw edges, heavyweight fabrics, and
            brutalist silhouettes. Designed to withstand the elements while
            making a statement in the shadows.
          </p>

          <Link
            to="/shopping/product-list"
            className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.3em] uppercase text-[#f2ca50] group cursor-open"
          >
            Explore the inspiration{" "}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

// ASYMMETRIC CATEGORY GRID
export const AsymmetricCategoryGrid = ({ categoryImages }) => {
  return (
    <section className="bg-[#050505] py-14 md:py-20 overflow-hidden border-y border-[#1a1a1a]">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="text-center mb-10 relative">
          {/* Floating Typography overlay */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full pointer-events-none overflow-hidden select-none">
            <span className="font-display text-[150px] md:text-[250px] font-black text-[#131313] opacity-50 whitespace-nowrap leading-none tracking-tighter mix-blend-screen">
              IDENTITIES
            </span>
          </div>

          <p className="relative z-10 font-mono text-[10px] tracking-[0.4em] uppercase text-[#f2ca50] mb-3">
            Choose Your Path
          </p>

          <h2 className="relative z-10 font-display text-[36px] md:text-[56px] leading-none text-[#FAF7F2] uppercase">
            Curated Lines
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 auto-rows-[250px]">
          {/* Gents */}
          <Link
            to="/shopping/product-list?category=gents"
            className="md:col-span-5 md:row-span-2 relative overflow-hidden group cursor-open rounded-3xl"
          >
            <img
              src={
                categoryImages?.gents?.main ||
                categoryImages?.gents?.Shirts ||
                ""
              }
              alt="Gents"
              className="absolute inset-0 w-full h-full object-cover transition-all duration-[1.5s] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-110 group-hover:blur-[2px]"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />

            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0e0e0e] to-[#050505]" style={{ zIndex: -1 }} />

            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-[#0a0a0a]/20 to-transparent group-hover:from-[#0a0a0a] transition-all" />

            <div className="absolute inset-0 bg-grain opacity-20 pointer-events-none"></div>

            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
              <span className="font-display text-4xl md:text-5xl text-[#FAF7F2] uppercase tracking-wide group-hover:-translate-y-2 transition-transform duration-500">
                GENTS
              </span>

              <span className="font-mono text-[10px] text-[#f2ca50] tracking-[0.3em] uppercase mt-2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-500 delay-100">
                Explore Collection
              </span>
            </div>
          </Link>

          {/* Ladies */}
          <Link
            to="/shopping/product-list?category=ladies"
            className="md:col-span-7 md:row-span-1 relative overflow-hidden group cursor-open rounded-3xl"
          >
            <img
              src={
                categoryImages?.ladies?.main ||
                categoryImages?.ladies?.Dresses ||
                ""
              }
              alt="Ladies"
              className="absolute inset-0 w-full h-full object-cover transition-all duration-[1.5s] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-110 group-hover:blur-[2px]"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />

            <div className="absolute inset-0 bg-gradient-to-br from-[#1f1a2e] via-[#0e0e0e] to-[#050505]" style={{ zIndex: -1 }} />

            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-[#0a0a0a]/20 to-transparent group-hover:from-[#0a0a0a] transition-all" />

            <div className="absolute inset-0 flex flex-col justify-end p-8">
              <span className="font-display text-3xl md:text-4xl text-[#FAF7F2] uppercase tracking-wide group-hover:-translate-y-2 transition-transform duration-500">
                LADIES
              </span>

              <span className="font-mono text-[10px] text-[#f2ca50] tracking-[0.3em] uppercase mt-2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-500 delay-100">
                View Lookbook
              </span>
            </div>
          </Link>

          {/* Unisex */}
          <Link
            to="/shopping/product-list?category=unisex"
            className="md:col-span-4 md:row-span-1 relative overflow-hidden group cursor-open rounded-3xl"
          >
            <img
              src={
                categoryImages?.unisex?.main ||
                categoryImages?.unisex?.Unisex ||
                ""
              }
              alt="Unisex"
              className="absolute inset-0 w-full h-full object-cover transition-all duration-[1.5s] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-110 group-hover:blur-[2px]"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />

            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#131313] to-[#050505]" style={{ zIndex: -1 }} />

            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-[#0a0a0a]/20 to-transparent group-hover:from-[#0a0a0a] transition-all" />

            <div className="absolute inset-0 flex flex-col justify-end p-8">
              <span className="font-display text-3xl md:text-4xl text-[#FAF7F2] uppercase tracking-wide group-hover:-translate-y-2 transition-transform duration-500">
                UNISEX
              </span>

              <span className="font-mono text-[10px] text-[#f2ca50] tracking-[0.3em] uppercase mt-2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-500 delay-100">
                Browse Staples
              </span>
            </div>
          </Link>

          {/* Decorative Box */}
          <div className="md:col-span-3 md:row-span-1 border border-[#4d4635] flex items-center justify-center p-6 bg-[#0a0a0a] rounded-3xl">
            <div className="text-center">
              <span className="block font-mono text-[10px] tracking-[0.3em] text-[#99907c] uppercase mb-2">
                Signature
              </span>

              <span className="block font-display text-xl text-[#FAF7F2] italic">
                The Archive
              </span>

              <Link
                to="/shopping/product-list"
                className="mt-4 inline-block font-mono text-[9px] tracking-[0.2em] text-[#f2ca50] border-b border-[#f2ca50]/30 pb-1 hover:border-[#f2ca50]"
              >
                VIEW ALL
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// CLOSING CREDITS FOOTER
export const CinematicFooter = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (email) {
      try {
        await axios.post(`${API_BASE}/newsletter/subscribe`, { email });
        setSubscribed(true);
        setTimeout(() => setSubscribed(false), 5000); // Reset after 5s
        setEmail("");
        toast({ title: "Welcome to the Archive.", variant: "success" });
      } catch (error) {
        toast({ title: "Subscription failed", description: error?.response?.data?.message || "Please try again", variant: "destructive" });
      }
    }
  };

  return (
    <footer className="relative bg-[#050505] pt-32 pb-16 overflow-hidden border-t border-[#1a1a1a]">
      {/* Huge Background Typography */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03]">
        <h1 className="font-display text-[20vw] font-black text-white whitespace-nowrap tracking-tighter leading-none mix-blend-screen">
          RARE FIT
        </h1>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 relative z-10 flex flex-col items-center text-center">
        <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#f2ca50] mb-6">
          The End of the Scroll
        </span>

        <h2 className="font-display text-[40px] md:text-[70px] text-[#FAF7F2] uppercase leading-none mb-8">
          Enter the Archive.
        </h2>

        <p className="font-sans text-[#99907c] max-w-md mx-auto mb-12">
          Join the inner circle. Members get 48H early access to new chapters,
          private events, and archived pieces.
        </p>

        <form onSubmit={handleSubscribe} className="w-full max-w-md flex relative border-b border-[#4d4635] focus-within:border-[#f2ca50] transition-colors mb-24">
          <input
            type="email"
            placeholder="YOUR EMAIL ADDRESS"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-transparent border-none outline-none font-mono text-xs tracking-widest text-[#FAF7F2] placeholder-[#4d4635] py-4 px-2"
          />

          <button
            type="submit"
            className="absolute right-0 top-1/2 -translate-y-1/2 text-[#f2ca50] font-mono text-[10px] tracking-[0.2em] uppercase hover:opacity-70 transition-opacity"
          >
            Submit
          </button>
        </form>
      </div>
    </footer>
  );
};