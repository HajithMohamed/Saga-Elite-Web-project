import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";

const FALLBACK_SLIDES = [
  {
    id: "slide-1",
    label: "New Season",
    headline: "She Leads in Style",
    subheadline: "Women's collection — just arrived",
    ctaText: "Shop Now",
    ctaLink: "/women/new-arrivals",
    imageUrl: "",
    fallback: "linear-gradient(120deg, #8C2D40, #6B1A2A)",
    order: 1,
  },
  {
    id: "slide-2",
    label: "Flash Sale",
    headline: "Up to 60% Off",
    subheadline: "Limited time — women's & men's picks",
    ctaText: "Shop Now",
    ctaLink: "/sale",
    imageUrl: "",
    fallback: "linear-gradient(120deg, #6B1A2A, #2C2C2A)",
    order: 2,
  },
  {
    id: "slide-3",
    label: "Men's Edit",
    headline: "Refined. Modern. Sri Lankan.",
    subheadline: "Formal & casual — new in store",
    ctaText: "Shop Now",
    ctaLink: "/men/new-arrivals",
    imageUrl: "",
    fallback: "linear-gradient(120deg, #2C2C2A, #4A4A47)",
    order: 3,
  },
  {
    id: "slide-4",
    label: "Exclusive",
    headline: "Saree & Ethnic Wear",
    subheadline: "Crafted for every occasion",
    ctaText: "Shop Now",
    ctaLink: "/women/sarees",
    imageUrl: "",
    fallback: "linear-gradient(120deg, #712B13, #6B1A2A)",
    order: 4,
  },
];

const FALLBACK_AD_IMAGES = [
  "",
  "",
  "",
  "",
  "",
  "",
];

const FALLBACK_HERO_FROM_SYSTEM = [
  {
    id: "system-hero-1",
    label: "Saga Elite",
    headline: "Curated Drop Collection",
    subheadline: "Luxury essentials for your next look",
    ctaText: "Shop Now",
    ctaLink: "/shopping/product-list",
    imageUrl: "",
    fallback: "linear-gradient(120deg, #0e0e0e, #1f1f1f)",
    order: 1,
  },
];

const normalizeBanner = (banner, index) => ({
  id: banner._id || banner.id || `banner-${index}`,
  label: banner.title || "Saga Elite",
  headline: banner.headline || FALLBACK_SLIDES[index % FALLBACK_SLIDES.length].headline,
  subheadline:
    banner.subheadline || FALLBACK_SLIDES[index % FALLBACK_SLIDES.length].subheadline,
  ctaText: banner.ctaText || "Shop Now",
  ctaLink: banner.redirectUrl || banner.ctaLink || "/shopping/product-list",
  imageUrl: banner.imageUrl || "",
  fallback: FALLBACK_SLIDES[index % FALLBACK_SLIDES.length].fallback,
  order: banner.displayOrder ?? banner.order ?? index + 1,
});

const normalizeProduct = (product) => {
  const basePrice = Number(product.basePrice || product.originalPrice || 0);
  const discountPercent = Number(product.discountPercent || 0);
  const salePrice =
    Number(product.salePrice || 0) || Math.max(0, Math.round(basePrice * (100 - discountPercent) / 100));

  return {
    ...product,
    id: product._id || product.id,
    slug: product.slug || product._id,
    name: product.name || "Untitled Product",
    category: product.category || "Women",
    basePrice,
    originalPrice: Number(product.originalPrice || basePrice),
    salePrice,
    discountPercent,
    trendScore: Number(product.trendScore || product.soldCount || 0),
    isDeal: Boolean(product.isDeal || product.dealEndsAt),
    dealEndsAt: product.dealEndsAt || null,
    variants: Array.isArray(product.variants) ? product.variants : [],
    images: Array.isArray(product.images)
      ? product.images
      : product.imageUrl
        ? [{ url: product.imageUrl }]
        : [],
    relatedProductIds: Array.isArray(product.relatedProductIds) ? product.relatedProductIds : [],
    tags: Array.isArray(product.tags) ? product.tags : [],
  };
};

const fetchProducts = async (params = {}) => {
  const res = await axios.get(`${API_BASE}/products`, { params });
  const list = res?.data?.data || [];
  return (Array.isArray(list) ? list : []).map(normalizeProduct);
};

const fetchActiveDeals = async (limit = 8) => {
  const res = await axios.get(`${API_BASE}/deals/active`);
  const deals = res?.data?.data?.deals || [];

  const normalizedProducts = (Array.isArray(deals) ? deals : [])
    .map((deal) => {
      const product = deal?.product;
      if (!product) return null;

      return normalizeProduct({
        ...product,
        isDeal: true,
        dealEndsAt: deal.endsAt || product.dealEndsAt || null,
      });
    })
    .filter(Boolean)
    .slice(0, limit);

  return normalizedProducts;
};

