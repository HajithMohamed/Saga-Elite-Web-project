import React, { useEffect, useMemo, useState } from "react";
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
      <section className="relative min-h-screen bg-[#0a0a0a] text-[#e5e2e1] se-body overflow-hidden flex items-center">
        <div className="absolute inset-0 z-0 bg-[url('/cart-empty-cinematic.jpg')] bg-cover bg-center bg-no-repeat opacity-20 filter grayscale blur-[2px]" />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
        <div className="relative z-10 px-5 md:px-12 py-16 md:py-24 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="se-label text-[10px] tracking-[0.32em] text-[#d4af37] mb-6 uppercase">Curated for the rare few</p>
            <h1 className="se-serif text-[#e5e2e1] leading-[1.0] text-5xl md:text-8xl">
              The Archive<br />is Empty
            </h1>
            <div className="w-12 h-[1px] bg-[#d4af37]/40 mx-auto my-10" />
            <p className="se-body text-base md:text-xl text-[#d0c5af] leading-relaxed max-w-2xl mx-auto">
              "True luxury is the space between the pieces. Take your time to discover garments designed for long-term wear and timeless styling."
            </p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
              <Link to="/shopping/product-list">
                <Btn variant="default" size="lg" iconRight={ArrowRight}>
                  Continue Shopping
                </Btn>
              </Link>
              <Link to="/shopping/wishlist">
                <Btn variant="outline" size="lg">View saved pieces</Btn>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#0a0a0a] text-[#e5e2e1] se-body min-h-screen">
      <header className="px-5 md:px-12 pt-10 md:pt-14 pb-6 md:pb-10">
        <Link
          to="/shopping/product-list"
          className="inline-flex items-center gap-2 se-label text-[10px] tracking-[0.28em] text-[#99907c] hover:text-[#f2ca50] transition-colors"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          Continue browsing
        </Link>
        <div className="mt-6">
          <Eyebrow tone="gold" size="md">Your selection</Eyebrow>
          <h1 className="mt-4 se-serif text-[#e5e2e1] leading-[1.0] text-3xl md:text-6xl">
            {totalQuantity} {totalQuantity === 1 ? "piece" : "pieces"}, considered.
          </h1>
        </div>
      </header>

      <div className="px-5 md:px-12 pb-32 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Items */}
          <div className="lg:col-span-8">
            <Hairline tone="strong" />
            <AnimatePresence initial={false}>
              {items.map((item) => {
                const isUpdating = activeItemId === item.id;
                const isRemoving = removingItemId === item.id;
                const itemSubtotal =
                  item.subTotal != null
                    ? item.subTotal
                    : (item.unitPrice || 0) * (item.quantity || 0);
                const slug = item.product?.slug;
                const variant = variantLabel(item.variant || {});
                const colorHex = item.variant?.colorCode || null;
                const colorName = item.variant?.color || "Standard";
                const isLimited = item.product?.isLimited || item.product?.trendScore > 80;
                const remainingStock = item.variant?.stock || item.product?.totalStock || 0;
                const showLowStock = remainingStock > 0 && remainingStock <= 5;
                const dropName = item.product?.drop?.name || "Exclusive Collection";

                return (
                  <motion.article
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(8px)", y: -10, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="grid grid-cols-[100px_1fr] md:grid-cols-[140px_1fr_auto] gap-5 md:gap-8 py-8 md:py-10 border-b border-[#4d4635]/40 items-start group"
                  >
                    {/* Thumbnail Cinematic */}
                    <div className="relative overflow-hidden block border border-transparent group-hover:border-[#d4af37]/30 transition-colors duration-500">
                      <Link
                        to={slug ? `/shopping/product/${slug}` : "#"}
                        className="block"
                        style={{ aspectRatio: "4/5" }}
                      >
                        <img
                          src={productImage(item.product, item.variant?.color)}
                          alt={item.product?.name || "Piece"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          loading="lazy"
                        />
                      </Link>
                      {isLimited && (
                        <div className="absolute top-2 left-2 z-10 pointer-events-none">
                          <span className="bg-black/80 backdrop-blur-md border border-[#d4af37]/40 px-2 py-1 text-[8px] tracking-[0.25em] text-[#d4af37]">
                            LIMITED
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex flex-col h-full justify-between">
                      <div>
                        {dropName && (
                          <div className="se-label text-[9px] tracking-[0.25em] text-[#99907c] uppercase mb-2">
                            {dropName}
                          </div>
                        )}
                        <h3 className="se-headline text-[#e5e2e1] text-xl md:text-3xl truncate">
                          {item.product?.name || "Untitled piece"}
                        </h3>
                        
                        <div className="mt-3 flex flex-col gap-2">
                          <p className="se-body text-xs text-[#d0c5af]">{variant}</p>
                          {colorHex && (
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-3.5 h-3.5 rounded-full border border-white/20" 
                                style={{ backgroundColor: colorHex }} 
                              />
                              <span className="text-[11px] uppercase tracking-wider text-[#99907c]">{colorName}</span>
                            </div>
                          )}
                        </div>

                        {showLowStock && (
                          <div className="mt-3 inline-flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.1em] text-amber-500/90">
                              Only {remainingStock} {remainingStock === 1 ? "piece" : "pieces"} remaining
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Mobile total + qty */}
                      <div className="mt-6 md:hidden flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => handleQuantity(item, (item.quantity || 1) - 1)}
                              disabled={isUpdating || isRemoving || (item.quantity || 1) <= 1}
                              className="text-[#99907c] hover:text-[#d4af37] disabled:opacity-40 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} strokeWidth={1.5} />
                            </button>
                            <span className="w-4 text-center se-serif text-lg text-[#e5e2e1]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantity(item, (item.quantity || 1) + 1)}
                              disabled={isUpdating || isRemoving}
                              className="text-[#99907c] hover:text-[#d4af37] disabled:opacity-40 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} strokeWidth={1.5} />
                            </button>
                          </div>
                          <span className="se-mono text-base text-[#e5e2e1]">
                            {formatLKR(itemSubtotal)}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 border-t border-[#4d4635]/30 pt-4">
                          <button
                            type="button"
                            onClick={() => handleMoveToArchive(item)}
                            disabled={isRemoving || isUpdating}
                            className="se-label text-[10px] tracking-[0.24em] text-[#99907c] hover:text-[#e5e2e1] inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            {isRemoving ? <Loader2 size={12} className="animate-spin" /> : <Archive size={12} strokeWidth={1.5} />}
                            Save for later
                          </button>
                        </div>
                      </div>

                      {/* Desktop Actions */}
                      <div className="hidden md:flex items-center gap-6 mt-6">
                        <button
                          type="button"
                          onClick={() => handleMoveToArchive(item)}
                          disabled={isRemoving || isUpdating}
                          className="se-label text-[10px] tracking-[0.2em] text-[#99907c] hover:text-[#d4af37] inline-flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                          {isRemoving ? <Loader2 size={12} className="animate-spin" /> : <Archive size={12} strokeWidth={1.5} />}
                          Save for later
                        </button>
                      </div>
                    </div>

                    {/* Desktop qty + total */}
                    <div className="hidden md:flex flex-col items-end justify-between h-full">
                      <div className="text-right">
                        <div className="se-mono text-xl text-[#e5e2e1]">
                          {formatLKR(itemSubtotal)}
                        </div>
                        {item.quantity > 1 && (
                          <div className="mt-1 se-label text-[10px] tracking-wider text-[#99907c]">
                            {formatLKR(item.unitPrice)} EACH
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-5">
                        <button
                          type="button"
                          onClick={() => handleQuantity(item, (item.quantity || 1) - 1)}
                          disabled={isUpdating || isRemoving || (item.quantity || 1) <= 1}
                          className="text-[#99907c] hover:text-[#d4af37] disabled:opacity-40 transition-colors p-2"
                        >
                          <Minus size={14} strokeWidth={1.5} />
                        </button>
                        <span className="w-4 text-center se-serif text-2xl text-[#e5e2e1]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantity(item, (item.quantity || 1) + 1)}
                          disabled={isUpdating || isRemoving}
                          className="text-[#99907c] hover:text-[#d4af37] disabled:opacity-40 transition-colors p-2"
                        >
                          <Plus size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>

            {items.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center justify-between py-4 border-t border-[#4d4635]/40"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 border border-[#4d4635] bg-[#1c1b1b] flex items-center justify-center">
                    <Gift size={16} strokeWidth={1.25} className="text-[#f2ca50]" />
                  </div>
                  <div>
                    <p className="se-body text-sm text-[#e5e2e1]">Saga Exclusive Gift</p>
                    <p className="se-label text-[9px] tracking-[0.24em] text-[#99907c] mt-0.5">
                      Surprise included with every order
                    </p>
                  </div>
                </div>
                <span className="se-mono text-sm text-[#d0c5af]">FREE</span>
              </motion.div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <Eyebrow tone="muted" size="xs">
                {totalQuantity} {totalQuantity === 1 ? "piece" : "pieces"} · Reserved for thirty minutes
              </Eyebrow>
              <Link
                to="/shopping/product-list"
                className="se-label text-[10px] tracking-[0.28em] text-[#f2ca50] hover:text-[#ffe088] inline-flex items-center gap-2"
              >
                Continue browsing <ArrowRight size={12} strokeWidth={1.5} />
              </Link>
            </div>
          </div>

          {/* Summary */}
          <aside className="lg:col-span-4 relative">
            <div className="border border-[#4d4635]/60 bg-[#0f0f0f]/80 p-6 md:p-8 lg:sticky lg:top-32 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              {/* Reserved Timer */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#4d4635]/40">
                <div className="flex items-center gap-2 text-[#d4af37]">
                  <Clock size={14} className="animate-pulse" />
                  <span className="se-label text-[10px] tracking-[0.25em]">Pieces reserved</span>
                </div>
                <span className="se-mono text-lg text-[#d4af37]">{formatTime(timeLeft)}</span>
              </div>

              {/* Mini Item Stack */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex -space-x-3">
                  {items.slice(0, 3).map((it, idx) => (
                    <img 
                      key={it.id} 
                      src={productImage(it.product, it.variant?.color)} 
                      className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] object-cover filter brightness-75"
                      style={{ zIndex: 3 - idx }}
                      alt=""
                    />
                  ))}
                  {items.length > 3 && (
                    <div className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] bg-[#1c1b1b] flex items-center justify-center text-[#99907c] se-label text-[9px] z-0">
                      +{items.length - 3}
                    </div>
                  )}
                </div>
                <div className="text-[#99907c] se-label text-[9px] tracking-widest uppercase ml-2">
                  {totalQuantity} Items
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-between se-label text-[10px] tracking-[0.18em] mb-3">
                  <span className="text-[#e5e2e1]">{totalPrice >= 20000 ? "Complimentary Insured Delivery" : "Insured Delivery"}</span>
                  {totalPrice < 20000 && <span className="text-[#99907c]">{formatLKR(20000 - totalPrice)} away</span>}
                </div>
                <div className="h-1 bg-[#1c1b1b] overflow-hidden rounded-full">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#d4af37] to-[#f2ca50]" 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (totalPrice / 20000) * 100)}%` }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="se-body text-sm text-[#d0c5af]">Selection Value</span>
                  <span className="se-mono text-sm text-[#e5e2e1]">{formatLKR(totalPrice)}</span>
                </div>
                {offerSavings > 0 && (
                  <div className="flex items-baseline justify-between">
                    <span className="flex items-center gap-1.5 se-body text-sm text-[#22c55e]">
                      <Tag className="h-3 w-3" /> Offer Savings
                    </span>
                    <span className="se-mono text-sm text-[#22c55e]">-{formatLKR(offerSavings)}</span>
                  </div>
                )}
                <div className="flex items-baseline justify-between">
                  <span className="se-body text-sm text-[#d0c5af]">Shipping</span>
                  <span className="se-body text-sm text-[#99907c]">{totalPrice >= 20000 ? "Complimentary" : "Calculated next"}</span>
                </div>
              </div>
              
              <Hairline className="my-6 border-[#4d4635]/40" />
              
              <div className="flex items-baseline justify-between mb-8">
                <Eyebrow tone="muted" size="xs">Total Consideration</Eyebrow>
                <div className="text-right">
                  <span className="se-serif text-3xl md:text-4xl text-[#f2ca50] drop-shadow-sm">
                    {formatLKR(totalPrice)}
                  </span>
                </div>
              </div>

              {/* Desktop Checkout Button */}
              <div className="hidden md:block">
                <Btn
                  variant="default"
                  size="lg"
                  className="w-full relative overflow-hidden group border border-[#d4af37]/30"
                  iconRight={ArrowRight}
                  onClick={handleProceed}
                  disabled={busy || items.length === 0}
                >
                  <span className="relative z-10">Proceed to checkout</span>
                </Btn>
              </div>

              {/* Delivery Estimate */}
              <div className="mt-8 pt-6 border-t border-[#4d4635]/40">
                <div className="flex gap-3 text-[#d0c5af]">
                  <Package size={16} className="text-[#99907c] shrink-0" />
                  <div>
                    <div className="se-label text-[9px] tracking-widest uppercase mb-1">Estimated Arrival</div>
                    <div className="se-body text-sm text-[#e5e2e1]">{getDeliveryDates()}</div>
                  </div>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-[#99907c]">
                  <Lock size={14} strokeWidth={1.5} />
                  <span className="se-label text-[9px] tracking-widest uppercase">100% Secure Checkout</span>
                </div>
                <div className="flex items-center gap-3 text-[#99907c]">
                  <ShieldCheck size={14} strokeWidth={1.5} />
                  <span className="se-label text-[9px] tracking-widest uppercase">Authentic limited pieces</span>
                </div>
                <div className="flex items-center gap-3 text-[#99907c]">
                  <Package size={14} strokeWidth={1.5} />
                  <span className="se-label text-[9px] tracking-widest uppercase">Fast Islandwide Delivery</span>
                </div>
                <div className="flex items-center gap-3 text-[#99907c]">
                  <Gift size={14} strokeWidth={1.5} />
                  <span className="se-label text-[9px] tracking-widest uppercase">Premium packaging included</span>
                </div>
              </div>
            </div>

            <div className="mt-6 border border-[#4d4635]/40 p-5 md:p-6 bg-[#0a0a0a]">
              <Eyebrow tone="muted" size="xs">A Complimentary Addition</Eyebrow>
              <p className="mt-3 se-body text-xs md:text-sm text-[#d0c5af] leading-relaxed">
                A complimentary archive accessory will accompany this curated selection. Hand-finished for Saga Elite members.
              </p>
            </div>
          </aside>

          {/* Sticky Mobile Checkout Bar */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-[#4d4635]/60 p-4 pb-safe flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
            <div className="flex flex-col">
              <span className="se-label text-[9px] tracking-[0.2em] text-[#99907c] uppercase">Total</span>
              <span className="se-serif text-xl text-[#f2ca50]">{formatLKR(totalPrice)}</span>
            </div>
            <Btn
              variant="default"
              size="md"
              className="w-1/2"
              onClick={handleProceed}
              disabled={busy || items.length === 0}
            >
              Checkout <ArrowRight size={14} className="ml-2" />
            </Btn>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cart;
