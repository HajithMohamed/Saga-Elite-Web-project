import React, { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { addToCartAction, addToWishlistAction, removeFromWishlistAction } from "@/store/cart-slice";
import { toast } from "@/hooks/use-toast";
import { Heart, ShoppingBag, ArrowRight } from "lucide-react";

const API_BASE = `${import.meta.env.VITE_API_URL}/v1`;

const ProductListing = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedVariants, setSelectedVariants] = useState({});
  const [quantities, setQuantities] = useState({});

  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items: wishlistItems } = useSelector((state) => state.cart.wishlist);
  const category = searchParams.get("category") || "";

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const query = category
          ? `?category=${encodeURIComponent(category)}&limit=30`
          : "?limit=30";

        const response = await axios.get(
          `${API_BASE}/products/get-all-products${query}`
        );

        setProducts(response.data.data || []);
      } catch (error) {
        setError(error?.response?.data?.message || error.message);

        toast({
          title: "Could not load products",
          description:
            error?.response?.data?.message || error.message || "Something went wrong",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  const handleVariantChange = (productId, sku) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: sku,
    }));
  };

  const handleQuantityChange = (productId, value) => {
    const qty = Math.max(1, Number(value) || 1);
    setQuantities((prev) => ({
      ...prev,
      [productId]: qty,
    }));
  };

  const handleAddToCart = (product) => {
    const variantSku =
      selectedVariants[product._id] || product.variants?.[0]?.sku;

    const variant = product.variants.find((v) => v.sku === variantSku);

    if (!variant) {
      toast({
        title: "Variant missing",
        description: "Please select a valid product variant.",
        variant: "destructive",
      });
      return;
    }

    const quantity = quantities[product._id] || 1;

    if (quantity > variant.stock) {
      toast({
        title: "Stock limit reached",
        description: `Only ${variant.stock} items available.`,
        variant: "destructive",
      });
      return;
    }

    const basePrice =
      product.basePrice + (variant.priceAdjustment || 0);

    const discountedPrice =
      basePrice * (1 - (product.discountPercent || 0) / 100);

    dispatch(
      addToCartAction({
        productId: product._id,
        variantId: variant._id,
        quantity,
      })
    )
      .unwrap()
      .then(() => {
        toast({
          title: "Added to cart",
          description: `${product.name} added successfully.`,
          variant: "success",
        });
      })
      .catch((err) => {
        toast({
          title: "Failed to add",
          description: err?.message || err || "Could not add to cart.",
          variant: "destructive",
        });
      });
  };

  const handleBuyNow = (product) => {
    const variantSku = selectedVariants[product._id] || product.variants?.[0]?.sku;
    const variant = product.variants.find((v) => v.sku === variantSku);

    if (!variant || (quantities[product._id] || 1) > variant.stock) {
      toast({
        title: "Stock limit reached or invalid variant",
        variant: "destructive",
      });
      return;
    }

    const quantity = quantities[product._id] || 1;

    dispatch(
      addToCartAction({
        productId: product._id,
        variantId: variant._id,
        quantity,
      })
    )
      .unwrap()
      .then(() => {
        navigate("/shopping/checkout");
      })
      .catch((err) => {
        toast({
          title: "Failed to process",
          description: err?.message || err || "Could not proceed to checkout.",
          variant: "destructive",
        });
      });
  };

  const toggleWishlist = (product) => {
    const isInWishlist = wishlistItems.some((item) => item.id === product._id);
    if (isInWishlist) {
      dispatch(removeFromWishlistAction(product._id));
      toast({ title: "Removed from Wishlist" });
    } else {
      dispatch(addToWishlistAction({ productId: product._id }));
      toast({ title: "Added to Wishlist", variant: "success" });
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] text-white py-10">
      <div className="container mx-auto px-4 md:px-8">

        {/* Header */}
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-widest">
              Shop the Drop
            </h1>
            <p className="mt-2 text-sm text-gray-400 max-w-2xl">
              Browse products, choose variants, and add to cart.
            </p>
          </div>

          <Link
            to="/shopping/checkout"
            className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-bold uppercase text-black tracking-widest"
          >
            Checkout
          </Link>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-3xl bg-[#111]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/30 bg-[#111] p-6 text-red-300">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-gray-800 bg-[#111] p-10 text-center text-gray-400">
            No products found.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

            {products.map((product) => {
              const variantSku =
                selectedVariants[product._id] ||
                product.variants?.[0]?.sku;

              const variant =
                product.variants.find((v) => v.sku === variantSku) ||
                product.variants?.[0];

              const quantity = quantities[product._id] || 1;

              const basePrice =
                product.basePrice +
                (variant?.priceAdjustment || 0);

              const price =
                basePrice *
                (1 - (product.discountPercent || 0) / 100);

              return (
                <div
                  key={product._id}
                  className="group relative rounded-[2rem] border border-white/5 bg-gradient-to-b from-[#0a0a0a] to-[#040404] p-5 overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[#D4AF37]/5"
                >
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden rounded-2xl bg-[#000]">
                    <img
                      src={
                        product.images?.[0]?.url ||
                        "/placeholder.jpg"
                      }
                      className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                      alt={product.name}
                    />
                    
                    <button
                      onClick={() => toggleWishlist(product)}
                      className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-md transition-colors hover:bg-[#D4AF37]/20"
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          wishlistItems.some((item) => item.id === product._id)
                            ? "fill-[#D4AF37] text-[#D4AF37]"
                            : "text-white"
                        }`}
                      />
                    </button>
                    <Link
                      to={`/shopping/product/${product.slug}`}
                      className="absolute bottom-4 left-4 z-10 flex h-8 items-center gap-1 rounded-full bg-black/60 px-4 text-xs font-semibold uppercase tracking-wider backdrop-blur-md transition-colors hover:bg-[#D4AF37] hover:text-black"
                    >
                      Details <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="pt-6 space-y-4">
                    <div>
                      <div className="flex justify-between items-start">
                        <p className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest">
                          {product.category}
                        </p>
                        {product.isLimited && (
                          <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded-full bg-[#D4AF37]/10">
                            Limited Drop
                          </span>
                        )}
                      </div>
                      <h2 className="mt-2 text-xl font-medium tracking-wide">
                        {product.name}
                      </h2>
                      <p className="mt-1 text-sm text-gray-400 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Variant */}
                      <select
                        value={variantSku}
                        onChange={(e) =>
                          handleVariantChange(
                            product._id,
                            e.target.value
                          )
                        }
                        className="w-2/3 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-gray-200 outline-none transition-colors focus:border-[#D4AF37]/50 focus:bg-white/10 text-black"
                      >
                        {product.variants.map((v) => (
                          <option key={v.sku} value={v.sku} className="text-black">
                            {v.size} / {v.color} ({v.stock} left)
                          </option>
                        ))}
                      </select>

                      {/* Quantity */}
                      <input
                        type="number"
                        min="1"
                        max={variant?.stock || 1}
                        value={quantity}
                        onChange={(e) =>
                          handleQuantityChange(
                            product._id,
                            e.target.value
                          )
                        }
                        className="w-1/3 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-center text-gray-200 outline-none transition-colors focus:border-[#D4AF37]/50 focus:bg-white/10"
                      />
                    </div>

                    {/* Price & Actions */}
                    <div className="pt-2 flex flex-col gap-3">
                      <div className="text-2xl font-semibold tracking-wide flex items-center gap-2">
                        <span>LKR {price.toLocaleString()}</span>
                        {product.discountPercent > 0 && (
                          <span className="text-sm text-gray-500 line-through">
                            LKR {basePrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleBuyNow(product)}
                          className="flex-1 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#F2CA50]"
                        >
                          Buy Now
                        </button>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20"
                          title="Add to Cart"
                        >
                          <ShoppingBag className="h-5 w-5" />
                        </button>
                      </div>
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