import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import ReviewList from "@/components/Review/ReviewList";
import { API_V1_URL as API_BASE } from "@/lib/api";

const ProductReviewsPage = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setError(null);
        const response = await axios.get(
          `${API_BASE}/products/get-single-product/${productId}`
        );
        setProduct(response.data?.product || null);
      } catch (err) {
        setError(
          err.response?.data?.message || err.message || "Unable to load product"
        );
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="container mx-auto max-w-7xl px-4 py-10">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink/40">
          <Link to="/shopping/home" className="hover:text-ink">
            Home
          </Link>
          <span>/</span>
          <Link to="/shopping/product-list" className="hover:text-ink">
            Products
          </Link>
          <span>/</span>
          <span className="text-gold-ink2">Reviews</span>
        </nav>

        {product ? (
          <div className="mb-8 flex flex-col gap-6 rounded-3xl border border-ink/10 bg-page p-6 md:flex-row md:items-center">
            <img
              src={product.images?.[0]?.url || "/placeholder.jpg"}
              alt={product.name}
              className="h-28 w-24 rounded-2xl object-cover"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold-ink2">
                Product reviews
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-ink">
                {product.name}
              </h1>
              <Link
                to={`/shopping/product/${product.slug}`}
                className="mt-2 inline-flex text-xs uppercase tracking-[0.2em] text-ink/60 hover:text-ink"
              >
                Back to product
              </Link>
            </div>
          </div>
        ) : (
          <div className="mb-8 rounded-3xl border border-ink/10 bg-page p-6 text-ink/60">
            {error || "Loading product details..."}
          </div>
        )}

        <ReviewList productId={productId} />
      </div>
    </div>
  );
};

export default ProductReviewsPage;
