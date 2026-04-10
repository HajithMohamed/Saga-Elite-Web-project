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
      } finally {
        setIsLoading(false);
      }
    };

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
