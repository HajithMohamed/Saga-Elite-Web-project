import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import Reveal from "@/components/common-components/Reveal";
import { fetchUpcomingDrop, getLandingData } from "@/services/landing-api";
import { toast } from "@/hooks/use-toast";
import usePageMeta from "@/hooks/use-page-meta";
import { useSocketEvent } from "@/hooks/use-socket-events";
import {
  HeroCarousel,
  HeroBackdropFX,
  LiveDropCountdownXL,
  ProductSlider,
  SeasonalCampaignSlider,
  WhyChooseSaga,
  TrendingFitsMarquee,
  CommunityFeed,
  VipMembership,
} from "@/components/landing/LandingSections";
import {
  BrandManifesto,
  AsymmetricCategoryGrid,
  CinematicFooter
} from "@/components/landing/CinematicLanding";
import ForYouRail from "@/components/landing/ForYouRail";
import { ReactLenis } from "lenis/react";


const Home = () => {
  const [loading, setLoading] = useState(true);
  const [nextDrop, setNextDrop] = useState(null);
  const [payload, setPayload] = useState({
    heroSlides: [],
    offers: [],
    activeDrop: null,
    ladiesArrivals: [],
    gentsArrivals: [],
    trending: [],
    categoryImages: { ladies: {}, gents: {}, unisex: {} },
    socialImages: [],
  });

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const [data, upcomingDrop] = await Promise.all([
        getLandingData(),
        fetchUpcomingDrop().catch(() => null),
      ]);
      setPayload(data);
      setNextDrop(upcomingDrop);
    } catch (error) {
      console.error(error);
      if (!silent) {
        toast({
          title: "Failed to load",
          description: "Could not fetch the latest drops.",
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time refetch on product/drop CRUD (Fix #3 + #4) — debounced.
  const refetchTimer = useRef(null);
  const debouncedRefetch = useCallback(() => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(() => load({ silent: true }), 300);
  }, [load]);
  useEffect(() => () => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
  }, []);

  useSocketEvent("product:created", debouncedRefetch, [debouncedRefetch]);
  useSocketEvent("product:deleted", debouncedRefetch, [debouncedRefetch]);
  useSocketEvent("drop:created", debouncedRefetch, [debouncedRefetch]);
  useSocketEvent("drop:updated", debouncedRefetch, [debouncedRefetch]);
  useSocketEvent("offer:refresh", debouncedRefetch, [debouncedRefetch]);

  usePageMeta({ title: "Saga Elite — Own The Drop.", fullTitle: true });

  const heroSlides = useMemo(() => {
    if (payload.heroSlides && payload.heroSlides.length > 0) {
      return payload.heroSlides;
    }
    return [];
  }, [payload.heroSlides]);

  // Combine arrivals + trending into a single marquee feed.
  const trendingFeed = useMemo(
    () => [
      ...(payload.gentsArrivals || []),
      ...(payload.ladiesArrivals || []),
      ...(payload.trending || []),
    ],
    [payload.gentsArrivals, payload.ladiesArrivals, payload.trending]
  );

  const fallbackImage = "/placeholder.jpg";
  const normalizedCategories = {
    ladies: {
      main: payload.categoryImages?.ladies?.main || payload.categoryImages?.ladies?.Dresses || fallbackImage,
      Dresses: payload.categoryImages?.ladies?.Dresses || fallbackImage,
    },
    gents: {
      main: payload.categoryImages?.gents?.main || payload.categoryImages?.gents?.Shirts || fallbackImage,
      Shirts: payload.categoryImages?.gents?.Shirts || fallbackImage,
    },
    unisex: {
      main: payload.categoryImages?.unisex?.main || payload.categoryImages?.unisex?.Unisex || fallbackImage,
      Unisex: payload.categoryImages?.unisex?.Unisex || fallbackImage,
    },
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 bg-grain opacity-40 mix-blend-overlay pointer-events-none" />
        <span className="font-display text-2xl md:text-4xl text-[#FAF7F2] uppercase tracking-[0.3em] animate-pulse">Saga Elite</span>
        <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#f2ca50] mt-4">Preparing Chapter</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative bg-[#0e0e0e] min-h-screen text-[#e5e2e1]">
        {/* Ambient Three.js particle backdrop */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
          <HeroBackdropFX />
        </div>

        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* 1. Hero — cinematic */}
          <HeroCarousel
            activeDrops={payload.activeDrops}
            nextDrop={nextDrop}
          />

          {/* 2. Offers & Campaigns Slider */}
          {payload.offers && payload.offers.length > 0 && (
            <SeasonalCampaignSlider offers={payload.offers} />
          )}

          {/* 3. Collection selector — Asymmetric */}
          <Reveal>
            <AsymmetricCategoryGrid categoryImages={normalizedCategories} />
          </Reveal>

          {/* 4. Featured / Rare Pieces */}
          {payload.trending && payload.trending.length > 0 && (
            <ProductSlider
              title="Rare Pieces"
              subtitle="Elite Picks · Most Wanted"
              products={payload.trending}
            />
          )}

          {/* 5. Personalized rails */}
          <ForYouRail variant="for-you" />
          <ForYouRail variant="recently-viewed" />
          <ForYouRail variant="trending-style" />

          {/* 7. Next drop countdown */}
          {!payload.activeDrop && nextDrop?.releaseDate ? (
            <LiveDropCountdownXL
              targetDate={nextDrop.releaseDate}
              title={nextDrop.name}
              description="The next chapter opens soon. Members enter first."
            />
          ) : null}

          {/* 8. Brand Manifesto */}
          <BrandManifesto />

          {/* 9. Why Saga Elite */}
          <WhyChooseSaga />

          {/* 11. Trending fits */}
          {trendingFeed.length > 0 && (
            <TrendingFitsMarquee products={trendingFeed} />
          )}

          {/* 12. Community / social proof */}
          {payload.socialImages.length > 0 && (
            <CommunityFeed images={payload.socialImages} />
          )}

          {/* 13. VIP / membership CTA */}
          <Reveal>
            <VipMembership />
          </Reveal>

          {/* 15. Cinematic Footer */}
          <CinematicFooter />
        </motion.div>
      </div>
    </>
  );
};

export default Home;
