import React, { useEffect, useState } from "react";
import axios from "axios";
import { Layers } from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import ProductCard from "@/components/shopping-components/ProductCard";

/*
 * "Complete the Look" rail — complementary, cross-category products that pair
 * with the given product (e.g. a t-shirt → matching jeans). Data comes from the
 * public /products/:id/complete-the-look endpoint, which blends curated related
 * products, co-purchase frequency and a complementary-category heuristic.
 * Self-hides when the API returns nothing.
 */
const CompleteTheLook = ({ productId, limit = 8 }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    setLoading(true);
    axios
      .get(`${API_BASE}/products/${productId}/complete-the-look`, {
        params: { limit },
      })
      .then((res) => {
        if (!cancelled) setProducts(res.data?.data?.recommendations || []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, limit]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="mt-24">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-gold-ink" />
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold-ink2">
              Style it with
            </p>
            <h2 className="text-[32px] font-sans font-bold tracking-tight text-ink-2">
              Complete the Look
            </h2>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[320px] animate-pulse rounded-[20px] bg-panel"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4">
          {products.slice(0, limit).map((p, idx) => (
            <ProductCard key={p._id} product={p} index={idx} />
          ))}
        </div>
      )}
    </section>
  );
};

export default CompleteTheLook;
