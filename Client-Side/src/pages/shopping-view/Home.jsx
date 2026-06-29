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
import { HomeSkeleton } from "@/components/ui/skeleton";
import {
  HeroCarousel,
  LiveDropCountdownXL,
  SeasonalCampaignSlider,
  TrendingFitsMarquee,
} from "@/components/landing/LandingSections";
import ForYouRail from "@/components/landing/ForYouRail";
import {
  WhyChooseSaga,
  HowShoppingWorks,
  CustomerTestimonials,
  FAQPreview,
  TrustBadgesStrip,
} from "@/components/landing/TrustSections";
import {
  ProductRailGrid,
  HowItWorks,
  PromoBanner,
  ShopByCategory,
  FeaturedCollections,
} from "@/components/landing/HomeSections";
import { LuxuryDropSlider } from "@/components/landing/LuxuryHeroSection";
import { EcosystemGrid, LiveActivityOverlay } from "@/components/landing/LuxuryEcosystemSections";
import { ExclusiveDropsBanner } from "@/components/landing/ExclusiveDropsBanner";
import { CommunityGallery, Newsletter, InstagramSection } from "@/components/landing/CommunitySections";

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
    return <HomeSkeleton />;
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <LiveActivityOverlay />
      
      {/* 1. New Luxury Hero Section */}
      <LuxuryDropSlider slides={payload.heroSlides} />

      {/* 2. The Ecosystem Grid */}
      <EcosystemGrid />

      {/* 3. Offers & campaigns (admin-managed) */}
      {payload.offers && payload.offers.length > 0 && (
        <SeasonalCampaignSlider offers={payload.offers} />
      )}

      {/* 4. Shop by category (Prompt 03) */}
      <ShopByCategory categoryImages={normalizedCategories} />

      {/* --- PROMPT 04 HOMEPAGE PRODUCT FLOW --- */}

      {/* 5. Featured Collections */}
      <FeaturedCollections />

      {/* 6. Trending Products */}
      <ProductRailGrid
        id="trending"
        title="Trending Now"
        subtitle="Most loved by our customers."
        products={payload.trending}
        ctaHref="/shopping/product-list?sort=trending"
        ctaLabel="View All Trending"
        layout="grid"
        filters={["Trending", "Popular", "Men", "Women"]}
      />

      {/* 7. New Arrivals */}
      <ProductRailGrid
        id="new"
        title="New Arrivals"
        subtitle="Fresh styles just added."
        products={newArrivalsGrid}
        ctaHref="/shopping/product-list?sort=new"
        ctaLabel="View All New"
        layout="carousel"
        filters={["New", "Sale", "Shoes", "Accessories"]}
      />

      {/* 8. Exclusive Drops */}
      <ExclusiveDropsBanner nextDrop={nextDrop} />

      {/* 9. Best Sellers */}
      <ProductRailGrid
        id="best"
        title="Best Sellers"
        subtitle="Most purchased products."
        products={grids.bestSellers}
        ctaHref="/shopping/product-list?sort=bestselling"
        ctaLabel="View All Best Sellers"
        layout="grid"
      />

      {/* 10. Recommended For You */}
      <ForYouRail variant="for-you" />

      {/* --- PROMPT 05 TRUST SECTIONS --- */}
      <WhyChooseSaga />
      <HowShoppingWorks />
      <CustomerTestimonials />
      <FAQPreview />
      <TrustBadgesStrip />
      {/* --- END PROMPT 05 --- */}

      {/* --- PROMPT 06 COMMUNITY SECTIONS --- */}
      <CommunityGallery />
      <Newsletter />
      <InstagramSection />
      {/* --- END PROMPT 06 --- */}

      {/* Additional Rails & Marquee kept at the bottom to avoid breaking flow */}
      <ForYouRail variant="recently-viewed" />
      <ForYouRail variant="trending-style" />
      {trendingFeed.length > 0 && <TrendingFitsMarquee products={trendingFeed} />}

      {/* Footer comes from the shared layout (MainFooter). */}
    </div>
  );
};

export default Home;
