import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import ReviewList from "@/components/Review/ReviewList";

const API_BASE = `${import.meta.env.VITE_API_URL}/v1`;

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
    <div className="min-h-screen bg-[#060606] text-white">
      <div className="container mx-auto max-w-7xl px-4 py-10">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/40">
          <Link to="/shopping/home" className="hover:text-white">
            Home
          </Link>
          <span>/</span>
          <Link to="/shopping/product-list" className="hover:text-white">
            Products
          </Link>
          <span>/</span>
          <span className="text-[#D4AF37]">Reviews</span>
        </nav>

        {product ? (
          <div className="mb-8 flex flex-col gap-6 rounded-3xl border border-white/10 bg-[#0b0b0b] p-6 md:flex-row md:items-center">
            <img
              src={product.images?.[0]?.url || "/placeholder.jpg"}
              alt={product.name}
              className="h-28 w-24 rounded-2xl object-cover"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]">
                Product reviews
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">
                {product.name}
              </h1>
              <Link
                to={`/shopping/product/${product.slug}`}
                className="mt-2 inline-flex text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white"
              >
                Back to product
              </Link>
            </div>
          </div>
        ) : (
          <div className="mb-8 rounded-3xl border border-white/10 bg-[#0b0b0b] p-6 text-white/60">
            {error || "Loading product details..."}
          </div>
        )}

        <ReviewList productId={productId} />
      </div>
    </div>
  );
};

export default ProductReviewsPage;
