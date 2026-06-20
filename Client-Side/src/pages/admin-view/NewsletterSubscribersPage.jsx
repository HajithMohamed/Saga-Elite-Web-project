import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Mail, Users } from "lucide-react";
import axios from "axios";
import { API_V1_URL } from "@/lib/api";
import { AdminPage, AdminPanel } from "@/components/admin-components/AdminUI";
import {
  pageVariants,
  containerVariants,
  itemVariants,
} from "@/components/admin-components/_shared/animations";
import { AnimatedNumber } from "@/components/admin-components/_shared/AnimatedNumber";
import { SkeletonGrid } from "@/components/admin-components/_shared/SkeletonCard";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const NewsletterSubscribersPage = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const fetchSubscribers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_V1_URL}/newsletter/admin/subscribers`, {
        withCredentials: true,
      });
      if (res.data?.status === "success") {
        setSubscribers(res.data.data?.subscribers || res.data.data || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const filtered = subscribers.filter((sub) => {
    if (!search) return true;
    return sub.email?.toLowerCase().includes(search.toLowerCase());
  });

  // Group subscribers by month for a visual timeline
  const monthCounts = {};
  subscribers.forEach((sub) => {
    const d = new Date(sub.createdAt || sub.subscribedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthCounts[key] = (monthCounts[key] || 0) + 1;
  });
  const recentMonths = Object.entries(monthCounts)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6)
    .reverse();

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="w-full min-h-0">
      <AdminPage
        eyebrow="Marketing"
        title="Newsletter subscribers"
        description="View customers who have opted in to receive email updates and launch alerts."
      >
        {/* Stat cards */}
        <motion.div
          className="grid grid-cols-2 gap-4 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -3, borderColor: "rgba(212,175,55,0.35)" }}
            transition={{ duration: 0.2 }}
            className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5"
          >
            <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500">Total Subscribers</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              <AnimatedNumber value={subscribers.length} />
            </p>
            <p className="mt-1 text-xs text-gray-500">All-time opt-ins</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ y: -3, borderColor: "rgba(212,175,55,0.35)" }}
            transition={{ duration: 0.2 }}
            className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5"
          >
            <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500">This Month</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              <AnimatedNumber
                value={
                  subscribers.filter((s) => {
                    const d = new Date(s.createdAt || s.subscribedAt);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  }).length
                }
              />
            </p>
            <p className="mt-1 text-xs text-gray-500">New sign-ups</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ y: -3, borderColor: "rgba(212,175,55,0.35)" }}
            transition={{ duration: 0.2 }}
            className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5"
          >
            <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500">Search Results</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              <AnimatedNumber value={filtered.length} />
            </p>
            <p className="mt-1 text-xs text-gray-500">{search ? "Matching filter" : "Showing all"}</p>
          </motion.div>
        </motion.div>

        {/* Growth mini-chart */}
        {recentMonths.length > 0 ? (
          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500">Subscriber Growth</p>
            <div className="mt-4 flex items-end gap-3">
              {recentMonths.map(([month, count]) => {
                const maxCount = Math.max(...recentMonths.map(([, c]) => c), 1);
                const heightPct = Math.max(12, Math.round((count / maxCount) * 100));
                return (
                  <div key={month} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-32 w-full items-end rounded-[18px] border border-white/10 bg-black/30 p-2">
                      <motion.div
                        className="w-full rounded-[14px] bg-[linear-gradient(180deg,rgba(212,175,55,0.95),rgba(212,175,55,0.18))]"
                        style={{ height: `${heightPct}%` }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">{month}</p>
                      <p className="mt-1 text-xs font-semibold text-white">{count}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <AdminPanel className="mt-6">
          {/* Search */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email…"
                className="w-full rounded-2xl border border-white/10 bg-black/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="mt-6">
              <SkeletonGrid count={6} className="grid gap-3 md:grid-cols-2 lg:grid-cols-3" />
            </div>
          ) : error ? (
            <div className="mt-6 rounded-[24px] border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-white/10 bg-black/30 px-5 py-10 text-center text-sm text-gray-400">
              {search ? "No subscribers match your search." : "No newsletter subscribers yet."}
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-[24px] border border-white/10">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="px-5 py-3.5 text-[10px] uppercase tracking-[0.22em] text-gray-500">#</th>
                    <th className="px-5 py-3.5 text-[10px] uppercase tracking-[0.22em] text-gray-500">Email</th>
                    <th className="px-5 py-3.5 text-[10px] uppercase tracking-[0.22em] text-gray-500">Subscribed</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sub, index) => (
                    <tr
                      key={sub._id || sub.email}
                      className="border-b border-white/5 transition hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-3.5 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                            <Mail className="h-3.5 w-3.5 text-[#D4AF37]" />
                          </div>
                          <span className="text-sm font-medium text-white">{sub.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-400">
                        {formatDate(sub.createdAt || sub.subscribedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminPanel>
      </AdminPage>
    </motion.div>
  );
};

export default NewsletterSubscribersPage;