const fetchCategoryLogoImages = async () => {
  const res = await axios.get(`${API_BASE}/image/get-category-logo-images`);
  return Array.isArray(res?.data?.images) ? res.data.images : [];
};

const fetchAdImages = async () => {
  const res = await axios.get(`${API_BASE}/image/get-ad-images`);
  return Array.isArray(res?.data?.images) ? res.data.images : [];
};

const findImageForCategory = (images, name) => {
  const normalizedName = String(name || "").trim().toLowerCase();
  const exact = images.find(
    (item) => String(item?.label || "").trim().toLowerCase() === normalizedName
  );
  if (exact?.url) return exact.url;

  const contains = images.find((item) =>
    String(item?.label || "").trim().toLowerCase().includes(normalizedName)
  );
  return contains?.url || "";
};

const normalizeSystemHeroImage = (image, index) => ({
  id: image?._id || `system-hero-${index + 1}`,
  label: image?.label || "Saga Elite",
  headline: "Curated Drop Collection",
  subheadline: "Luxury essentials for your next look",
  ctaText: "Shop Now",
  ctaLink: "/shopping/product-list",
  imageUrl: image?.url || "",
  fallback: "linear-gradient(120deg, #0e0e0e, #1f1f1f)",
  order: image?.order ?? index + 1,
});

export const getLandingData = async () => {
  const [bannersRes, heroImagesRes, womenArrivals, dealProductsRes, womenDealsFallback, menArrivals, trending, categoryLogosRes, adImagesRes] = await Promise.allSettled([
    axios.get(`${API_BASE}/banners/active`),
    axios.get(`${API_BASE}/image/get-hero-images`),
    fetchProducts({ category: "Women", tag: "new-arrival", limit: 8 }),
    fetchActiveDeals(8),
    fetchProducts({ category: "Women", isDeal: true, limit: 8 }),
    fetchProducts({ category: "Men", tag: "new-arrival", limit: 8 }),
    fetchProducts({ tag: "trending", limit: 8 }),
    fetchCategoryLogoImages(),
    fetchAdImages(),
  ]);

  const bannerPayload = bannersRes.status === "fulfilled" ? bannersRes.value?.data?.data?.banners || [] : [];
  const systemHeroPayload = heroImagesRes.status === "fulfilled" ? heroImagesRes.value?.data?.images || [] : [];
  const heroSlides = (
    bannerPayload.length
      ? bannerPayload.map(normalizeBanner)
      : systemHeroPayload.length
        ? systemHeroPayload.map(normalizeSystemHeroImage)
        : [...FALLBACK_SLIDES, ...FALLBACK_HERO_FROM_SYSTEM]
  ).sort((a, b) => (a.order || 0) - (b.order || 0));

  const categoryLogoImages = categoryLogosRes.status === "fulfilled" ? categoryLogosRes.value : [];
  const adImages = adImagesRes.status === "fulfilled"
    ? adImagesRes.value.map((item) => item?.url).filter(Boolean)
    : [];

  const womenDeals =
    dealProductsRes.status === "fulfilled" && dealProductsRes.value.length
      ? dealProductsRes.value
      : womenDealsFallback.status === "fulfilled"
        ? womenDealsFallback.value
        : [];

  return {
    heroSlides,
    womenArrivals: womenArrivals.status === "fulfilled" ? womenArrivals.value : [],
    womenDeals,
    menArrivals: menArrivals.status === "fulfilled" ? menArrivals.value : [],
    trending:
      trending.status === "fulfilled"
        ? [...trending.value].sort((a, b) => b.trendScore - a.trendScore).slice(0, 8)
        : [],
    categoryImages: {
      women: {
        Dresses: findImageForCategory(categoryLogoImages, "Dresses"),
        Tops: findImageForCategory(categoryLogoImages, "Tops"),
        Bottoms: findImageForCategory(categoryLogoImages, "Bottoms"),
        Sarees: findImageForCategory(categoryLogoImages, "Sarees"),
        Lingerie: findImageForCategory(categoryLogoImages, "Lingerie"),
        Accessories: findImageForCategory(categoryLogoImages, "Women Accessories"),
      },
      men: {
        Shirts: findImageForCategory(categoryLogoImages, "Shirts"),
        Trousers: findImageForCategory(categoryLogoImages, "Trousers"),
        Casual: findImageForCategory(categoryLogoImages, "Casual"),
        Formal: findImageForCategory(categoryLogoImages, "Formal"),
        Accessories: findImageForCategory(categoryLogoImages, "Men Accessories"),
      },
      ladies: {
        Ladies: findImageForCategory(categoryLogoImages, "Ladies"),
      },
      gents: {
        Gents: findImageForCategory(categoryLogoImages, "Gents"),
      },
      unisex: {
        Unisex: findImageForCategory(categoryLogoImages, "Unisex"),
      },
    },
    socialImages: adImages.length ? adImages : FALLBACK_AD_IMAGES,
  };
};

