import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft } from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { useSocketEvent } from "@/hooks/use-socket-events";
import { EmptyState } from "@/components/admin-components/_shared/EmptyState";
import usePageMeta from "@/hooks/use-page-meta";
import ProductCard from "@/components/shopping-components/ProductCard";
import { DropDetailsSkeleton } from "@/components/ui/skeleton";
import {
  LiveDropCountdownXL,
} from "@/components/landing/LandingSections";
import { CommunityGallery } from "@/components/landing/CommunitySections";
import DropHeroCinematic from "@/components/listing/DropHeroCinematic";
import DropStory from "@/components/listing/DropStory";
import DropAvailabilityBar from "@/components/listing/DropAvailabilityBar";
import DropTimeline from "@/components/listing/DropTimeline";
import FeaturedHighlightCard from "@/components/listing/FeaturedHighlightCard";

const DropDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [drop, setDrop] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDrop = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/drops/get-single-drop/${slug}`);
      if (res.data?.success && res.data?.drop) {
        setDrop(res.data.drop);
        setProducts(res.data.products || []);
      } else {
        setError("Drop not found");
      }
    } catch (err) {
      console.error("Failed to fetch drop details:", err);
      setError("Failed to load drop details or the drop does not exist.");
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) fetchDrop();
  }, [slug, fetchDrop]);

  // Real-time refetch when admin edits this drop (Fix #4).
  useSocketEvent(
    "drop:updated",
    (payload = {}) => {
      const matches =
        String(payload.dropId || "") === String(drop?._id || "") ||
        String(payload.drop?.slug || "") === String(slug);
      if (matches) fetchDrop();
    },
    [drop?._id, slug, fetchDrop]
  );

  usePageMeta({ title: drop ? `${drop.name} Drop` : "Drop" });

  // Drop lifecycle
  const { isLive, isUpcoming, isExpired, countdownTarget } = useMemo(() => {
    if (!drop) {
      return {
        isLive: false,
        isUpcoming: false,
        isExpired: false,
        countdownTarget: null,
      };
    }
    const now = Date.now();
    const release = drop.releaseDate ? new Date(drop.releaseDate).getTime() : null;
    const end = drop.endDate ? new Date(drop.endDate).getTime() : null;
    const upcoming = release && release > now;
    const live = (!release || release <= now) && (!end || end > now);
    const expired = end && end <= now;
    return {
      isLive: live && !upcoming,
      isUpcoming: upcoming,
      isExpired: expired,
      countdownTarget: upcoming ? drop.releaseDate : end,
    };
  }, [drop]);

  // Featured product — prefer a low-stock limited piece, else products[0].
  const featuredProduct = useMemo(() => {
    if (!products.length) return null;
    const limited = products.find((p) => {
      const total =
        Number(p?.totalStock) ||
        (p?.variants || []).reduce(
          (sum, v) => sum + Math.max(0, Number(v?.stock || 0)),
          0
        );
      return p?.isLimited && total > 0 && total <= 12;
    });
    return limited || products[0];
  }, [products]);

  const remainingProducts = useMemo(() => {
    if (!featuredProduct) return products;
    return products.filter((p) => p._id !== featuredProduct._id);
  }, [products, featuredProduct]);

  // Aggregate sold-percent across all products in the drop.
  // initial = soldCount + currentStock; if neither exist → null.
  const availability = useMemo(() => {
    if (!products.length) {
      return { soldPercent: null, totalProducts: 0, totalRemaining: 0 };
    }
    let totalInitial = 0;
    let totalRemaining = 0;
    products.forEach((p) => {
      const stock = Number(p?.totalStock || 0);
      const sold = Number(p?.soldCount || 0);
      totalInitial += stock + sold;
      totalRemaining += stock;
    });
    const soldPercent =
      totalInitial > 0
        ? ((totalInitial - totalRemaining) / totalInitial) * 100
        : null;
    return {
      soldPercent,
      totalProducts: products.length,
      totalRemaining,
    };
  }, [products]);

  if (isLoading) {
    return <DropDetailsSkeleton />;
  }

  if (error || !drop) {
    return (
      <div className="flex flex-col h-[80vh] w-full items-center justify-center bg-page text-ink-2 gap-6">
        <h2 className="font-display text-3xl text-gold-ink">Error</h2>
        <p className="font-mono text-xs tracking-widest uppercase text-muted">
          {error || "Drop not found"}
        </p>
        <button
          type="button"
          onClick={() => navigate("/shopping/drops")}
          className="border border-line hover:border-gold-ink hover:text-gold-ink text-cream px-8 py-3 font-mono uppercase tracking-widest text-xs transition-colors"
        >
          Back to Drops
        </button>
      </div>
    );
  }

  return (
    <div className="bg-page text-ink-2 min-h-screen relative w-full overflow-hidden">
      {/* 1. Cinematic hero */}
      <DropHeroCinematic
        drop={drop}
        isLive={isLive}
        isExpired={isExpired}
      />

      {/* 2. Live countdown — only when there's a target */}
      {countdownTarget && !isExpired ? (
        <LiveDropCountdownXL
          targetDate={countdownTarget}
          title={drop.name}
          description={
            isUpcoming
              ? "Members enter first. Set your alarm."
              : "The chapter closes soon — once gone, never restocked."
          }
        />
      ) : null}

      {/* Action bar — back + article count, kept terse */}
      <div className="bg-page py-5 border-y border-card px-8 md:px-12 flex justify-between items-center">
        <button
          type="button"
          onClick={() => navigate("/shopping/drops")}
          className="flex items-center gap-2 text-gold-ink font-mono uppercase tracking-widest text-xs hover:text-gold-ink transition-colors"
        >
          <ArrowLeft size={14} /> All Drops
        </button>
        <div className="font-mono text-[10px] tracking-widest text-muted uppercase">
          {products.length} {products.length === 1 ? "Article" : "Articles"}
        </div>
      </div>

      {/* 3. Drop story */}
      <DropStory description={drop.description} />

      {/* 4. Featured piece */}
      {featuredProduct ? (
        <FeaturedHighlightCard
          product={featuredProduct}
          eyebrow="Drop Exclusive"
        />
      ) : null}

      {/* 5. Premium product grid */}
      {remainingProducts.length > 0 ? (
        <section className="bg-page py-16 md:py-24">
          <div className="max-w-[1440px] mx-auto px-5 md:px-12">
            <div className="text-center mb-12">
              <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-ink mb-3">
                The Pieces
              </p>
              <h2 className="font-display text-[32px] md:text-[48px] uppercase text-ink leading-none">
                Read every fit
              </h2>
            </div>
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.1 }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.06 } },
              }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-line/40 border border-line/40"
            >
              {remainingProducts.map((product, idx) => (
                <motion.div
                  key={product._id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ProductCard product={product} index={idx} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      ) : products.length === 0 ? (
        <section className="py-24 px-8 md:px-12 max-w-[1400px] mx-auto">
          <EmptyState
            title="No products available"
            subtitle="This drop currently has no products. Check back soon or browse other drops."
            action={
              <Link to="/shopping/drops" className="inline-flex">
                <button
                  type="button"
                  className="inline-flex bg-gold px-6 py-3 text-ongold font-mono uppercase tracking-widest text-xs font-bold hover:bg-gold-hover transition-colors"
                >
                  All Drops
                </button>
              </Link>
            }
          />
        </section>
      ) : null}

      {/* 6. Availability progress */}
      <DropAvailabilityBar
        soldPercent={availability.soldPercent}
        totalProducts={availability.totalProducts}
        totalRemaining={availability.totalRemaining}
      />

      {/* 7. Drop timeline */}
      <DropTimeline drop={drop} />

      {/* 8. Community reactions */}
      <CommunityGallery />
    </div>
  );
};

export default DropDetails;
