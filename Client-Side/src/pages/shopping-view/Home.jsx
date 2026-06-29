import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import Reveal from "@/components/common-components/Reveal";
import {
  fetchUpcomingDrop,
  getLandingData,
  fetchBestSellers,
  fetchMostWished,
  fetchNewArrivals,
} from "@/services/landing-api";
import { toast } from "@/hooks/use-toast";
import usePageMeta from "@/hooks/use-page-meta";
import { useSocketEvent } from "@/hooks/use-socket-events";
import {
  HeroCarousel,
  LiveDropCountdownXL,
  SeasonalCampaignSlider,
  WhyChooseSaga,
  TrendingFitsMarquee,
  CommunityFeed,
} from "@/components/landing/LandingSections";
import { AsymmetricCategoryGrid } from "@/components/landing/CinematicLanding";
import ForYouRail from "@/components/landing/ForYouRail";
import {
  ProductRailGrid,
  HowItWorks,
  FeaturedCollections,
  PromoBanner,
  Testimonials,
  AboutTeaser,
  HomeFAQ,
  NewsletterSignup,
} from "@/components/landing/HomeSections";
import { LuxuryDropSlider } from "@/components/landing/LuxuryHeroSection";
import { EcosystemGrid, LiveActivityOverlay, ArchiveCarousel } from "@/components/landing/LuxuryEcosystemSections";
import { ExclusiveDropsBanner } from "@/components/landing/ExclusiveDropsBanner";

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
  const [grids, setGrids] = useState({
    bestSellers: [],
    mostWished: [],
    newArrivals: [],
  });

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const [data, upcomingDrop, bestSellers, mostWished, newArrivals] =
        await Promise.all([
          getLandingData(),
          fetchUpcomingDrop().catch(() => null),
          fetchBestSellers(8),
          fetchMostWished(8),
          fetchNewArrivals(8),
        ]);
      setPayload(data);
      setNextDrop(upcomingDrop);
      setGrids({ bestSellers, mostWished, newArrivals });
    } catch (error) {
      console.error(error);
      if (!silent) {
        toast({
          title: "Failed to load",
          description: "Could not fetch the latest pieces.",
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time refetch on product/drop/offer CRUD — debounced to coalesce bursts.
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

  // Combine arrivals + trending into a single marquee feed.
  const trendingFeed = useMemo(
    () => [
      ...(payload.gentsArrivals || []),
      ...(payload.ladiesArrivals || []),
      ...(payload.trending || []),
    ],
    [payload.gentsArrivals, payload.ladiesArrivals, payload.trending]
  );

  // New-arrivals grid prefers the sorted feed; falls back to the gendered arrivals.
  const newArrivalsGrid = useMemo(() => {
    if (grids.newArrivals.length) return grids.newArrivals;
    return [...(payload.ladiesArrivals || []), ...(payload.gentsArrivals || [])];
  }, [grids.newArrivals, payload.ladiesArrivals, payload.gentsArrivals]);

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
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background text-center">
        <div className="pointer-events-none absolute inset-0 bg-grain opacity-40 mix-blend-overlay" />
        <span className="font-display animate-pulse text-2xl uppercase tracking-[0.3em] text-foreground md:text-4xl">
          Saga Elite
        </span>
        <span className="mt-4 font-sans text-[10px] uppercase tracking-[0.4em] text-accent font-bold">
          Preparing Chapter
        </span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <LiveActivityOverlay />
      
      {/* 1. New Luxury Hero Section */}
      <LuxuryDropSlider />

      {/* 2. The Ecosystem Grid */}
      <EcosystemGrid />

      {/* 3. Offers & campaigns (admin-managed) */}
      {payload.offers && payload.offers.length > 0 && (
        <SeasonalCampaignSlider offers={payload.offers} />
      )}

      {/* 4. Shop by category */}
      <Reveal>
        <AsymmetricCategoryGrid categoryImages={normalizedCategories} />
      </Reveal>

      {/* 5. The Vault / Past Drops */}
      <ArchiveCarousel pastDrops={[
        { id: 1, name: "Nocturne Cargo", chapter: "01", image: "https://images.unsplash.com/photo-1550639525-c97d455acf70?q=80" },
        { id: 2, name: "Phantom Windbreaker", chapter: "02", image: "https://images.unsplash.com/photo-1509319117193-57bab727e09d?q=80" },
        { id: 3, name: "Obsidian Boots", chapter: "03", image: "https://images.unsplash.com/photo-1618085222100-85f0e9df2528?q=80" },
      ]} />

      {/* 5. Why Saga Elite */}
      <WhyChooseSaga />

      {/* 6. Featured collections */}
      <FeaturedCollections categoryImages={payload.categoryImages} />

      {/* 7. Trending now */}
      <ProductRailGrid
        id="trending"
        kicker="Trending Now"
        title="What everyone is wearing"
        subtitle="Our most-wanted pieces this week."
        products={payload.trending}
        ctaHref="/shopping/product-list"
      />

      {/* 8. Best sellers */}
      <ProductRailGrid
        id="best"
        kicker="Best Sellers"
        title="The pieces we can't keep in stock"
        products={grids.bestSellers}
        ctaHref="/shopping/product-list"
      />

      {/* 9. Editor's selection (most wished) */}
      <ProductRailGrid
        id="featured"
        kicker="Featured"
        title="Editor's selection"
        products={grids.mostWished}
        ctaHref="/shopping/product-list"
      />

      {/* 10. Promo */}
      <PromoBanner />

      {/* 11. New arrivals */}
      <ProductRailGrid
        id="new"
        kicker="Just In"
        title="New Arrivals"
        subtitle="Fresh drops added every week. Be first to wear what's next."
        products={newArrivalsGrid}
        ctaHref="/shopping/product-list"
      />

      {/* 12. Exclusive Drops Banner */}
      <ExclusiveDropsBanner nextDrop={nextDrop} />

      {/* 13. Personalized rails (kept) */}
      <ForYouRail variant="for-you" />
      <ForYouRail variant="recently-viewed" />
      <ForYouRail variant="trending-style" />

      {/* 14. Trending fits marquee */}
      {trendingFeed.length > 0 && <TrendingFitsMarquee products={trendingFeed} />}

      {/* 15. Community / social proof */}
      {payload.socialImages.length > 0 && (
        <CommunityFeed images={payload.socialImages} />
      )}

      {/* 16. Testimonials */}
      <Testimonials />

      {/* 17. About teaser */}
      <AboutTeaser />

      {/* 18. FAQ */}
      <HomeFAQ />

      {/* 19. Newsletter */}
      <NewsletterSignup />

      {/* Footer comes from the shared layout (MainFooter). */}
    </div>
  );
};

export default Home;
