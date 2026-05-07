import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { fetchUpcomingDrop, getLandingData } from "@/services/landing-api";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import usePageMeta from "@/hooks/use-page-meta";
import {
  HeroCarousel,
  CountdownWidget,
  ProductSlider,
  TrustBar,
  OffersSlider,
  DropCountdownBand,
  CategoryLockup,
  MysteryGiftStrip,
  RecommendationsSection,
  LiveDropSection,
  NewsletterSection
} from "@/components/landing/LandingSections";

const PLACEHOLDER_URLS = {
  hero: "https://images.unsplash.com/photo-1550614000-4b95dd245ed6?w=1600&q=80",
  ladies: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80",
  gents: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&q=80",
  unisex: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80",
};

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [nextDrop, setNextDrop] = useState(null);
  const [payload, setPayload] = useState({
    heroSlides: [],
    ladiesArrivals: [],
    gentsArrivals: [],
    trending: [],
    categoryImages: { ladies: {}, gents: {}, unisex: {} },
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
        toast({ title: "Failed to load", description: "Could not fetch latest drops." });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  usePageMeta({ title: "Saga Elite — Own The Drop.", fullTitle: true });

  const heroSlides = useMemo(() => {
    if (payload.heroSlides && payload.heroSlides.length > 0) {
      return payload.heroSlides.map(slide => ({
        ...slide,
        imageUrl: slide.imageUrl || PLACEHOLDER_URLS.hero
      }));
    }
    // Default fallback
    return [{
      id: "1",
      label: "Exclusive Collection",
      headline: "OWN THE DROP\\nLIMITED EDITION",
      subheadline: "Premium streetwear for the elite. Unlock early access and exclusive drops.",
      ctaText: "EXPLORE DROP",
      ctaLink: "/shopping/product-list",
      imageUrl: PLACEHOLDER_URLS.hero
    }];
  }, [payload.heroSlides]);

  const identityCategories = useMemo(() => [
    { name: "Gents", link: "/shopping/product-list?category=gents", image: PLACEHOLDER_URLS.gents },
    { name: "Ladies", link: "/shopping/product-list?category=ladies", image: PLACEHOLDER_URLS.ladies },
    { name: "Unisex", link: "/shopping/product-list?category=unisex", image: PLACEHOLDER_URLS.unisex },
  ], []);

  if (loading) {
    return <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-t-2 border-[#f2ca50] animate-spin" /></div>;
  }

  return (
    <div className="bg-[#0e0e0e] min-h-screen text-[#e5e2e1]">
      <DropCountdownBand activeDrop={null} />
      
      <HeroCarousel slides={heroSlides} />
      
      <TrustBar />

      <LiveDropSection activeDrop={null} />

      {nextDrop && nextDrop.releaseDate && (
         <CountdownWidget 
            targetDate={nextDrop.releaseDate} 
            title={nextDrop.name}
            description="The next elite collection drops soon. Do not miss out."
         />
      )}

      {payload.offers && payload.offers.length > 0 && (
         <OffersSlider offers={payload.offers} />
      )}

      <CategoryLockup />

      <MysteryGiftStrip />

      {payload.trending && payload.trending.length > 0 && (
         <RecommendationsSection 
            title="Highly Recommended" 
            products={payload.trending} 
         />
      )}
      
      {payload.gentsArrivals && payload.gentsArrivals.length > 0 && (
         <ProductSlider 
            title="Gents Exclusives" 
            subtitle="NEW ARRIVALS" 
            products={payload.gentsArrivals} 
         />
      )}
      
      {payload.ladiesArrivals && payload.ladiesArrivals.length > 0 && (
         <ProductSlider 
            title="Ladies Signature" 
            subtitle="LATEST PIECES" 
            products={payload.ladiesArrivals} 
         />
      )}

      <NewsletterSection />

      {/* Basic Footer spacer for now */}
      <div className="h-20 bg-[#131313]" />
    </div>
  );
};

export default Home;
