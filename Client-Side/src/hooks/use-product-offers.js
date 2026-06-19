import { useState, useEffect } from "react";
import axios from "axios";
import { API_V1_URL } from "@/lib/api";

let cachedOffers = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 120_000;

const fetchOffers = async () => {
  const now = Date.now();
  if (cachedOffers && now - cacheTimestamp < CACHE_TTL_MS) return cachedOffers;
  const { data } = await axios.get(`${API_V1_URL}/offers?featured=false`);
  cachedOffers = data?.data?.offers || [];
  cacheTimestamp = now;
  return cachedOffers;
};

const productMatchesOffer = (product, offer) => {
  if (!product?._id) return false;
  const pid = String(product._id);
  const productCats = [
    product.category,
    product.subCategory,
    ...(product.categoryPath || "").split("/"),
  ]
    .filter(Boolean)
    .map((c) => c.toLowerCase().trim());

  const offerProductIds = (offer.products || []).map((p) =>
    String(p._id || p)
  );

  if (offer.type === "product_discount" || offer.type === "fixed_amount") {
    if (offerProductIds.includes(pid)) return true;
  }

  if (
    ["category_discount", "clearance", "aging_stock", "new_product", "seasonal", "flash", "percentage_discount"].includes(offer.type)
  ) {
    if (offerProductIds.includes(pid)) return true;
    const offerCategories = (offer.applicableCategories || []).map((c) =>
      c.toLowerCase().trim()
    );
    if (offerCategories.some((oc) => productCats.includes(oc))) return true;
  }

  return false;
};

const getBestOfferForProduct = (product, offers) => {
  const matching = offers.filter((o) => {
    if (!o.isActive) return false;
    const now = Date.now();
    if (o.startsAt && new Date(o.startsAt).getTime() > now) return false;
    if (o.endsAt && new Date(o.endsAt).getTime() < now) return false;
    return productMatchesOffer(product, o);
  });

  if (matching.length === 0) return null;

  matching.sort((a, b) => {
    const aPct = Number(a.discountPercent || 0);
    const bPct = Number(b.discountPercent || 0);
    return bPct - aPct;
  });

  return matching[0];
};

export function useProductOffers(product) {
  const [offers, setOffers] = useState(cachedOffers || []);
  const [loading, setLoading] = useState(!cachedOffers);

  useEffect(() => {
    let mounted = true;
    fetchOffers()
      .then((data) => {
        if (mounted) {
          setOffers(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const bestOffer = getBestOfferForProduct(product, offers);

  return { bestOffer, offers, loading };
}

export function useAllOffers() {
  const [offers, setOffers] = useState(cachedOffers || []);
  const [loading, setLoading] = useState(!cachedOffers);

  useEffect(() => {
    let mounted = true;
    fetchOffers()
      .then((data) => {
        if (mounted) {
          setOffers(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { offers, loading };
}
