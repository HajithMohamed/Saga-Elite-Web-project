import React, { useEffect, useState } from "react";
import axios from "axios";
<<<<<<< HEAD
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
=======
import { useDispatch } from "react-redux";
import { useSearchParams, Link } from "react-router-dom";
import { addToCart } from "@/store/order-slice";
import { toast } from "@/hooks/use-toast";

const API_BASE = `${import.meta.env.VITE_API_URL}/v1`;

const ProductListing = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [quantities, setQuantities] = useState({});
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();

  const category = searchParams.get("category") || "";

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const query = category ? `?category=${encodeURIComponent(category)}&limit=30` : "?limit=30";
        const response = await axios.get(`${API_BASE}/products/get-all-products${query}`);
        setProducts(response.data.data || []);
      } catch (error) {
        toast({
          title: "Could not load products",
          description: error?.response?.data?.message || error.message,
          variant: "destructive",
        });
>>>>>>> 8fdbd2946fdad1c686ebf23637121492c0fefd87
      } finally {
        setIsLoading(false);
      }
    };

<<<<<<< HEAD
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
=======
    fetchProducts();
  }, [category]);

  const handleVariantChange = (productId, sku) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: sku }));
  };

  const handleQuantityChange = (productId, value) => {
    const count = Math.max(1, Number(value) || 1);
    setQuantities((prev) => ({ ...prev, [productId]: count }));
  };

  const handleAddToCart = (product) => {
    const variantSku = selectedVariants[product._id] || product.variants?.[0]?.sku;
    const variant = product.variants.find((item) => item.sku === variantSku);

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
        description: `Only ${variant.stock} items are available for this variant.`,
        variant: "destructive",
      });
      return;
    }

    const priceBase = product.basePrice + (variant.priceAdjustment || 0);
    const discountedPrice = priceBase * (1 - (product.discountPercent || 0) / 100);

    dispatch(
      addToCart({
        cartId: `${product._id}-${variant.sku}`,
        productId: product._id,
        productName: product.name,
        variantSku: variant.sku,
        variantName: `${variant.size} / ${variant.color}`,
        quantity,
        unitPrice: Number(discountedPrice.toFixed(2)),
        imageUrl: product.images?.[0]?.url || "/placeholder.jpg",
      }),
    );

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
      variant: "success",
    });
  };

  return (
    <div className="min-h-screen bg-[#060606] text-white py-10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-widest text-white">Shop the Drop</h1>
            <p className="mt-2 text-sm text-gray-400 max-w-2xl">
              Browse the latest releases and add items to your cart. Select the variant you want and checkout using online payment or WhatsApp receipt confirmation.
            </p>
          </div>
          <Link
            to="/shopping/checkout"
            className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-bold uppercase text-black tracking-[0.2em] transition hover:bg-[#b99329]"
          >
            Go to Checkout
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-80 animate-pulse rounded-3xl bg-[#111111]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-[#D4AF37]/10 bg-[#090909] p-10 text-center">
            <p className="text-sm text-gray-400">No products found for this category.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const variantSku = selectedVariants[product._id] || product.variants?.[0]?.sku;
              const variant = product.variants.find((item) => item.sku === variantSku) || product.variants[0];
              const quantity = quantities[product._id] || 1;
              const priceBase = product.basePrice + (variant?.priceAdjustment || 0);
              const discountedPrice = priceBase * (1 - (product.discountPercent || 0) / 100);

              return (
                <div key={product._id} className="overflow-hidden rounded-3xl border border-[#D4AF37]/10 bg-[#090909] shadow-xl">
                  <div className="h-72 overflow-hidden bg-[#121212]">
                    <img
                      src={product.images?.[0]?.url || "/placeholder.jpg"}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    />
                  </div>
                  <div className="space-y-4 p-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">{product.category}</p>
                      <h2 className="mt-2 text-xl font-semibold text-white">{product.name}</h2>
                      <p className="mt-2 text-sm text-gray-400 line-clamp-3">{product.description}</p>
                    </div>

                    <div className="grid gap-3">
                      <div>
                        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-gray-500">
                          Variant
                        </label>
                        <select
                          value={variantSku}
                          onChange={(event) => handleVariantChange(product._id, event.target.value)}
                          className="w-full rounded-2xl border border-gray-700 bg-[#080808] px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
                        >
                          {product.variants.map((item) => (
                            <option key={item.sku} value={item.sku}>
                              {item.size} / {item.color} ({item.stock} left)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-gray-500">
                            Qty
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={variant?.stock || 1}
                            value={quantity}
                            onChange={(event) => handleQuantityChange(product._id, event.target.value)}
                            className="w-full rounded-2xl border border-gray-700 bg-[#080808] px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-gray-500">
                            Price
                          </label>
                          <div className="rounded-2xl border border-gray-700 bg-[#080808] px-4 py-3 text-sm text-white">
                            ₹{discountedPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-full rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-black transition hover:bg-[#b99329]"
                    >
                      Add to cart
                    </button>
>>>>>>> 8fdbd2946fdad1c686ebf23637121492c0fefd87
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
