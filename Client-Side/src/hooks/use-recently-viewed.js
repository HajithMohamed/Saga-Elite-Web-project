import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "saga-elite:recently-viewed:v1";

const readStorage = () => {
  try {
    const raw =
      typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY)
        : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStorage = (items) => {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota exceeded or storage disabled — silently no-op */
  }
};

const pickLite = (product) => {
  if (!product || !product._id) return null;
  const images = Array.isArray(product.images)
    ? product.images.slice(0, 2).map((img) => ({
        url: img?.url || "",
        colorTag: img?.colorTag || "",
      }))
    : [];
  const variants = Array.isArray(product.variants)
    ? product.variants.map((v) => ({
        _id: v?._id,
        size: v?.size,
        color: v?.color,
        stock: Number(v?.stock || 0),
      }))
    : [];
  return {
    _id: product._id,
    slug: product.slug,
    name: product.name,
    basePrice: Number(product.basePrice || 0),
    discountPercent: Number(product.discountPercent || 0),
    images,
    variants,
    isLimited: Boolean(product.isLimited),
    isRare: Boolean(product.isRare),
    totalStock: Number(
      product.totalStock ??
        variants.reduce((sum, v) => sum + Math.max(0, Number(v.stock || 0)), 0)
    ),
    drop: product.drop ? { endDate: product.drop.endDate } : null,
    dropId: product.dropId || null,
    soldCount: Number(product.soldCount || 0),
    wishCount: Number(product.wishCount || 0),
    createdAt: product.createdAt || null,
  };
};

export default function useRecentlyViewed({ max = 8 } = {}) {
  const [items, setItems] = useState(() => readStorage());

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setItems(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const push = useCallback(
    (product) => {
      const lite = pickLite(product);
      if (!lite || !lite.slug) return;
      setItems((current) => {
        const filtered = current.filter((p) => p._id !== lite._id);
        const next = [lite, ...filtered].slice(0, max);
        writeStorage(next);
        return next;
      });
    },
    [max]
  );

  const clear = useCallback(() => {
    setItems([]);
    try {
      if (typeof window !== "undefined")
        window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* no-op */
    }
  }, []);

  return { items, push, clear };
}
