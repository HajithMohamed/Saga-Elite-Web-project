import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { getAllDrops } from "@/store/admin/drop-slice";
import { CONTACT_INFO } from "@/config";

const computeCountdown = (targetDate) => {
  if (!targetDate)
    return {
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
    };
  const diff = targetDate - new Date();
  if (diff <= 0)
    return {
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
    };
  return {
    days: String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, "0"),
    hours: String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, "0"),
    minutes: String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, "0"),
    seconds: String(Math.floor((diff / 1000) % 60)).padStart(2, "0"),
  };
};

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
    />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      fill="currentColor"
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
    />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
    />
  </svg>
);

const WhatsAppPayIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#25D366]" aria-hidden="true">
    <path
      fill="currentColor"
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.883 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
    />
  </svg>
);

const VisaBadge = () => (
  <svg width="40" height="24" viewBox="0 0 40 24" aria-label="Visa" className="shrink-0">
    <rect width="40" height="24" rx="4" fill="#1A1F71" />
    <text
      x="20"
      y="16"
      fill="white"
      fontSize="11"
      fontStyle="italic"
      fontWeight="bold"
      textAnchor="middle"
      fontFamily="Georgia, serif"
    >
      VISA
    </text>
  </svg>
);

const MastercardBadge = () => (
  <svg width="40" height="24" viewBox="0 0 40 24" aria-label="Mastercard" className="shrink-0">
    <rect width="40" height="24" rx="4" fill="#000" opacity="0.06" />
    <circle cx="14" cy="12" r="8" fill="#EB001B" />
    <circle cx="26" cy="12" r="8" fill="#F79E1B" />
    <ellipse cx="20" cy="12" rx="3" ry="8" fill="#FF5F00" />
  </svg>
);

const footerGridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const footerColVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const MainFooter = () => {
  const location = useLocation();
  const isAdminView = location.pathname.startsWith("/admin");
  const dispatch = useDispatch();
  const { drops } = useSelector((state) => state.drop);

  const [nextDrop, setNextDrop] = useState(null);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (!isAdminView && drops.length === 0) {
      dispatch(getAllDrops());
    }
  }, [dispatch, isAdminView, drops.length]);

  useEffect(() => {
    if (!isAdminView && drops.length > 0) {
      const upcoming = [...drops]
        .filter((d) => new Date(d.releaseDate) > new Date())
        .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
      setNextDrop(upcoming[0] || null);
    }
  }, [drops, isAdminView]);

  useEffect(() => {
    if (!nextDrop?.releaseDate) return;
    const tick = () =>
      setCountdown(computeCountdown(new Date(nextDrop.releaseDate)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [nextDrop]);

  if (isAdminView) return null;

  const socialLinks = [
    {
      href: CONTACT_INFO.socials.instagram,
      label: "Instagram",
      Icon: InstagramIcon,
    },
    {
      href: CONTACT_INFO.socials.facebook,
      label: "Facebook",
      Icon: FacebookIcon,
    },
    {
      href: CONTACT_INFO.socials.tiktok,
      label: "TikTok",
      Icon: TikTokIcon,
    },
  ];

  return (
    <footer className="mt-auto border-t border-[#D4AF37]/20 bg-gray-50 py-12 text-gray-700 dark:bg-[#111] dark:text-gray-400">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-10 flex flex-col gap-8 border-b border-[#D4AF37]/15 pb-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-lg">
            <Link
              to="/shopping/home"
              className="inline-flex flex-col gap-1"
            >
              <span className="font-serif text-2xl font-bold uppercase tracking-widest text-[#D4AF37]">
                Saga Elite
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-500">
                Rare Fit Forever
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Sri Lanka&apos;s premium streetwear brand, delivering limited
              drops island-wide.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {socialLinks.map(({ href, label, Icon }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2 }}
                  className="text-gray-600 transition-colors hover:text-[#D4AF37] dark:text-gray-400"
                  aria-label={label}
                >
                  <Icon />
                </motion.a>
              ))}
            </div>
          </div>
          {nextDrop && countdown ? (
            <div
              className="rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/5 px-6 py-5 text-center md:text-right"
              style={{
                boxShadow: "0 0 20px rgba(212, 175, 55, 0.2)",
              }}
            >
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]">
                Next drop
              </p>
              <p className="mt-2 font-serif text-xl font-semibold text-on-surface dark:text-white">
                {nextDrop.name}
              </p>
              <p className="mt-3 font-mono text-sm text-[#D4AF37]">
                {countdown.days}d {countdown.hours}h {countdown.minutes}m{" "}
                {countdown.seconds}s
              </p>
            </div>
          ) : (
            <div
              className="rounded-xl border border-[#D4AF37]/25 px-6 py-5 text-sm text-gray-500 dark:text-gray-500"
              style={{
                boxShadow: "0 0 20px rgba(212, 175, 55, 0.12)",
              }}
            >
              Limited drops — follow us for release dates.
            </div>
          )}
        </div>

        <motion.div
          className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={footerGridVariants}
        >
          <motion.div variants={footerColVariants} className="flex flex-col gap-3">
            <h3 className="mb-1 text-[10px] uppercase tracking-[0.25em] text-gray-500 dark:text-white/60">
              Shop
            </h3>
            <Link
              to="/shopping/product-list"
              className="text-[13px] text-gray-600 transition-colors duration-200 hover:text-[#D4AF37] dark:text-gray-400"
            >
              All Products
            </Link>
            <Link
              to="/shopping/product-list?sort=newest"
              className="text-[13px] text-gray-600 transition-colors duration-200 hover:text-[#D4AF37] dark:text-gray-400"
            >
              New Arrivals
            </Link>
            <Link
              to="/shopping/product-list?sale=true"
              className="text-[13px] text-gray-600 transition-colors duration-200 hover:text-[#D4AF37] dark:text-gray-400"
            >
              Sale Items
            </Link>
          </motion.div>

          <motion.div variants={footerColVariants} className="flex flex-col gap-3">
            <h3 className="mb-1 text-[10px] uppercase tracking-[0.25em] text-gray-500 dark:text-white/60">
              Account
            </h3>
            <Link
              to="/shopping/orders"
              className="text-[13px] text-gray-600 transition-colors duration-200 hover:text-[#D4AF37] dark:text-gray-400"
            >
              My Orders
            </Link>
            <Link
              to="/account/my-reviews"
              className="text-[13px] text-gray-600 transition-colors duration-200 hover:text-[#D4AF37] dark:text-gray-400"
            >
              My Reviews
            </Link>
            <Link
              to="/shopping/account"
              className="text-[13px] text-gray-600 transition-colors duration-200 hover:text-[#D4AF37] dark:text-gray-400"
            >
              My Profile
            </Link>
          </motion.div>

          <motion.div variants={footerColVariants} className="flex flex-col gap-3">
            <h3 className="mb-1 text-[10px] uppercase tracking-[0.25em] text-gray-500 dark:text-white/60">
              Support
            </h3>
            <Link
              to="/contact"
              className="text-[13px] text-gray-600 transition-colors duration-200 hover:text-[#D4AF37] dark:text-gray-400"
            >
              Contact Us
            </Link>
            <Link
              to="/about"
              className="text-[13px] text-gray-600 transition-colors duration-200 hover:text-[#D4AF37] dark:text-gray-400"
            >
              About Us
            </Link>
            <a
              href={`https://wa.me/${CONTACT_INFO.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-gray-600 transition-colors duration-200 hover:text-[#D4AF37] dark:text-gray-400"
            >
              WhatsApp Us
            </a>
          </motion.div>

          <motion.div variants={footerColVariants} className="flex flex-col gap-3">
            <h3 className="mb-1 text-[10px] uppercase tracking-[0.25em] text-gray-500 dark:text-white/60">
              Legal
            </h3>
            <Link
              to="/legal/privacy-policy"
              className="text-[13px] text-gray-600 transition-colors duration-200 hover:text-[#D4AF37] dark:text-gray-400"
            >
              Privacy Policy
            </Link>
            <Link
              to="/legal/terms-and-conditions"
              className="text-[13px] text-gray-600 transition-colors duration-200 hover:text-[#D4AF37] dark:text-gray-400"
            >
              Terms &amp; Conditions
            </Link>
            <Link
              to="/legal/refund-policy"
              className="text-[13px] text-gray-600 transition-colors duration-200 hover:text-[#D4AF37] dark:text-gray-400"
            >
              Refund Policy
            </Link>
            <Link
              to="/legal/delivery-policy"
              className="text-[13px] text-gray-600 transition-colors duration-200 hover:text-[#D4AF37] dark:text-gray-400"
            >
              Delivery Policy
            </Link>
          </motion.div>
        </motion.div>

        <div className="flex flex-col gap-4 border-t border-[#D4AF37]/10 pt-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              We accept
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <VisaBadge />
              <MastercardBadge />
              <span
                className="inline-flex h-6 items-center gap-1 rounded border border-gray-300 bg-white px-2 text-[9px] font-semibold uppercase text-gray-700 dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-300"
                title="Bank transfer"
              >
                <Building2 className="h-3.5 w-3.5" />
                Bank
              </span>
              <span
                className="inline-flex h-6 items-center rounded border border-gray-300 bg-white px-2 dark:border-gray-600 dark:bg-[#1a1a1a]"
                title="WhatsApp Pay"
              >
                <WhatsAppPayIcon />
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 text-[10px] uppercase tracking-widest text-gray-500 md:flex-row">
            <p>© {new Date().getFullYear()} Saga Elite. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/legal/privacy-policy"
                className="hover:text-[#D4AF37]"
              >
                Privacy Policy
              </Link>
              <span>·</span>
              <Link
                to="/legal/terms-and-conditions"
                className="hover:text-[#D4AF37]"
              >
                Terms
              </Link>
              <span>·</span>
              <Link
                to="/legal/refund-policy"
                className="hover:text-[#D4AF37]"
              >
                Refund Policy
              </Link>
              <span>·</span>
              <Link
                to="/legal/delivery-policy"
                className="hover:text-[#D4AF37]"
              >
                Delivery Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;
