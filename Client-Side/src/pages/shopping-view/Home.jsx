import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { fetchUpcomingDrop, getLandingData } from "@/services/landing-api";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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
import usePageMeta from "@/hooks/use-page-meta";
import { Reveal, Eyebrow } from "@/components/ui/editorial";
import ProductCard from "@/components/shopping-components/ProductCard";

const PLACEHOLDER_URLS = {
  hero: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80",
  ladies: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80",
  gents: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
  unisex: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80",
  editorial: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80",
};

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [homepageError, setHomepageError] = useState("");
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [nextDrop, setNextDrop] = useState(null);
  const [dealProducts, setDealProducts] = useState([]);
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
        const [data, upcomingDrop] = await Promise.all([
          getLandingData(),
          fetchUpcomingDrop().catch(() => null),
        ]);
        setPayload(data);
        setNextDrop(upcomingDrop);

        const dealsRes = await axios
          .get(`${API_BASE}/products/get-all-products?hasDeal=true&limit=4`)
          .catch(() => null);
        if (dealsRes?.data?.data) {
          setDealProducts(dealsRes.data.data);
        } else {
          setDealProducts([]);
        }
      } catch (error) {
        console.error(error);
        setHomepageError("Unable to load homepage data right now.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  usePageMeta({ title: "Saga Elite — Rare Fit. Forever.", fullTitle: true });

  const heroSlides = useMemo(
    () =>
      payload.heroSlides.map((slide) => ({
        ...slide,
        imageUrl: slide.imageUrl || PLACEHOLDER_URLS.hero,
      })),
    [payload.heroSlides]
  );

  const ladiesCategories = useMemo(
    () => [
      { name: "Dresses", link: "/shopping/product-list?category=ladies&sub=Dresses" },
      { name: "Tops", link: "/shopping/product-list?category=ladies&sub=Tops" },
      { name: "Bottoms", link: "/shopping/product-list?category=ladies&sub=Bottoms" },
      { name: "Sarees", link: "/shopping/product-list?category=ladies&sub=Sarees" },
      { name: "Lingerie", link: "/shopping/product-list?category=ladies&sub=Lingerie" },
      { name: "Accessories", link: "/shopping/product-list?category=ladies&sub=Accessories" },
    ].map((item) => ({
      ...item,
      image: payload.categoryImages?.ladies?.[item.name] || PLACEHOLDER_URLS.ladies,
    })),
    [payload.categoryImages]
  );

  const gentsCategories = useMemo(
    () => [
      { name: "Shirts", link: "/shopping/product-list?category=gents&sub=Shirts" },
      { name: "Trousers", link: "/shopping/product-list?category=gents&sub=Trousers" },
      { name: "Casual", link: "/shopping/product-list?category=gents&sub=Casual" },
      { name: "Formal", link: "/shopping/product-list?category=gents&sub=Formal" },
      { name: "Accessories", link: "/shopping/product-list?category=gents&sub=Accessories" },
    ].map((item) => ({
      ...item,
      image: payload.categoryImages?.gents?.[item.name] || PLACEHOLDER_URLS.gents,
    })),
    [payload.categoryImages]
  );

  const threeDirections = [
    {
      lbl: "Ladies",
      name: "Ladies",
      link: "/shopping/product-list?category=ladies",
      image: payload.categoryImages?.ladies?.Ladies || PLACEHOLDER_URLS.ladies,
    },
    {
      lbl: "Gents",
      name: "Gents",
      link: "/shopping/product-list?category=gents",
      image: payload.categoryImages?.gents?.Gents || PLACEHOLDER_URLS.gents,
    },
    {
      lbl: "Unisex",
      name: "Unisex",
      link: "/shopping/product-list?category=unisex",
      image: payload.categoryImages?.unisex?.Unisex || PLACEHOLDER_URLS.unisex,
    },
  ];

  const formattedSocialImages = payload.socialImages.length
    ? payload.socialImages.map((image) => image || PLACEHOLDER_URLS.editorial)
    : Array.from({ length: 6 }, () => PLACEHOLDER_URLS.editorial);

  const isUpcomingDrop = nextDrop?.releaseDate && new Date(nextDrop.releaseDate) > new Date();

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
        <HeroCarousel slides={heroSlides} />
        <TrustBar />
        {isUpcomingDrop && (
          <section className="px-5 md:px-12 py-16 md:py-24 bg-[#0e0e0e] border-b border-[#4d4635]/40">
            <Reveal>
              <Eyebrow tone="gold" size="md">Coming Soon</Eyebrow>
              <h2 className="mt-3 se-serif text-[#e5e2e1] text-3xl md:text-5xl">
                {nextDrop.name} — arriving {new Date(nextDrop.releaseDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </h2>
              <p className="mt-4 se-body text-[#d0c5af] text-sm max-w-xl leading-relaxed">
                {nextDrop.description || "Something new is being prepared. Members get access first."}
              </p>

              <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                {(nextDrop.products || []).slice(0, 4).map((product, idx) => (
                  <div key={product._id || idx} className="relative aspect-[3/4] overflow-hidden border border-[#4d4635]/40">
                    {product.images?.[0]?.url ? (
                      <img
                        src={product.images[0].url}
                        alt=""
                        className="w-full h-full object-cover filter blur-xl scale-110 brightness-50"
                        aria-hidden="true"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#1c1b1b]" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="se-label text-[10px] tracking-[0.3em] text-[#f2ca50]/70">?</span>
                    </div>
                  </div>
                ))}
                {(nextDrop.products || []).length === 0 && [...Array(4)].map((_, index) => (
                  <div key={index} className="aspect-[3/4] bg-[#1c1b1b] border border-[#4d4635]/40 animate-pulse flex items-center justify-center">
                    <span className="se-label text-[10px] tracking-[0.3em] text-[#4d4635]">SOON</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </section>
        )}

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
          categories={threeDirections}
        />
        <TrendingGrid products={payload.trending} />
        <BrandStoryStrip />
        <SocialProofStrip images={formattedSocialImages} />

        {dealProducts.length > 0 && (
          <section className="px-5 md:px-12 py-16 md:py-24 bg-[#0a0a0a] border-t border-[#4d4635]/40">
            <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4 max-w-[1280px] mx-auto">
              <div>
                <Eyebrow tone="muted" size="md">From the archive</Eyebrow>
                <h2 className="mt-3 se-serif text-[#e5e2e1] text-3xl md:text-5xl">
                  Drop closed. Still available.
                </h2>
              </div>
              <Link
                to="/shopping/product-list?filter=archive"
                className="se-label text-[10px] tracking-[0.28em] text-[#f2ca50] hover:text-[#ffe088] inline-flex items-center gap-2"
              >
                Browse archive <ArrowRight size={12} strokeWidth={1.5} />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-[1280px] mx-auto">
              {dealProducts.map((product) => (
                <ProductCard key={product._id} product={product} showDealBadge />
              ))}
            </div>
          </section>
        )}

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
