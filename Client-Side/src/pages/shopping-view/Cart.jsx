import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Gift,
  Heart,
  Loader2,
  Lock,
  Minus,
  Plus,
  Trash2,
  Clock,
  Archive,
  ShieldCheck,
  Package,
  Tag,
} from "lucide-react";
import {
  fetchCartAction,
  removeFromCartAction,
  updateCartItemAction,
  addToWishlistAction,
} from "@/store/cart-slice";
import { toast } from "@/hooks/use-toast";
import ProductCard from "@/components/shopping-components/ProductCard";
import { Btn, Eyebrow, Hairline } from "@/components/ui/editorial";
import usePageMeta from "@/hooks/use-page-meta";
import { useAllOffers } from "@/hooks/use-product-offers";

const formatLKR = (value = 0) =>
  `LKR ${(Number(value) || 0).toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;

const productImage = (product, variantColor) => {
  // Prefer an image tagged with the variant's color
  if (variantColor && Array.isArray(product?.images)) {
    const colorKey = variantColor.toLowerCase();
    const matched = product.images.find(
      (img) => String(img.colorTag || "").trim().toLowerCase() === colorKey
    );
    if (matched?.url) return matched.url;
  }
  return product?.image || product?.images?.[0]?.url || "/LOGO.png";
};

const variantLabel = (variant = {}) =>
  [variant?.size].filter(Boolean).join(" · ") || "Standard";

const errMsg = (err, fallback) =>
  typeof err === "string" ? err : err?.message || fallback;

const getDeliveryDates = () => {
  const d1 = new Date();
  d1.setDate(d1.getDate() + 3);
  const d2 = new Date();
  d2.setDate(d2.getDate() + 6);
  const options = { month: "short", day: "numeric" };
  return `${d1.toLocaleDateString("en-US", options)} — ${d2.toLocaleDateString("en-US", options)}`;
};

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  usePageMeta({ title: "Cart" });
  const [activeItemId, setActiveItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const { items = [], totalPrice = 0, totalQuantity = 0, isLoading } =
    useSelector((state) => state.cart.cart);

  const { offers } = useAllOffers();
  const [productList, setProductList] = useState([]);
  useEffect(() => {
    axios.get(`${API_BASE}/products/get-all-products?limit=4&sort=-soldCount`)
      .then(res => {
        if (res.data?.success) {
          setProductList(res.data.data || []);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const offerSavings = useMemo(() => {
    if (!offers.length || !items.length) return 0;
    let totalSaving = 0;
    for (const item of items) {
      const product = item.product;
      if (!product) continue;
      const pid = String(product._id || product.id);
      const productCats = [
        product.category, product.subCategory,
        ...(product.categoryPath || "").split("/"),
      ].filter(Boolean).map((c) => c.toLowerCase().trim());

      for (const offer of offers) {
        if (!offer.isActive) continue;
        const now = Date.now();
        if (offer.startsAt && new Date(offer.startsAt).getTime() > now) continue;
        if (offer.endsAt && new Date(offer.endsAt).getTime() < now) continue;

        const offerPids = (offer.products || []).map((p) => String(p._id || p));
        const offerCats = (offer.applicableCategories || []).map((c) => c.toLowerCase().trim());
        const matchesProduct = offerPids.includes(pid);
        const matchesCategory = offerCats.some((oc) => productCats.includes(oc));
        if (!matchesProduct && !matchesCategory) continue;

        const unitPrice = Number(item.unitPrice || product.basePrice || 0);
        const qty = Number(item.quantity || 1);
        if (offer.type === "fixed_amount" && offer.discountAmount) {
          totalSaving += Number(offer.discountAmount) * qty;
        } else if (offer.discountPercent) {
          totalSaving += unitPrice * qty * (Number(offer.discountPercent) / 100);
        }
        break;
      }
    }
    return totalSaving;
  }, [items, offers]);

  useEffect(() => {
    dispatch(fetchCartAction()).finally(() => setHasLoadedOnce(true));
  }, [dispatch]);

  const handleQuantity = async (item, quantity) => {
    if (
      quantity < 1 ||
      activeItemId === item.id ||
      removingItemId === item.id
    ) {
      return;
    }
    setActiveItemId(item.id);
    try {
      await dispatch(updateCartItemAction({ itemId: item.id, quantity })).unwrap();
    } catch (err) {
      toast({
        title: "Update failed",
        description: errMsg(err, "Unable to update quantity."),
        variant: "destructive",
      });
    } finally {
      setActiveItemId((c) => (c === item.id ? null : c));
    }
  };

  const handleRemove = async (itemId) => {
    if (activeItemId === itemId || removingItemId === itemId) return;
    setRemovingItemId(itemId);
    try {
      await dispatch(removeFromCartAction(itemId)).unwrap();
      toast({
        title: "Removed",
        description: "Piece removed from your selection.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Remove failed",
        description: errMsg(err, "Unable to remove this piece."),
        variant: "destructive",
      });
    } finally {
      setRemovingItemId((c) => (c === itemId ? null : c));
    }
  };

  const handleMoveToArchive = async (item) => {
    if (activeItemId === item.id || removingItemId === item.id) return;
    setRemovingItemId(item.id);
    try {
      if (item.product?._id) {
        await dispatch(addToWishlistAction(item.product._id)).unwrap();
      }
      await dispatch(removeFromCartAction(item.id)).unwrap();
      toast({
        title: "Archived",
        description: "Piece saved to your archive.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Action failed",
        description: errMsg(err, "Unable to move to archive."),
        variant: "destructive",
      });
    } finally {
      setRemovingItemId((c) => (c === item.id ? null : c));
    }
  };

  const handleProceed = () => {
    if (items.length === 0 || activeItemId || removingItemId) return;
    navigate("/shopping/checkout", {
      state: { cartItems: items, cartTotal: totalPrice },
    });
  };

  const showInitialLoader = !hasLoadedOnce && isLoading && items.length === 0;
  const busy = Boolean(activeItemId || removingItemId);

  if (showInitialLoader) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#0a0a0a] px-4 text-[#e5e2e1]">
        <div className="flex h-14 w-14 items-center justify-center border border-[#4d4635]">
          <Loader2 className="h-5 w-5 animate-spin text-[#f2ca50]" />
        </div>
        <p className="mt-6 se-label text-[10px] tracking-[0.32em] text-[#99907c]">
          Bringing your selection into view
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <section className="relative min-h-screen bg-[#0a0a0a] text-white pt-32 pb-24 flex items-center justify-center">
        <div className="absolute inset-0 z-0 bg-[url('/cart-empty-cinematic.jpg')] bg-cover bg-center bg-no-repeat opacity-20 filter grayscale blur-[2px]" />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent" />
        <div className="relative z-10 text-center max-w-2xl px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="w-24 h-24 rounded-full bg-[#131313] border border-[#1c1b1b] mx-auto flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(242,202,80,0.1)]">
              <Package className="w-10 h-10 text-[#f2ca50]" />
            </div>
            <h1 className="font-sans text-4xl md:text-5xl font-bold tracking-tight text-[#e5e2e1] mb-4">
              Your Shopping Cart is Empty
            </h1>
            <p className="text-[#99907c] text-sm md:text-base leading-relaxed mb-10 max-w-lg mx-auto">
              Looks like you haven't added any products yet. Take your time to discover garments designed for long-term wear and timeless styling.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/shopping/product-list" className="w-full sm:w-auto px-8 py-4 bg-[#f2ca50] text-[#0a0a0a] font-bold text-xs uppercase tracking-widest rounded-xl hover:brightness-110 transition-all">
                Browse Products
              </Link>
              <Link to="/shopping/wishlist" className="w-full sm:w-auto px-8 py-4 bg-transparent border border-[#4d4635] text-[#e5e2e1] font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all">
                View Saved Pieces
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  const freeShippingThreshold = 20000;
  const progressPercent = Math.min(100, (totalPrice / freeShippingThreshold) * 100);

  return (
    <section className="bg-[#0a0a0a] text-[#e5e2e1] min-h-screen pt-24 pb-32">
      {/* Breadcrumbs */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 mb-6">
        <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-[11px] uppercase tracking-widest text-[#99907c]">
          <Link to="/" className="hover:text-[#f2ca50] transition-colors">Home</Link>
          <span className="text-[#4d4635]">{'>'}</span>
          <span className="text-[#f2ca50] font-bold">Shopping Cart</span>
        </div>
      </div>

      {/* Page Hero */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 mb-10">
        <div className="h-[160px] md:h-[180px] lg:h-[220px] bg-[#131313] rounded-3xl border border-[#1c1b1b] flex flex-col justify-center px-6 md:px-12 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <h1 className="font-sans text-3xl md:text-5xl font-bold tracking-tight text-white relative z-10">
            Shopping Cart
          </h1>
          <p className="mt-3 text-sm md:text-base text-[#d0c5af] relative z-10">
            Review your selected items before proceeding to our secure checkout.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-[#4d4635] w-max relative z-10">
            <span className="w-2 h-2 rounded-full bg-[#f2ca50] animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-[#f2ca50] font-bold">
              {totalQuantity} {totalQuantity === 1 ? "Item" : "Items"} in Your Cart
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          
          {/* LEFT 65%: Cart Items */}
          <div className="w-full lg:w-[65%]">
            <div className="flex items-center justify-between pb-4 border-b border-[#4d4635]/60 mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#99907c]">Product Details</h2>
              <div className="hidden md:flex gap-16 text-sm font-bold uppercase tracking-widest text-[#99907c]">
                <span>Quantity</span>
                <span>Total</span>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const isUpdating = activeItemId === item.id;
                  const isRemoving = removingItemId === item.id;
                  const itemSubtotal = item.subTotal != null ? item.subTotal : (item.unitPrice || 0) * (item.quantity || 0);
                  const slug = item.product?.slug;
                  const variant = variantLabel(item.variant || {});
                  const colorHex = item.variant?.colorCode || null;
                  const colorName = item.variant?.color || "Standard";
                  const remainingStock = item.variant?.stock || item.product?.totalStock || 0;
                  
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: -50, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.4 }}
                      className="bg-[#131313] border border-[#1c1b1b] rounded-[20px] p-4 md:p-6 flex flex-col md:flex-row gap-6 relative group hover:border-[#4d4635] transition-colors"
                    >
                      {/* Image */}
                      <Link to={slug ? `/shopping/product/${slug}` : "#"} className="shrink-0">
                        <div className="w-[100px] h-[100px] md:w-[140px] md:h-[140px] bg-black rounded-2xl overflow-hidden border border-[#2a2a2a] relative">
                          <img
                            src={productImage(item.product, item.variant?.color)}
                            alt={item.product?.name || "Piece"}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </Link>

                      {/* Info Container */}
                      <div className="flex flex-col md:flex-row flex-1 justify-between gap-6">
                        
                        {/* Info Left */}
                        <div className="flex flex-col justify-center flex-1">
                          <div className="se-label text-[9px] tracking-[0.25em] text-[#99907c] uppercase mb-1">
                            {item.product?.brand?.name || "Saga Elite"} · {item.product?.category || "Apparel"}
                          </div>
                          <Link to={slug ? `/shopping/product/${slug}` : "#"}>
                            <h3 className="font-sans font-bold text-lg md:text-xl text-[#e5e2e1] truncate max-w-[280px] hover:text-[#f2ca50] transition-colors">
                              {item.product?.name || "Untitled piece"}
                            </h3>
                          </Link>
                          
                          <div className="mt-2 flex items-center gap-3">
                            <span className="text-xs text-[#d0c5af] bg-[#1c1b1b] px-3 py-1 rounded-full border border-[#2a2a2a]">{variant}</span>
                            {colorName !== "Standard" && (
                              <div className="flex items-center gap-2 bg-[#1c1b1b] px-3 py-1 rounded-full border border-[#2a2a2a]">
                                <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: colorHex }} />
                                <span className="text-[10px] uppercase tracking-wider text-[#d0c5af]">{colorName}</span>
                              </div>
                            )}
                          </div>

                          {/* Stock Badges */}
                          <div className="mt-3">
                            {remainingStock === 0 ? (
                              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-red-400 font-bold">
                                ✖ Out of Stock
                              </span>
                            ) : remainingStock <= 5 ? (
                              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#ffb4ab] font-bold">
                                ⚠ Only {remainingStock} Left
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-green-400 font-bold">
                                ✔ In Stock
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Controls Right */}
                        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-4">
                          
                          {/* Mobile Only Total */}
                          <div className="md:hidden flex flex-col">
                            <span className="font-sans font-bold text-lg text-[#f2ca50]">{formatLKR(itemSubtotal)}</span>
                            {item.quantity > 1 && <span className="text-[9px] text-[#99907c] uppercase tracking-widest">{formatLKR(item.unitPrice)} each</span>}
                          </div>

                          {/* Quantity Selector */}
                          <div className="flex items-center border border-[#4d4635] bg-[#0a0a0a] rounded-xl overflow-hidden h-12">
                            <button
                              type="button"
                              onClick={() => handleQuantity(item, (item.quantity || 1) - 1)}
                              disabled={isUpdating || isRemoving || (item.quantity || 1) <= 1}
                              className="w-10 h-full flex items-center justify-center text-[#99907c] hover:text-[#f2ca50] hover:bg-[#1c1b1b] transition-colors disabled:opacity-40"
                            >
                              <Minus size={14} strokeWidth={2} />
                            </button>
                            <span className="w-10 text-center font-sans font-bold text-[#e5e2e1]">
                              {isUpdating ? <Loader2 size={14} className="animate-spin mx-auto" /> : item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantity(item, (item.quantity || 1) + 1)}
                              disabled={isUpdating || isRemoving}
                              className="w-10 h-full flex items-center justify-center text-[#99907c] hover:text-[#f2ca50] hover:bg-[#1c1b1b] transition-colors disabled:opacity-40"
                            >
                              <Plus size={14} strokeWidth={2} />
                            </button>
                          </div>

                          {/* Desktop Only Total */}
                          <div className="hidden md:flex flex-col items-end">
                            <span className="font-sans font-bold text-xl text-[#f2ca50] drop-shadow-sm">{formatLKR(itemSubtotal)}</span>
                            {item.quantity > 1 && <span className="text-[9px] text-[#99907c] uppercase tracking-widest mt-1">{formatLKR(item.unitPrice)} each</span>}
                          </div>

                        </div>
                      </div>

                      {/* Actions */}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleMoveToArchive(item)}
                          disabled={isRemoving || isUpdating}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1c1b1b] text-[#99907c] hover:text-[#f2ca50] hover:bg-[#2a2a2a] transition-all disabled:opacity-50"
                          title="Save for Later"
                        >
                          <Heart size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          disabled={isRemoving || isUpdating}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1c1b1b] text-[#99907c] hover:text-red-400 hover:bg-[#2a2a2a] transition-all disabled:opacity-50"
                          title="Remove Item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            
            <div className="mt-8 flex justify-between items-center">
              <Link to="/shopping/product-list" className="inline-flex items-center gap-2 text-sm text-[#99907c] uppercase tracking-widest font-bold hover:text-[#f2ca50] transition-colors">
                <ArrowLeft size={16} /> Continue Shopping
              </Link>
            </div>
          </div>

          {/* RIGHT 35%: Order Summary */}
          <aside className="w-full lg:w-[35%] relative">
            <div className="bg-[#131313] border border-[#2a2a2a] rounded-3xl p-6 md:p-8 lg:sticky lg:top-32 shadow-2xl">
              <h2 className="font-sans font-bold text-2xl text-white mb-6">Order Summary</h2>

              {/* Promo Code Input */}
              <div className="mb-8 border-b border-[#2a2a2a] pb-8">
                <label className="text-[10px] uppercase tracking-widest text-[#99907c] font-bold block mb-3">Do you have a Promo Code?</label>
                <div className="flex items-center bg-[#0a0a0a] border border-[#4d4635] rounded-xl overflow-hidden focus-within:border-[#f2ca50] transition-colors">
                  <input 
                    type="text" 
                    placeholder="Enter Code" 
                    className="flex-1 bg-transparent px-4 h-12 text-sm text-white focus:outline-none placeholder:text-[#4d4635]"
                  />
                  <button className="h-12 px-6 bg-[#2a2a2a] text-[#d0c5af] font-bold text-[10px] uppercase tracking-widest hover:bg-[#f2ca50] hover:text-black transition-colors">
                    Apply
                  </button>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm text-[#d0c5af]">
                  <span>Subtotal ({totalQuantity} items)</span>
                  <span className="font-sans">{formatLKR(totalPrice + offerSavings)}</span>
                </div>
                {offerSavings > 0 && (
                  <div className="flex items-center justify-between text-sm text-[#f2ca50]">
                    <span className="flex items-center gap-1.5"><Tag size={14} /> Discount</span>
                    <span className="font-sans font-bold">-{formatLKR(offerSavings)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-[#d0c5af]">
                  <span>Estimated Shipping</span>
                  <span className="text-[#99907c] text-xs uppercase tracking-widest">Calculated at Checkout</span>
                </div>
                <div className="flex items-center justify-between text-sm text-[#d0c5af]">
                  <span>Estimated Tax</span>
                  <span className="text-[#99907c] text-xs uppercase tracking-widest">Calculated at Checkout</span>
                </div>
              </div>

              <div className="border-t border-[#2a2a2a] pt-6 mb-8">
                <div className="flex items-end justify-between">
                  <span className="text-base text-white font-bold uppercase tracking-widest">Final Total</span>
                  <span className="font-sans text-[28px] font-bold text-[#f2ca50] leading-none drop-shadow-sm">{formatLKR(totalPrice)}</span>
                </div>
              </div>

              {/* Free Shipping Progress */}
              <div className="mb-8 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#99907c] font-bold">
                    {totalPrice >= freeShippingThreshold ? "Unlocked" : "Progress"}
                  </span>
                  <span className="text-[10px] text-white">
                    {totalPrice >= freeShippingThreshold ? "Free Shipping" : `Spend ${formatLKR(freeShippingThreshold - totalPrice)} more`}
                  </span>
                </div>
                <div className="h-1.5 bg-[#1c1b1b] rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-[#f2ca50]" 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1.2 }}
                  />
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleProceed}
                disabled={busy || items.length === 0}
                className="w-full h-14 bg-[#f2ca50] text-[#0a0a0a] rounded-2xl font-bold uppercase tracking-widest text-sm hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(242,202,80,0.15)]"
              >
                Proceed to Secure Checkout <ArrowRight size={16} />
              </button>

              {/* Trust Section */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3">
                  <Lock size={16} className="text-[#f2ca50] shrink-0" />
                  <span className="text-xs text-[#99907c]">256-bit Secure Checkout Validation</span>
                </div>
                <div className="flex items-center gap-3">
                  <Package size={16} className="text-[#f2ca50] shrink-0" />
                  <span className="text-xs text-[#99907c]">Fast Islandwide Delivery via Premium Couriers</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck size={16} className="text-[#f2ca50] shrink-0" />
                  <span className="text-xs text-[#99907c]">Authentic Limited Pieces with Easy Returns</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* RELATED PRODUCTS */}
        <div className="mt-32 border-t border-[#4d4635]/40 pt-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#f2ca50] font-bold">Recommendations</span>
              <h2 className="text-[32px] font-sans font-bold text-white mt-2">You May Also Like</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {productList && productList.length > 0 ? (
              productList.slice(0, 4).map(product => (
                <ProductCard key={product._id || product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full h-40 flex items-center justify-center border border-[#1c1b1b] rounded-2xl bg-[#131313]">
                <Loader2 className="animate-spin text-[#99907c]" />
              </div>
            )}
          </div>
        </div>

        {/* MOBILE STICKY PURCHASE BAR */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-[#f2ca50] p-4 pb-[env(safe-area-inset-bottom)] flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-[#99907c] font-bold">Final Total</span>
            <span className="font-sans font-bold text-xl text-[#f2ca50] leading-none mt-1">{formatLKR(totalPrice)}</span>
          </div>
          <button
            onClick={handleProceed}
            disabled={busy || items.length === 0}
            className="h-12 px-6 bg-[#f2ca50] text-[#0a0a0a] rounded-xl font-bold uppercase tracking-widest text-xs hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            Checkout <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </section>
  );
};

export default Cart;
