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
import EmptyState from "@/components/ui/EmptyState";
import { Btn, Eyebrow, Hairline } from "@/components/ui/editorial";
import usePageMeta from "@/hooks/use-page-meta";
import { useAllOffers } from "@/hooks/use-product-offers";
import { getVariantImage as productImage } from "@/lib/variant-image";

const formatLKR = (value = 0) =>
  `LKR ${(Number(value) || 0).toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;

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
  const { isAuthenticated } = useSelector((state) => state.auth);

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
    // Guests have no server cart — skip the fetch instead of collecting 401s.
    if (!isAuthenticated) {
      setHasLoadedOnce(true);
      return;
    }
    dispatch(fetchCartAction()).finally(() => setHasLoadedOnce(true));
  }, [dispatch, isAuthenticated]);

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
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-page px-4 text-ink-2">
        <div className="flex h-14 w-14 items-center justify-center border border-line">
          <Loader2 className="h-5 w-5 animate-spin text-gold-ink" />
        </div>
        <p className="mt-6 se-label text-[10px] tracking-[0.32em] text-muted">
          Bringing your selection into view
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <section className="relative min-h-screen bg-page text-ink pt-32 pb-24 flex items-center justify-center">
         <div className="w-full max-w-2xl px-4">
            <EmptyState 
              iconType="cart" 
              title="Your Shopping Cart is Empty" 
              description="Looks like you haven't added any products yet. Take your time to discover garments designed for long-term wear and timeless styling." 
              actionLabel="Browse Products"
              actionTo="/shopping/product-list"
            />
         </div>
      </section>
    );
  }

  const freeShippingThreshold = 20000;
  const progressPercent = Math.min(100, (totalPrice / freeShippingThreshold) * 100);

  return (
    <section className="bg-page text-ink-2 min-h-screen pt-24 pb-32">
      {/* Breadcrumbs */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 mb-6">
        <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-[11px] uppercase tracking-widest text-muted">
          <Link to="/" className="hover:text-gold-ink transition-colors">Home</Link>
          <span className="text-line">{'>'}</span>
          <span className="text-gold-ink font-bold">Shopping Cart</span>
        </div>
      </div>

      {/* Page Hero */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 mb-10">
        <div className="h-[160px] md:h-[180px] lg:h-[220px] bg-panel rounded-3xl border border-card flex flex-col justify-center px-6 md:px-12 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-gold-deep/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <h1 className="font-sans text-3xl md:text-5xl font-bold tracking-tight text-ink relative z-10">
            Shopping Cart
          </h1>
          <p className="mt-3 text-sm md:text-base text-cream relative z-10">
            Review your selected items before proceeding to our secure checkout.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-line w-max relative z-10">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-gold-ink font-bold">
              {totalQuantity} {totalQuantity === 1 ? "Item" : "Items"} in Your Cart
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          
          {/* LEFT 65%: Cart Items */}
          <div className="w-full lg:w-[65%]">
            <div className="flex items-center justify-between pb-4 border-b border-line/60 mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted">Product Details</h2>
              <div className="hidden md:flex gap-16 text-sm font-bold uppercase tracking-widest text-muted">
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
                      className="bg-panel border border-card rounded-[20px] p-4 md:p-6 flex flex-col md:flex-row gap-6 relative group hover:border-line transition-colors"
                    >
                      {/* Image */}
                      <Link to={slug ? `/shopping/product/${slug}` : "#"} className="shrink-0">
                        <div className="w-[100px] h-[100px] md:w-[140px] md:h-[140px] bg-page rounded-2xl overflow-hidden border border-elevated relative">
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
                          <div className="se-label text-[9px] tracking-[0.25em] text-muted uppercase mb-1">
                            {item.product?.brand?.name || "Saga Elite"} · {item.product?.category || "Apparel"}
                          </div>
                          <Link to={slug ? `/shopping/product/${slug}` : "#"}>
                            <h3 className="font-sans font-bold text-lg md:text-xl text-ink-2 truncate max-w-[280px] hover:text-gold-ink transition-colors">
                              {item.product?.name || "Untitled piece"}
                            </h3>
                          </Link>
                          
                          <div className="mt-2 flex items-center gap-3">
                            <span className="text-xs text-cream bg-card px-3 py-1 rounded-full border border-elevated">{variant}</span>
                            {colorName !== "Standard" && (
                              <div className="flex items-center gap-2 bg-card px-3 py-1 rounded-full border border-elevated">
                                <span className="w-2.5 h-2.5 rounded-full border border-ink/20" style={{ backgroundColor: colorHex }} />
                                <span className="text-[10px] uppercase tracking-wider text-cream">{colorName}</span>
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
                              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-danger-ink font-bold">
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
                            <span className="font-sans font-bold text-lg text-gold-ink">{formatLKR(itemSubtotal)}</span>
                            {item.quantity > 1 && <span className="text-[9px] text-muted uppercase tracking-widest">{formatLKR(item.unitPrice)} each</span>}
                          </div>

                          {/* Quantity Selector */}
                          <div className="flex items-center border border-line bg-page rounded-xl overflow-hidden h-12">
                            <button
                              type="button"
                              onClick={() => handleQuantity(item, (item.quantity || 1) - 1)}
                              disabled={isUpdating || isRemoving || (item.quantity || 1) <= 1}
                              className="w-10 h-full flex items-center justify-center text-muted hover:text-gold-ink hover:bg-card transition-colors disabled:opacity-40"
                            >
                              <Minus size={14} strokeWidth={2} />
                            </button>
                            <span className="w-10 text-center font-sans font-bold text-ink-2">
                              {isUpdating ? <Loader2 size={14} className="animate-spin mx-auto" /> : item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantity(item, (item.quantity || 1) + 1)}
                              disabled={isUpdating || isRemoving}
                              className="w-10 h-full flex items-center justify-center text-muted hover:text-gold-ink hover:bg-card transition-colors disabled:opacity-40"
                            >
                              <Plus size={14} strokeWidth={2} />
                            </button>
                          </div>

                          {/* Desktop Only Total */}
                          <div className="hidden md:flex flex-col items-end">
                            <span className="font-sans font-bold text-xl text-gold-ink drop-shadow-sm">{formatLKR(itemSubtotal)}</span>
                            {item.quantity > 1 && <span className="text-[9px] text-muted uppercase tracking-widest mt-1">{formatLKR(item.unitPrice)} each</span>}
                          </div>

                        </div>
                      </div>

                      {/* Actions */}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleMoveToArchive(item)}
                          disabled={isRemoving || isUpdating}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-card text-muted hover:text-gold-ink hover:bg-elevated transition-all disabled:opacity-50"
                          title="Save for Later"
                        >
                          <Heart size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          disabled={isRemoving || isUpdating}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-card text-muted hover:text-red-400 hover:bg-elevated transition-all disabled:opacity-50"
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
              <Link to="/shopping/product-list" className="inline-flex items-center gap-2 text-sm text-muted uppercase tracking-widest font-bold hover:text-gold-ink transition-colors">
                <ArrowLeft size={16} /> Continue Shopping
              </Link>
            </div>
          </div>

          {/* RIGHT 35%: Order Summary */}
          <aside className="w-full lg:w-[35%] relative">
            <div className="bg-panel border border-elevated rounded-3xl p-6 md:p-8 lg:sticky lg:top-32 shadow-2xl">
              <h2 className="font-sans font-bold text-2xl text-ink mb-6">Order Summary</h2>

              {/* Promo Code Input */}
              <div className="mb-8 border-b border-elevated pb-8">
                <label className="text-[10px] uppercase tracking-widest text-muted font-bold block mb-3">Do you have a Promo Code?</label>
                <div className="flex items-center bg-page border border-line rounded-xl overflow-hidden focus-within:border-gold-ink transition-colors">
                  <input 
                    type="text" 
                    placeholder="Enter Code" 
                    className="flex-1 bg-transparent px-4 h-12 text-sm text-ink focus:outline-none placeholder:text-line"
                  />
                  <button className="h-12 px-6 bg-elevated text-cream font-bold text-[10px] uppercase tracking-widest hover:bg-gold hover:text-black transition-colors">
                    Apply
                  </button>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm text-cream">
                  <span>Subtotal ({totalQuantity} items)</span>
                  <span className="font-sans">{formatLKR(totalPrice + offerSavings)}</span>
                </div>
                {offerSavings > 0 && (
                  <div className="flex items-center justify-between text-sm text-gold-ink">
                    <span className="flex items-center gap-1.5"><Tag size={14} /> Discount</span>
                    <span className="font-sans font-bold">-{formatLKR(offerSavings)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-cream">
                  <span>Estimated Shipping</span>
                  <span className="text-muted text-xs uppercase tracking-widest">Calculated at Checkout</span>
                </div>
                <div className="flex items-center justify-between text-sm text-cream">
                  <span>Estimated Tax</span>
                  <span className="text-muted text-xs uppercase tracking-widest">Calculated at Checkout</span>
                </div>
              </div>

              <div className="border-t border-elevated pt-6 mb-8">
                <div className="flex items-end justify-between">
                  <span className="text-base text-ink font-bold uppercase tracking-widest">Final Total</span>
                  <span className="font-sans text-[28px] font-bold text-gold-ink leading-none drop-shadow-sm">{formatLKR(totalPrice)}</span>
                </div>
              </div>

              {/* Free Shipping Progress */}
              <div className="mb-8 bg-page border border-elevated rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-muted font-bold">
                    {totalPrice >= freeShippingThreshold ? "Unlocked" : "Progress"}
                  </span>
                  <span className="text-[10px] text-ink">
                    {totalPrice >= freeShippingThreshold ? "Free Shipping" : `Spend ${formatLKR(freeShippingThreshold - totalPrice)} more`}
                  </span>
                </div>
                <div className="h-1.5 bg-card rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gold" 
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
                className="w-full h-14 bg-gold text-ongold rounded-2xl font-bold uppercase tracking-widest text-sm hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(242,202,80,0.15)]"
              >
                Proceed to Secure Checkout <ArrowRight size={16} />
              </button>

              {/* Trust Section */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3">
                  <Lock size={16} className="text-gold-ink shrink-0" />
                  <span className="text-xs text-muted">256-bit Secure Checkout Validation</span>
                </div>
                <div className="flex items-center gap-3">
                  <Package size={16} className="text-gold-ink shrink-0" />
                  <span className="text-xs text-muted">Fast Islandwide Delivery via Premium Couriers</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck size={16} className="text-gold-ink shrink-0" />
                  <span className="text-xs text-muted">Authentic Limited Pieces with Easy Returns</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* RELATED PRODUCTS */}
        <div className="mt-32 border-t border-line/40 pt-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-gold-ink font-bold">Recommendations</span>
              <h2 className="text-[32px] font-sans font-bold text-ink mt-2">You May Also Like</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {productList && productList.length > 0 ? (
              productList.slice(0, 4).map(product => (
                <ProductCard key={product._id || product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full h-40 flex items-center justify-center border border-card rounded-2xl bg-panel">
                <Loader2 className="animate-spin text-muted" />
              </div>
            )}
          </div>
        </div>

        {/* MOBILE STICKY PURCHASE BAR */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-page border-t border-gold-ink p-4 pb-[env(safe-area-inset-bottom)] flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-muted font-bold">Final Total</span>
            <span className="font-sans font-bold text-xl text-gold-ink leading-none mt-1">{formatLKR(totalPrice)}</span>
          </div>
          <button
            onClick={handleProceed}
            disabled={busy || items.length === 0}
            className="h-12 px-6 bg-gold text-ongold rounded-xl font-bold uppercase tracking-widest text-xs hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            Checkout <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </section>
  );
};

export default Cart;
