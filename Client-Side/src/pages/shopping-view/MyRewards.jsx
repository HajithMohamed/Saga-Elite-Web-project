import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Gift, ShoppingBag, Sparkles, TicketPercent } from "lucide-react";
import { motion } from "framer-motion";
import axiosInstance from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";

const formatLKR = (value = 0) =>
  `LKR ${Number(value || 0).toLocaleString("en-LK", {
    maximumFractionDigits: 0,
  })}`;

const formatDate = (value) => {
  if (!value) return "No expiry";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No expiry";
  return date.toLocaleDateString("en-LK", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const rewardValue = (reward) => {
  const coupon = reward?.coupon || {};
  if (coupon.discountType === "fixed") return `${formatLKR(coupon.discountValue)} off`;
  return `${Number(coupon.discountValue || 0)}% off`;
};

const statusStyles = {
  available: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  redeemed: "border-ink/10 bg-ink/5 text-gray-400",
  expired: "border-rose-400/30 bg-rose-400/10 text-rose-300",
};

const RewardCard = ({ reward }) => {
  const isAvailable = reward.status === "available";

  const copyCode = () => {
    navigator.clipboard?.writeText(reward.code);
    toast({ title: `Copied ${reward.code}`, variant: "success" });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border bg-panel p-5 transition ${
        isAvailable ? "border-gold-ink2/30" : "border-ink/10 opacity-75"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-muted">
            {reward.sourceLabel}
          </p>
          <h2 className="mt-2 font-mono text-xl font-bold uppercase tracking-[0.16em] text-ink">
            {reward.code}
          </h2>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${statusStyles[reward.status] || statusStyles.available}`}>
          {reward.status}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-y border-ink/10 py-4 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Reward</p>
          <p className="mt-1 font-semibold text-gold-ink2">{rewardValue(reward)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Expires</p>
          <p className="mt-1 font-semibold text-gray-200">{formatDate(reward.expiresAt)}</p>
        </div>
      </div>

      {reward.coupon?.description ? (
        <p className="mt-4 min-h-[38px] text-sm leading-relaxed text-gray-400">
          {reward.coupon.description}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyCode}
          disabled={!isAvailable}
          className="inline-flex items-center gap-2 border border-ink/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink transition hover:border-gold-ink2/50 hover:text-gold-ink2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
        {isAvailable ? (
          <Link
            to="/shopping/checkout"
            className="inline-flex items-center gap-2 bg-gold-deep px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-black transition hover:bg-gold"
          >
            Use at checkout
          </Link>
        ) : null}
      </div>
    </motion.article>
  );
};

const MyRewards = () => {
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState([]);

  useEffect(() => {
    let cancelled = false;
    axiosInstance
      .get("/coupons/my-rewards")
      .then((res) => {
        if (!cancelled) setRewards(res.data?.data?.rewards || []);
      })
      .catch((err) => {
        if (!cancelled) {
          toast({
            title: "Unable to load rewards",
            description: err?.response?.data?.message || err.message,
            variant: "destructive",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const available = useMemo(
    () => rewards.filter((reward) => reward.status === "available"),
    [rewards]
  );
  const history = useMemo(
    () => rewards.filter((reward) => reward.status !== "available"),
    [rewards]
  );

  return (
    <main className="min-h-screen bg-page text-ink-2">
      <section className="border-b border-ink/10 bg-panel">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:px-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-gold-ink2">
              Member Vault
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink md:text-5xl">
              My Rewards
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-400">
              Private coupons unlocked from first-order access, reviews, VIP tiers, cart recovery, and future drop rewards.
            </p>
          </div>
          <div className="border border-gold-ink2/25 bg-gold-deep/10 p-5">
            <div className="flex items-center gap-3">
              <TicketPercent className="h-6 w-6 text-gold-ink2" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-gold-ink2">
                  Available now
                </p>
                <p className="mt-1 text-3xl font-bold text-ink">{available.length}</p>
              </div>
            </div>
            <Link
              to="/shopping/product-list"
              className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-ink2 hover:text-ink"
            >
              Shop eligible pieces <ShoppingBag className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center text-sm uppercase tracking-[0.22em] text-gray-500">
            Loading rewards...
          </div>
        ) : rewards.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center border border-dashed border-ink/10 text-center">
            <Gift className="h-10 w-10 text-gold-ink2" />
            <h2 className="mt-4 text-xl font-semibold text-ink">No rewards yet</h2>
            <p className="mt-2 max-w-md text-sm text-gray-400">
              Place your first order, review verified purchases, or climb the membership tiers to unlock private coupons.
            </p>
            <Link
              to="/shopping/product-list"
              className="mt-6 inline-flex items-center gap-2 bg-gold-deep px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-black"
            >
              Start shopping <Sparkles className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            <div>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-gold-ink2">
                  Available Rewards
                </h2>
                <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
                  {available.length} active
                </span>
              </div>
              {available.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {available.map((reward) => (
                    <RewardCard key={reward.id} reward={reward} />
                  ))}
                </div>
              ) : (
                <div className="border border-ink/10 bg-panel p-8 text-sm text-gray-400">
                  No active rewards right now. Review a delivered piece or complete a tier milestone to unlock more.
                </div>
              )}
            </div>

            {history.length > 0 ? (
              <div>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-gray-500">
                  Reward History
                </h2>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {history.map((reward) => (
                    <RewardCard key={reward.id} reward={reward} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
};

export default MyRewards;
