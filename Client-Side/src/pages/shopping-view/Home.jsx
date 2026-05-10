import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { fetchUpcomingDrop, getLandingData } from "@/services/landing-api";
import { toast } from "@/hooks/use-toast";
import usePageMeta from "@/hooks/use-page-meta";
import {
  AnnouncementBar,
  HeroCarousel,
  HeroBackdropFX,
  LiveDropCountdownXL,
  ProductSlider,
  OffersSlider,
  MysteryGiftSpline,
  WhyChooseSaga,
  TrendingFitsMarquee,
  CommunityFeed,
  Testimonials,
  VipMembership,
} from "@/components/landing/LandingSections";
import {
  BrandManifesto,
  EditorialMetrics,
  DropStory,
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

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [data, upcomingDrop] = await Promise.all([
          getLandingData(),
          fetchUpcomingDrop().catch(() => null),
        ]);
        setPayload(data);
        setNextDrop(upcomingDrop);
      } catch (error) {
        console.error(error);
        toast({
          title: "Failed to load",
          description: "Could not fetch the latest drops.",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
    <ReactLenis root options={{ lerp: 0.08, smoothWheel: true }}>
      <div className="relative bg-[#0e0e0e] min-h-screen text-[#e5e2e1]">
        {/* Ambient Three.js particle backdrop */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
          <HeroBackdropFX />
        </div>

        <div className="relative z-10">
          {/* 1. Announcement bar */}
          <AnnouncementBar activeDrop={payload.activeDrop} />

          {/* 2. Hero — cinematic */}
          <HeroCarousel
            slides={heroSlides}
            activeDrop={payload.activeDrop}
            nextDrop={nextDrop}
          />

          {/* NEW: Brand Manifesto */}
          <BrandManifesto />

          {/* 3. Editorial Metrics Strip */}
          <EditorialMetrics />

          {/* 4. Collection selector — Asymmetric */}
          <AsymmetricCategoryGrid categoryImages={payload.categoryImages} />

          {/* 5. Next drop countdown */}
          {!payload.activeDrop && nextDrop?.releaseDate ? (
            <LiveDropCountdownXL
              targetDate={nextDrop.releaseDate}
              title={nextDrop.name}
              description="The next chapter opens soon. Members enter first."
            />
          ) : null}

          {/* NEW: Drop Story */}
          <DropStory />

          {/* 6. Featured / Rare Pieces */}
          {payload.trending && payload.trending.length > 0 && (
            <ProductSlider
              title="Rare Pieces"
              subtitle="Elite Picks · Most Wanted"
              products={payload.trending}
            />
          )}

          {/* 3b. Personalized rails */}
          <ForYouRail variant="for-you" />
          <ForYouRail variant="recently-viewed" />
          <ForYouRail variant="trending-style" />

          {/* 7. Active offers slider */}
          {payload.offers && payload.offers.length > 0 && (
            <OffersSlider offers={payload.offers} />
          )}

          {/* 8. Mystery gift */}
          <MysteryGiftSpline />

          {/* 9. Why Saga Elite */}
          <WhyChooseSaga />

          {/* 10. Trending fits */}
          {trendingFeed.length > 0 && (
            <TrendingFitsMarquee products={trendingFeed} />
          )}

          {/* 11. Community / social proof */}
          {payload.socialImages.length > 0 && (
            <CommunityFeed images={payload.socialImages} />
          )}

          {/* 12. Testimonials */}
          <Testimonials />

          {/* 13. VIP / membership CTA */}
          <VipMembership />

          {/* NEW: Cinematic Footer */}
          <CinematicFooter />
        </div>
      </div>
    </ReactLenis>
  );
};

export default Home;
