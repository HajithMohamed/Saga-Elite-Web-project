import React, { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useSearchParams, Link } from "react-router-dom";
import { addToCart } from "@/store/order-slice";
import { toast } from "@/hooks/use-toast";

const API_BASE = `${import.meta.env.VITE_API_URL}/v1`;

const ProductListing = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedVariants, setSelectedVariants] = useState({});
  const [quantities, setQuantities] = useState({});

  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();

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
      addToCart({
        cartId: `${product._id}-${variant.sku}`,
        productId: product._id,
        productName: product.name,
        variantSku: variant.sku,
        variantName: `${variant.size} / ${variant.color}`,
        quantity,
        unitPrice: Number(discountedPrice.toFixed(2)),
        imageUrl: product.images?.[0]?.url || "/placeholder.jpg",
      })
    );

    toast({
      title: "Added to cart",
      description: `${product.name} added successfully.`,
      variant: "success",
    });
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
                  className="rounded-3xl border border-[#222] bg-[#0d0d0d] overflow-hidden"
                >
                  {/* Image */}
                  <div className="h-72 bg-[#111]">
                    <img
                      src={
                        product.images?.[0]?.url ||
                        "/placeholder.jpg"
                      }
                      className="h-full w-full object-cover"
                      alt={product.name}
                    />
                  </div>

                  <div className="p-6 space-y-4">

                    <div>
                      <p className="text-xs text-[#D4AF37] uppercase tracking-widest">
                        {product.category}
                      </p>
                      <h2 className="text-lg font-semibold">
                        {product.name}
                      </h2>
                      <p className="text-sm text-gray-400">
                        {product.description}
                      </p>
                    </div>

                    {/* Variant */}
                    <select
                      value={variantSku}
                      onChange={(e) =>
                        handleVariantChange(
                          product._id,
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl bg-[#111] border border-gray-700 p-3 text-sm"
                    >
                      {product.variants.map((v) => (
                        <option key={v.sku} value={v.sku}>
                          {v.size} / {v.color} ({v.stock})
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
                      className="w-full rounded-xl bg-[#111] border border-gray-700 p-3 text-sm"
                    />

                    {/* Price */}
                    <div className="text-[#D4AF37] font-bold">
                      ₹{price.toFixed(2)}
                    </div>

                    {/* Button */}
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-full rounded-full bg-[#D4AF37] py-3 text-black font-bold uppercase tracking-widest"
                    >
                      Add to Cart
                    </button>
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