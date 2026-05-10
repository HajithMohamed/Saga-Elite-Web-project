import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  Layout,
  ImagePlus,
  ScrollText,
  FileText,
  Bell,
  MessageCircle,
  Globe,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { AdminPage } from "@/components/admin-components/AdminUI";
import {
  pageVariants,
  containerVariants,
  itemVariants,
} from "@/components/admin-components/_shared/animations";

// Each card maps to one admin route + the SiteConfig keys whose latest
// updatedAt drives the "Last updated" label.
const CARDS = [
  {
    title: "Brand & About",
    description:
      "Brand identity, founder, contact, socials, stats, values, team, timeline, gallery.",
    path: "/admin/about-content",
    icon: Layout,
    summaryKeys: ["shop_brand_name", "about_timeline", "about_studio_gallery"],
  },
  {
    title: "Home Images",
    description:
      "Hero banners, category logos, and homepage media with drag-and-drop reordering.",
    path: "/admin/home-images",
    icon: ImagePlus,
    summaryKeys: [],
  },
  {
    title: "Policies",
    description:
      "Terms, Privacy, Refund, Shipping, and Cookie policies with a rich text editor.",
    path: "/admin/policies",
    icon: ScrollText,
    summaryKeys: [
      "policy_terms",
      "policy_privacy",
      "policy_refund",
      "policy_shipping",
      "policy_cookie",
    ],
  },
  {
    title: "Footer",
    description:
      "Brand description, quick links, payment method icons, and copyright text.",
    path: "/admin/footer",
    icon: FileText,
    summaryKeys: ["footer_brand_description", "footer_copyright"],
  },
  {
    title: "Announcement Bar",
    description:
      "The slim notice strip above the header. Schedule, color, link.",
    path: "/admin/announcement",
    icon: Bell,
    summaryKeys: ["announcement_bar"],
  },
  {
    title: "Contact & FAQ",
    description:
      "FAQ entries, contact-form recipient, auto-response, and WhatsApp CTA.",
    path: "/admin/contact-content",
    icon: MessageCircle,
    summaryKeys: ["faq_items", "contact_form_settings", "whatsapp_cta"],
  },
  {
    title: "SEO & Branding",
    description:
      "Meta titles, descriptions, OG/Twitter images, search-console verification.",
    path: "/admin/seo",
    icon: Globe,
    summaryKeys: [],
  },
];

const formatRelative = (iso) => {
  if (!iso) return "Never edited";
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = now - then;
    const min = Math.round(diff / 60000);
    if (min < 1) return "Just now";
    if (min < 60) return `${min} min ago`;
    const hrs = Math.round(min / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.round(hrs / 24);
    if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
    return new Date(iso).toLocaleDateString();
  } catch {
    return "—";
  }
};

const ContentHub = () => {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/site-config/_summary`);
        if (cancelled) return;
        const map = {};
        (res.data?.data || []).forEach((row) => {
          map[row.key] = row.updatedAt;
        });
        setSummary(map);
      } catch {
        // Fail soft — cards just show "Never edited".
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getCardLatest = (keys) => {
    const stamps = keys.map((k) => summary[k]).filter(Boolean);
    if (stamps.length === 0) return null;
    return stamps.sort().slice(-1)[0];
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <AdminPage
        eyebrow="Content"
        title="Content Management"
        description="Edit every public-site content surface from one place. Saves go live immediately."
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {CARDS.map((card) => {
              const Icon = card.icon;
              const latest = getCardLatest(card.summaryKeys);
              return (
                <motion.div key={card.title} variants={itemVariants}>
                  <Link
                    to={card.path}
                    className="group flex h-full flex-col rounded-2xl border border-white/10 bg-[#0d0d0d] p-6 transition hover:border-[#D4AF37]/40 hover:bg-[#121212]"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10">
                        <Icon className="h-5 w-5 text-[#D4AF37]" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-gray-500 transition group-hover:text-[#D4AF37]" />
                    </div>
                    <h3 className="se-headline text-xl text-white">
                      {card.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-gray-400">
                      {card.description}
                    </p>
                    <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
                      {card.summaryKeys.length > 0
                        ? formatRelative(latest)
                        : "—"}
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AdminPage>
    </motion.div>
  );
};

export default ContentHub;
