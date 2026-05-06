import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getLandingData } from "@/services/landing-api";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import {
  BrandStoryStrip,
  CategoryGrid,
  FlashDealHeaderTimer,
  HeroCarousel,
  ProductSlider,
  SocialProofStrip,
  TrendingGrid,
  TrustBar,
} from "@/components/landing/LandingSections";

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [homepageError, setHomepageError] = useState("");
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [payload, setPayload] = useState({
    heroSlides: [],
    ladiesArrivals: [],
    ladiesDeals: [],
    gentsArrivals: [],
    trending: [],
    categoryImages: { ladies: {}, gents: {}, unisex: {} },
    socialImages: [],
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setHomepageError("");
        const data = await getLandingData();
        setPayload(data);
      } catch (error) {
        console.error(error);
        setHomepageError("Unable to load homepage data right now.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const ladiesCategories = useMemo(
    () => [
      { name: "Dresses", link: "/shopping/product-list?category=ladies&sub=Dresses" },
      { name: "Tops", link: "/shopping/product-list?category=ladies&sub=Tops" },
      { name: "Bottoms", link: "/shopping/product-list?category=ladies&sub=Bottoms" },
      { name: "Sarees", link: "/shopping/product-list?category=ladies&sub=Sarees" },
      { name: "Lingerie", link: "/shopping/product-list?category=ladies&sub=Lingerie" },
      { name: "Accessories", link: "/shopping/product-list?category=ladies&sub=Accessories" },
    ].map((item) => ({ ...item, image: payload.categoryImages?.ladies?.[item.name] || "" })),
    [payload.categoryImages]
  );

  const gentsCategories = useMemo(
    () => [
      { name: "Shirts", link: "/shopping/product-list?category=gents&sub=Shirts" },
      { name: "Trousers", link: "/shopping/product-list?category=gents&sub=Trousers" },
      { name: "Casual", link: "/shopping/product-list?category=gents&sub=Casual" },
      { name: "Formal", link: "/shopping/product-list?category=gents&sub=Formal" },
      { name: "Accessories", link: "/shopping/product-list?category=gents&sub=Accessories" },
    ].map((item) => ({ ...item, image: payload.categoryImages?.gents?.[item.name] || "" })),
    [payload.categoryImages]
  );

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = fd.get("email");
    try {
      await axios.post(`${API_BASE}/newsletter/subscribe`, { email });
      setNewsletterSuccess(true);
      form.reset();
      window.setTimeout(() => setNewsletterSuccess(false), 5000);
    } catch (err) {
      const msg = err?.response?.data?.message || "Subscription failed. Try again.";
      toast({ title: "Could not subscribe", description: msg, variant: "destructive" });
    }
  };

  return (
    <div className="bg-[#0e0e0e] text-[#e5e2e1] min-h-screen w-full">
      <main>
        <HeroCarousel slides={payload.heroSlides} />
        <TrustBar />
        <ProductSlider
          title="New Arrivals"
          subtitle="Fresh styles added every week — ladies' edit"
          products={payload.ladiesArrivals}
        />
        <CategoryGrid title="Shop Ladies'" subtitle="Discover your style" categories={ladiesCategories} />

        <section className="max-w-[1280px] mx-auto px-6 py-8">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-[26px] text-[#e5e2e1]">Flash Deals</h3>
            <FlashDealHeaderTimer endsAt={payload.ladiesDeals[0]?.dealEndsAt || new Date(Date.now() + 3 * 3600 * 1000).toISOString()} />
          </div>
          <p className="text-[13px] text-[#d0c5af]">Offers on styles from today's new arrivals — ends soon</p>
        </section>
        <ProductSlider
          title="Flash Deals"
          subtitle="Ladies' picks in your preferred price range"
          products={payload.ladiesDeals}
          deal
        />

        <ProductSlider
          title="New Arrivals — Gents' Edit"
          subtitle="Fresh shirts, trousers & more"
          products={payload.gentsArrivals}
        />
        <CategoryGrid title="Shop Gents'" subtitle="Tailored essentials for every day" categories={gentsCategories} />
        <CategoryGrid
          title="Three Directions"
          subtitle="Our core collections"
          categories={[
            { name: "Gents", link: "/shopping/product-list?category=gents", image: payload.categoryImages?.gents?.Gents || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80" },
            { name: "Ladies", link: "/shopping/product-list?category=ladies", image: payload.categoryImages?.ladies?.Ladies || "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80" },
            { name: "Unisex", link: "/shopping/product-list?category=unisex", image: payload.categoryImages?.unisex?.Unisex || "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80" },
          ]}
        />
        <TrendingGrid products={payload.trending} />
        <BrandStoryStrip />
        <SocialProofStrip images={payload.socialImages} />

        <section className="max-w-[1280px] mx-auto px-6 py-14">
          <div className="rounded-[28px] border border-[#4d4635]/60 bg-[#131313] p-8 md:p-10">
            <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-end">
              <div>
                <div className="se-label text-[10px] tracking-[0.32em] text-[#f2ca50]">NEWSLETTER</div>
                <h2 className="mt-4 se-serif text-3xl md:text-4xl text-[#e5e2e1]">
                  First access to new drops.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[#99907c]">
                  Get launch alerts, limited stock updates, and curated edits before everyone else.
                </p>
                {newsletterSuccess ? (
                  <p className="mt-4 text-sm text-[#f2ca50]">You're subscribed. Watch your inbox for the next drop.</p>
                ) : null}
              </div>
              <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                <label className="se-label text-[10px] tracking-[0.28em] text-[#d0c5af]" htmlFor="newsletter-email">
                  Email Address
                </label>
                <input
                  id="newsletter-email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full border-b border-[#4d4635] bg-transparent py-3 text-[#e5e2e1] placeholder:text-[#574500] outline-none transition-colors focus:border-[#f2ca50]"
                />
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center border border-[#4d4635] bg-[#1c1b1b] px-5 se-label text-[10px] tracking-[0.28em] text-[#f2ca50] transition-colors hover:border-[#f2ca50] hover:bg-[#131313]"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="max-w-[1280px] mx-auto px-6 py-10 text-[#d0c5af]">Loading Saga Elite storefront...</section>
        ) : null}
        {homepageError ? (
          <section className="max-w-[1280px] mx-auto px-6 py-3 text-red-700">{homepageError}</section>
        ) : null}
      </main>
    </div>
  );
};

export default Home;
