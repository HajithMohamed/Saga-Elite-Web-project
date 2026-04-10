import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "@/hooks/use-toast";
import {
  addToCartAction,
  addToWishlistAction,
  fetchCartAction,
  fetchWishlistAction,
} from "@/store/cart-slice";
import { Loader2, ShoppingCart, Heart, ArrowRight } from "lucide-react";

const API_BASE = `${import.meta.env.VITE_API_URL}/v1`;

const categoryMap = {
  unisex: "Unisex",
  boys: "Boys",
  girls: "Girls",
};

const ProductListing = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { wishlist } = useSelector((state) => state.cart);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const category = new URLSearchParams(location.search).get("category") || "";
  const categoryLabel = categoryMap[category.toLowerCase()]
    ? categoryMap[category.toLowerCase()]
    : category === "drops"
    ? "Latest Drop"
    : category === "archive"
    ? "Archive"
    : "All Products";

  useEffect(() => {
    dispatch(fetchCartAction());
    dispatch(fetchWishlistAction());
  }, [dispatch]);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const filterParam = categoryMap[category.toLowerCase()]
          ? `?category=${categoryMap[category.toLowerCase()]}`
          : "?page=1&limit=20";
        const response = await axios.get(
          `${API_BASE}/products/get-all-products${filterParam}`
        );
        setProducts(response.data.data || []);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Unable to load products");
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [category]);

  const handleAddToCart = async (product) => {
    try {
      await dispatch(
        addToCartAction({
          productId: product._id,
          variantId: product.variants?.[0]?._id,
          quantity: 1,
        })
      ).unwrap();
      toast({
        title: "Added to cart",
        description: `${product.name} was added to your cart.`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Failed to add cart",
        description: typeof err === "string" ? err : err?.message || "Try again later.",
        variant: "destructive",
      });
    }
  };

  const handleAddToWishlist = async (product) => {
    try {
      await dispatch(addToWishlistAction({ productId: product._id })).unwrap();
      toast({
        title: "Added to wishlist",
        description: `${product.name} was added to your wishlist.`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Wishlist error",
        description: typeof err === "string" ? err : err?.message || "Try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] text-white pt-10 pb-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-[0.25em] text-white">
              {categoryLabel}
            </h1>
            <p className="text-gray-400 mt-3 max-w-2xl">
              Discover rare pieces curated for every drop. Add favorites to your wishlist or secure them in your cart.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-gray-400">
            <span>{products.length} items</span>
            <span className="hidden sm:inline">•</span>
            <span>{wishlist.items.length || 0} wishlist items</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-[50vh]">
            <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37]" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-[#111] p-8 text-red-300">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map((product) => {
              const isWishlisted = wishlist.items.some((item) => item.id === product._id);
              const price = Math.round(
                (product.basePrice + (product.variants?.[0]?.priceAdjustment || 0)) *
                  (1 - (product.discountPercent || 0) / 100)
              );

              return (
                <div key={product._id} className="group bg-[#0d0d0d] border border-neutral-800 rounded-3xl overflow-hidden shadow-xl hover:border-[#D4AF37]/50 transition-colors">
                  <div className="relative aspect-[4/5] bg-neutral-950 overflow-hidden">
                    <img
                      src={product.images?.[0]?.url || "/LOGO.png"}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 rounded-full bg-black/70 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#D4AF37]">
                      {product.category}
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold uppercase tracking-[0.1em] text-white">
                          {product.name}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">{product.brand}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#D4AF37]">LKR {price.toLocaleString()}</p>
                        {product.discountPercent > 0 && (
                          <p className="text-xs text-gray-500 line-through">LKR {product.basePrice.toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] py-3 text-sm font-bold uppercase tracking-widest text-black transition-colors hover:bg-amber-300"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddToWishlist(product)}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-700 bg-transparent py-3 text-sm uppercase tracking-widest text-gray-300 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                      >
                        <Heart className={`w-4 h-4 ${isWishlisted ? "text-[#D4AF37]" : "text-gray-300"}`} />
                        {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListing;
