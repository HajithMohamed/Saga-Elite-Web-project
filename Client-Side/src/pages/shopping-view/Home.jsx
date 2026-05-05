import React, { useEffect, useMemo, useState } from "react";
import { getLandingData } from "@/services/landing-api";
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
  const [payload, setPayload] = useState({
    heroSlides: [],
    womenArrivals: [],
    womenDeals: [],
    menArrivals: [],
    trending: [],
    categoryImages: { women: {}, men: {}, kids: {} },
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

  const womenCategories = useMemo(
    () => [
      { name: "Dresses", link: "/shopping/product-list?category=ladies&sub=Dresses" },
      { name: "Tops", link: "/shopping/product-list?category=ladies&sub=Tops" },
      { name: "Bottoms", link: "/shopping/product-list?category=ladies&sub=Bottoms" },
      { name: "Sarees", link: "/shopping/product-list?category=ladies&sub=Sarees" },
      { name: "Lingerie", link: "/shopping/product-list?category=ladies&sub=Lingerie" },
      { name: "Accessories", link: "/shopping/product-list?category=ladies&sub=Accessories" },
    ].map((item) => ({ ...item, image: payload.categoryImages?.women?.[item.name] || "" })),
    [payload.categoryImages]
  );

  const menCategories = useMemo(
    () => [
      { name: "Shirts", link: "/shopping/product-list?category=gents&sub=Shirts" },
      { name: "Trousers", link: "/shopping/product-list?category=gents&sub=Trousers" },
      { name: "Casual", link: "/shopping/product-list?category=gents&sub=Casual" },
      { name: "Formal", link: "/shopping/product-list?category=gents&sub=Formal" },
      { name: "Accessories", link: "/shopping/product-list?category=gents&sub=Accessories" },
    ].map((item) => ({ ...item, image: payload.categoryImages?.men?.[item.name] || "" })),
    [payload.categoryImages]
  );

  return (
    <div className="bg-[#0e0e0e] text-[#e5e2e1] min-h-screen w-full">
      <main>
        <HeroCarousel slides={payload.heroSlides} />
        <TrustBar />
        <ProductSlider
          title="New Arrivals"
          subtitle="Fresh styles added every week — women's edit"
          products={payload.womenArrivals}
        />
        <CategoryGrid title="Shop Ladies'" subtitle="Discover your style" categories={womenCategories} />

        <section className="max-w-[1280px] mx-auto px-6 py-8">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-[26px] text-[#e5e2e1]">Flash Deals</h3>
            <FlashDealHeaderTimer endsAt={payload.womenDeals[0]?.dealEndsAt || new Date(Date.now() + 3 * 3600 * 1000).toISOString()} />
          </div>
          <p className="text-[13px] text-[#d0c5af]">Offers on styles from today's new arrivals — ends soon</p>
        </section>
        <ProductSlider
          title="Flash Deals"
          subtitle="Ladies' picks in your preferred price range"
          products={payload.womenDeals}
          deal
        />

        <ProductSlider
          title="New Arrivals — Gents' Edit"
          subtitle="Fresh shirts, trousers & more"
          products={payload.menArrivals}
        />
        <CategoryGrid title="Shop Gents'" subtitle="Tailored essentials for every day" categories={menCategories} />
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
