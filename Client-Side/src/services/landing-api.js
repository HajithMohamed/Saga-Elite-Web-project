import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { CONTACT_INFO } from "@/config";



const normalizeBanner = (banner, index) => ({
  id: banner._id || banner.id || `banner-${index}`,
  label: banner.title || "Saga Elite",
  headline: banner.headline || "",
  subheadline: banner.subheadline || "",
  ctaText: banner.ctaText || "Shop Now",
  ctaLink: banner.redirectUrl || banner.ctaLink || "/shopping/product-list",
  imageUrl: banner.imageUrl || "",
  fallback: "linear-gradient(120deg, #0e0e0e, #1f1f1f)",
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
    category: product.category || "Ladies",
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

// Sorted feeds for the homepage product grids. `/products/get-all-products`
// supports a `sort` param (proven in ProductDetails: -createdAt / -wishCount /
// -soldCount). Returns normalized products so they drop straight into ProductCard.
const fetchSortedProducts = async (sort, limit = 8) => {
  try {
    const res = await axios.get(`${API_BASE}/products/get-all-products`, {
      params: { sort, limit },
    });
    const list = res?.data?.data || [];
    return (Array.isArray(list) ? list : []).map(normalizeProduct);
  } catch {
    return [];
  }
};

export const fetchBestSellers = (limit = 8) => fetchSortedProducts("-soldCount", limit);
export const fetchMostWished = (limit = 8) => fetchSortedProducts("-wishCount", limit);
export const fetchNewArrivals = (limit = 8) => fetchSortedProducts("-createdAt", limit);

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

const findImageForCategory = (images, ...names) => {
  const normalizedNames = names
    .flat()
    .map((name) => String(name || "").trim().toLowerCase())
    .filter(Boolean);

  for (const normalizedName of normalizedNames) {
    const exact = images.find(
      (item) => String(item?.label || "").trim().toLowerCase() === normalizedName
    );
    if (exact?.url) return exact.url;
  }

  for (const normalizedName of normalizedNames) {
    const contains = images.find((item) =>
      String(item?.label || "").trim().toLowerCase().includes(normalizedName)
    );
    if (contains?.url) return contains.url;
  }

  return "";
};

export const fetchUpcomingDrop = async () => {
  const res = await axios.get(`${API_BASE}/drops/get-all-drops`);
  const drops = Array.isArray(res?.data?.drops) ? res.data.drops : [];
  const now = new Date();

  return drops
    .filter((drop) => drop?.releaseDate && new Date(drop.releaseDate) > now)
    .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate))[0] || null;
};

const fetchActiveDrops = async () => {
  const res = await axios.get(`${API_BASE}/drops/get-all-drops`);
  const drops = Array.isArray(res?.data?.drops) ? res.data.drops : [];
  const now = Date.now();
  return drops.filter((d) => {
    const release = d?.releaseDate ? new Date(d.releaseDate).getTime() : null;
    const end = d?.endDate ? new Date(d.endDate).getTime() : null;
    const started = !release || release <= now;
    const ongoing = !end || end >= now;
    return started && ongoing;
  }).sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
};

