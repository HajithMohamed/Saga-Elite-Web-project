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
      { name: "Dresses", link: "/shopping/product-list?category=women&sub=Dresses" },
      { name: "Tops", link: "/shopping/product-list?category=women&sub=Tops" },
      { name: "Bottoms", link: "/shopping/product-list?category=women&sub=Bottoms" },
      { name: "Sarees", link: "/shopping/product-list?category=women&sub=Sarees" },
      { name: "Lingerie", link: "/shopping/product-list?category=women&sub=Lingerie" },
      { name: "Accessories", link: "/shopping/product-list?category=women&sub=Accessories" },
    ].map((item) => ({ ...item, image: payload.categoryImages?.women?.[item.name] || "" })),
    [payload.categoryImages]
  );

  const menCategories = useMemo(
    () => [
      { name: "Shirts", link: "/shopping/product-list?category=men&sub=Shirts" },
      { name: "Trousers", link: "/shopping/product-list?category=men&sub=Trousers" },
      { name: "Casual", link: "/shopping/product-list?category=men&sub=Casual" },
      { name: "Formal", link: "/shopping/product-list?category=men&sub=Formal" },
      { name: "Accessories", link: "/shopping/product-list?category=men&sub=Accessories" },
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
        <CategoryGrid title="Shop Women's" subtitle="Discover your style" categories={womenCategories} />

        <section className="max-w-[1280px] mx-auto px-6 py-8">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-[26px] text-[#e5e2e1]">Flash Deals</h3>
            <FlashDealHeaderTimer endsAt={payload.womenDeals[0]?.dealEndsAt || new Date(Date.now() + 3 * 3600 * 1000).toISOString()} />
          </div>
          <p className="text-[13px] text-[#d0c5af]">Offers on styles from today's new arrivals — ends soon</p>
        </section>
        <ProductSlider
          title="Flash Deals"
          subtitle="Women's picks in your preferred price range"
          products={payload.womenDeals}
          deal
        />

        <ProductSlider
          title="New Arrivals — Men's Edit"
          subtitle="Fresh shirts, trousers & more"
          products={payload.menArrivals}
        />
        <CategoryGrid title="Shop Men's" subtitle="Tailored essentials for every day" categories={menCategories} />
        <CategoryGrid
          title="For the Little Ones"
          subtitle="Girls, Boys and Infant styles"
          categories={[
            { name: "Girls", link: "/shopping/product-list?category=kids&sub=Girls", image: payload.categoryImages?.kids?.Girls || "" },
            { name: "Boys", link: "/shopping/product-list?category=kids&sub=Boys", image: payload.categoryImages?.kids?.Boys || "" },
            { name: "Infants", link: "/shopping/product-list?category=kids&sub=Infants", image: payload.categoryImages?.kids?.Infants || "" },
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
