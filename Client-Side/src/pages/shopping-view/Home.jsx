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
  CategoryLockup,
  LiveDropSection,
  LiveDropCountdownXL,
  ProductSlider,
  OffersSlider,
  MysteryGiftSpline,
  WhyChooseSaga,
  TrendingFitsMarquee,
  CommunityFeed,
  Testimonials,
  VipMembership,
  NewsletterSection,
  TrustBar,
} from "@/components/landing/LandingSections";
import ForYouRail from "@/components/landing/ForYouRail";

const PLACEHOLDER_HERO =
  "https://images.unsplash.com/photo-1550614000-4b95dd245ed6?w=1600&q=80";

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
      return payload.heroSlides.map((slide) => ({
        ...slide,
        imageUrl: slide.imageUrl || PLACEHOLDER_HERO,
      }));
    }
    return [
      {
        id: "default-1",
        label: "Saga Elite",
        headline: "OWN THE DROP\\nLIMITED EDITION",
        subheadline:
          "Premium streetwear for the elite. Unlock early access and exclusive drops.",
        ctaText: "EXPLORE DROP",
        ctaLink: "/shopping/product-list",
        imageUrl: PLACEHOLDER_HERO,
      },
    ];
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
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-[#f2ca50] animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative bg-[#0e0e0e] min-h-screen text-[#e5e2e1]">
      {/* Ambient Three.js particle backdrop — fixed behind everything,
          gives the page a subtle cinematic depth. */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
        <HeroBackdropFX />
      </div>

      <div className="relative z-10">
        {/* 1. Announcement bar — drop-aware marquee at the top */}
        <AnnouncementBar activeDrop={payload.activeDrop} />

        {/* 2. Hero — cinematic, drop-aware (live → upcoming → catalogue) */}
        <HeroCarousel
          slides={heroSlides}
          activeDrop={payload.activeDrop}
          nextDrop={nextDrop}
        />

        {/* 3. Trust bar — quick credibility strip */}
        <TrustBar />

        {/* 3b. Personalized rails (hidden for anon users / cold start) */}
        <ForYouRail variant="for-you" />
        <ForYouRail variant="recently-viewed" />
        <ForYouRail variant="trending-style" />

        {/* 4. Collection selector — 3 identity cards */}
        <CategoryLockup categoryImages={payload.categoryImages} />

        {/* 5. Live drop showcase OR Next drop countdown */}
        {payload.activeDrop ? (
          <LiveDropSection activeDrop={payload.activeDrop} />
        ) : nextDrop?.releaseDate ? (
          <LiveDropCountdownXL
            targetDate={nextDrop.releaseDate}
            title={nextDrop.name}
            description="The next chapter opens soon. Members enter first."
          />
        ) : null}

        {/* 6. Featured / Rare Pieces — uses trending products */}
        {payload.trending && payload.trending.length > 0 && (
          <ProductSlider
            title="Rare Pieces"
            subtitle="Elite Picks · Most Wanted"
            products={payload.trending}
          />
        )}

        {/* 6.5 Catalog CTA — bridge from featured to the full collection */}
        <section className="relative bg-[#0a0a0a] border-y border-[#2a2a2a]">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 md:py-20 flex flex-col items-center text-center">
            <span className="se-label text-[10px] tracking-[0.32em] text-[#f2ca50]">
              EVERY CHAPTER · EVERY PIECE
            </span>
            <h2 className="mt-4 se-serif text-[#e5e2e1] text-3xl md:text-5xl leading-[1.05] max-w-2xl">
              Browse the full<br />Saga catalog.
            </h2>
            <p className="mt-4 se-body text-sm md:text-base text-[#d0c5af] max-w-xl leading-relaxed">
              One scroll, no compromise — this season's drop and the archived edits, side by side.
            </p>
            <Link
              to="/shopping/product-list"
              className="mt-8 inline-flex items-center gap-3 bg-[#f2ca50] hover:bg-[#ffe088] hover:shadow-[0_0_20px_rgba(242,202,80,0.35)] text-[#1b1c1c] se-label text-[11px] tracking-[0.28em] px-8 py-4 transition-all duration-200"
            >
              Shop the full catalog
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          </div>
        </section>

        {/* 7. Active offers slider (when present) */}
        {payload.offers && payload.offers.length > 0 && (
          <OffersSlider offers={payload.offers} />
        )}

        {/* 8. Mystery gift — Spline 3D box (with CSS fallback when no scene URL) */}
        <MysteryGiftSpline />

        {/* 9. Why Saga Elite — feature tilt cards */}
        <WhyChooseSaga />

        {/* 10. Trending fits — infinite scroll marquee */}
        {trendingFeed.length > 0 && (
          <TrendingFitsMarquee products={trendingFeed} />
        )}

        {/* 11. Community / social proof */}
        <CommunityFeed images={payload.socialImages} />

        {/* 12. Testimonials — auto-rotating glassmorphism cards */}
        <Testimonials />

        {/* 13. VIP / membership CTA */}
        <VipMembership />

        {/* 14. Newsletter — closes the page */}
        <NewsletterSection />

      </div>
    </div>
  );
};

export default Home;