const fetchHomepageOffers = async () => {
  const res = await axios.get(`${API_BASE}/offers`, {
    params: { productLimit: 24, featured: true },
  });
  const offers = res?.data?.data?.offers || [];
  const offersWithProducts = offers.filter(
    (offer) => (offer.products || []).length > 0
  );
  const homepageOffers = offersWithProducts.filter(
    (offer) => offer.showOnHomepage
  );

  return (homepageOffers.length ? homepageOffers : offersWithProducts).sort(
    (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
  );
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
  const [
    bannersRes,
    heroImagesRes,
    ladiesArrivals,
    dealProductsRes,
    ladiesDealsFallback,
    gentsArrivals,
    trending,
    categoryLogosRes,
    adImagesRes,
    offersRes,
    activeDropRes,
  ] = await Promise.allSettled([
    axios.get(`${API_BASE}/banners/active`),
    axios.get(`${API_BASE}/image/get-hero-images`),
    fetchProducts({ category: "Ladies", tag: "new-arrival", limit: 8 }),
    fetchActiveDeals(8),
    fetchProducts({ category: "Ladies", isDeal: true, limit: 8 }),
    fetchProducts({ category: "Gents", tag: "new-arrival", limit: 8 }),
    fetchProducts({ tag: "trending", limit: 8 }),
    fetchCategoryLogoImages(),
    fetchAdImages(),
    fetchHomepageOffers(),
    fetchActiveDrops(),
  ]);

  const bannerPayload = bannersRes.status === "fulfilled" ? bannersRes.value?.data?.data?.banners || [] : [];
  const systemHeroPayload = heroImagesRes.status === "fulfilled" ? heroImagesRes.value?.data?.images || [] : [];
  const offerPayload = offersRes.status === "fulfilled" ? offersRes.value : [];

  // Homepage offers that carry a banner image join the hero rotation as
  // clickable slides — tapping one lands the shopper on the offers page.
  const offerHeroSlides = offerPayload
    .filter((offer) => offer?.bannerImage)
    .map((offer, index) => ({
      id: `offer-${offer._id || index}`,
      label: offer.name || "Featured offer",
      imageUrl: offer.bannerImage,
      link: offer.campaignLandingPage || `/shopping/product-list?filter=offers&offerId=${offer._id}`,
      order: (offer.displayOrder ?? 0) + 100,
    }));

  const baseHeroSlides = bannerPayload.length
    ? bannerPayload.map(normalizeBanner)
    : systemHeroPayload.length
      ? systemHeroPayload.map(normalizeSystemHeroImage)
      : [];

  const heroSlides = [...baseHeroSlides, ...offerHeroSlides].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  const categoryLogoImages = categoryLogosRes.status === "fulfilled" ? categoryLogosRes.value : [];
  const adImages = adImagesRes.status === "fulfilled"
    ? adImagesRes.value.map((item) => item?.url).filter(Boolean)
    : [];

  const ladiesDeals =
    dealProductsRes.status === "fulfilled" && dealProductsRes.value.length
      ? dealProductsRes.value
      : ladiesDealsFallback.status === "fulfilled"
        ? ladiesDealsFallback.value
        : [];

  return {
    heroSlides,
    offers: offersRes.status === "fulfilled" ? offersRes.value : [],
    activeDrops: activeDropRes.status === "fulfilled" ? activeDropRes.value : [],
    activeDrop: activeDropRes.status === "fulfilled" && activeDropRes.value.length > 0 ? activeDropRes.value[0] : null,
    ladiesArrivals: ladiesArrivals.status === "fulfilled" ? ladiesArrivals.value : [],
    ladiesDeals,
    gentsArrivals: gentsArrivals.status === "fulfilled" ? gentsArrivals.value : [],
    trending:
      trending.status === "fulfilled"
        ? [...trending.value].sort((a, b) => b.trendScore - a.trendScore).slice(0, 8)
        : [],
    categoryImages: {
      ladies: {
        main: findImageForCategory(categoryLogoImages, "Ladies", "Women"),
        Dresses: findImageForCategory(categoryLogoImages, "Dresses"),
        Tops: findImageForCategory(categoryLogoImages, "Tops"),
        Bottoms: findImageForCategory(categoryLogoImages, "Bottoms"),
        Sarees: findImageForCategory(categoryLogoImages, "Sarees"),
        Lingerie: findImageForCategory(categoryLogoImages, "Lingerie"),
        Accessories: findImageForCategory(categoryLogoImages, "Ladies Accessories", "Women Accessories"),
      },
      gents: {
        main: findImageForCategory(categoryLogoImages, "Gents", "Men", "Mens"),
        Shirts: findImageForCategory(categoryLogoImages, "Shirts"),
        Trousers: findImageForCategory(categoryLogoImages, "Trousers"),
        Casual: findImageForCategory(categoryLogoImages, "Casual"),
        Formal: findImageForCategory(categoryLogoImages, "Formal"),
        Accessories: findImageForCategory(categoryLogoImages, "Gents Accessories", "Men Accessories"),
      },
      unisex: {
        main: findImageForCategory(categoryLogoImages, "Unisex"),
        Unisex: findImageForCategory(categoryLogoImages, "Unisex"),
      },
    },
    socialImages: adImages,
  };
};

// Featured reviews → testimonials. Backed by the real public endpoint
// `/reviews/featured` (approved reviews, sorted by helpful + recency). Maps the
// review/user/product shape into the flat fields the testimonial cards read.
const mapFeaturedReview = (r) => {
  const u = r.user || r.userId || {};
  const first = String(u.firstName || "").trim();
  const last = String(u.lastName || "").trim();
  const full = `${first} ${last}`.trim();
  const name =
    full || (u.email ? String(u.email).split("@")[0] : "Verified Buyer");
  const product = r.product || r.productId || null;
  return {
    _id: r._id,
    rating: Number(r.rating) || 0,
    title: r.title || "",
    content: r.content || r.comment || "",
    createdAt: r.createdAt || r.approvedAt || null,
    helpfulCount: Number(r.helpfulCount) || 0,
    verifiedPurchase: Boolean(r.verifiedPurchase),
    customer: { name, avatar: u.profilePicture || null },
    product: product?.name || null,
  };
};

export const fetchTopReviews = async (limit = 5) => {
  try {
    const res = await axios.get(`${API_BASE}/reviews/featured`, { params: { limit } });
    const list = res?.data?.data || [];
    return (Array.isArray(list) ? list : []).map(mapFeaturedReview);
  } catch (err) {
    console.warn("Could not fetch top reviews", err);
    return [];
  }
};

// Live, computed store statistics. Hits the public `/stats/public` endpoint;
// consumers hide any card whose metric is falsy, so we pass values through raw.
export const fetchStoreStats = async () => {
  try {
    const res = await axios.get(`${API_BASE}/stats/public`);
    return res?.data?.data || null;
  } catch (err) {
    console.warn("Could not fetch store stats", err);
    return null;
  }
};

// Admin-managed site settings (contact / social / footer) sourced from the
// public `/site-config/about` payload. The raw config is keyed with `shop_*` /
// `footer_*` prefixes; this flattens it into the shape the footer + social
// sections consume. Returns null on failure so callers fall back gracefully.
const joinAddress = (a) =>
  [
    a.shop_address_line1,
    a.shop_address_line2,
    a.shop_address_city,
    a.shop_address_postal,
    a.shop_address_country,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");

export const fetchSiteSettings = async () => {
  try {
    const res = await axios.get(`${API_BASE}/site-config/about`);
    const a = res?.data?.data || {};
    return {
      brandName: a.shop_brand_name || "",
      phone: a.shop_contact_phone || "",
      email: a.shop_contact_email || a.shop_support_email || "",
      whatsapp: a.shop_whatsapp_number || "",
      address: joinAddress(a),
      hours: a.shop_hours || "",
      mapEmbedUrl: a.shop_map_embed_url || "",
      instagramUrl: a.shop_social_instagram || CONTACT_INFO.socials.instagram || "",
      facebookUrl: a.shop_social_facebook || CONTACT_INFO.socials.facebook || "",
      youtubeUrl: a.shop_social_youtube || "",
      twitterUrl: a.shop_social_twitter || "",
      tiktokUrl: a.shop_social_tiktok || CONTACT_INFO.socials.tiktok || "",
      brandDescription: a.footer_brand_description || "",
      copyright: a.footer_copyright || "",
      quickLinks: Array.isArray(a.footer_quick_links) ? a.footer_quick_links : [],
      shopLinks: Array.isArray(a.footer_shop_links) ? a.footer_shop_links : [],
      supportLinks: Array.isArray(a.footer_support_links) ? a.footer_support_links : [],
      paymentMethods: Array.isArray(a.footer_payment_methods)
        ? a.footer_payment_methods
        : [],
    };
  } catch (err) {
    console.warn("Could not fetch site settings", err);
    return null;
  }
};

// Homepage "Shop by Category" tiles, driven by the real Category collection.
// Prefers top-level active categories flagged `showOnHome`; falls back to
// featured, then any active top-level. Each carries its own admin image
// (populated `imageRef.url`); missing images fall back to a category-logo match
// and finally a branded placeholder so a tile never renders broken.
export const fetchHomeCategories = async (limit = 6) => {
  try {
    const [catRes, logos] = await Promise.all([
      axios.get(`${API_BASE}/categories`),
      fetchCategoryLogoImages().catch(() => []),
    ]);
    const all = Array.isArray(catRes?.data?.data) ? catRes.data.data : [];
    const topLevel = all.filter((c) => c?.isActive && !c?.parentCategory);

    let chosen = topLevel.filter((c) => c.showOnHome);
    if (chosen.length === 0) chosen = topLevel.filter((c) => c.isFeatured);
    if (chosen.length === 0) chosen = topLevel;

    return chosen.slice(0, limit).map((c) => ({
      name: c.name,
      slug: c.slug,
      href: `/shopping/product-list?category=${encodeURIComponent(c.slug)}`,
      img:
        c.imageRef?.url ||
        findImageForCategory(logos, c.name, c.slug) ||
        "/placeholder.jpg",
    }));
  } catch (err) {
    console.warn("Could not fetch home categories", err);
    return [];
  }
};
