import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Loader2,
  Lock,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import {
  fetchCartAction,
  removeFromCartAction,
  updateCartItemAction,
} from "@/store/cart-slice";
import { toast } from "@/hooks/use-toast";
import { Btn, Eyebrow, Hairline } from "@/components/ui/editorial";

const formatLKR = (value = 0) =>
  `LKR ${(Number(value) || 0).toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;

const productImage = (product) =>
  product?.image || product?.images?.[0]?.url || "/LOGO.png";

const variantLabel = (variant = {}) =>
  [variant?.size, variant?.color].filter(Boolean).join(" · ") || "Standard";

const errMsg = (err, fallback) =>
  typeof err === "string" ? err : err?.message || fallback;

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeItemId, setActiveItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const { items = [], totalPrice = 0, totalQuantity = 0, isLoading } =
    useSelector((state) => state.cart.cart);

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
      <section className="bg-[#0a0a0a] text-[#e5e2e1] se-body">
        <div className="px-5 md:px-12 py-16 md:py-24 max-w-3xl">
          <Eyebrow tone="gold" size="md">Your selection</Eyebrow>
          <h1 className="mt-4 se-serif text-[#e5e2e1] leading-[1.0] text-4xl md:text-7xl">
            Nothing chosen<br />yet.
          </h1>
          <Hairline tone="strong" className="mt-10" />
          <p className="mt-8 se-body text-base md:text-lg text-[#d0c5af] leading-relaxed max-w-xl">
            The atelier is open — eighty-four pieces this chapter, hand-finished and ready
            to be considered. Browse slowly. Take what speaks to you.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/shopping/product-list">
              <Btn variant="default" size="lg" iconRight={ArrowRight}>
                Browse the atelier
              </Btn>
            </Link>
            <Link to="/shopping/wishlist">
              <Btn variant="outline" size="lg">View wishlist</Btn>
            </Link>
          </div>
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

      <div className="px-5 md:px-12 pb-16 md:pb-24">
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

                return (
                  <motion.article
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -32, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr_auto] gap-4 sm:gap-6 py-7 md:py-8 border-b border-[#4d4635]/60 items-start"
                  >
                    {/* Thumbnail */}
                    <Link
                      to={slug ? `/shopping/product/${slug}` : "#"}
                      className="border border-[#4d4635] overflow-hidden block hover:border-[#99907c] transition-colors"
                      style={{ aspectRatio: "4/5" }}
                    >
                      <img
                        src={productImage(item.product)}
                        alt={item.product?.name || "Piece"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </Link>

                    {/* Details */}
                    <div className="min-w-0">
                      <Eyebrow tone="muted" size="xs">
                        {item.product?.category || "Atelier"}
                      </Eyebrow>
                      <h3 className="mt-2 se-headline text-[#e5e2e1] text-xl md:text-2xl truncate">
                        {item.product?.name || "Untitled piece"}
                      </h3>
                      <p className="mt-1 se-body text-sm text-[#99907c]">{variant}</p>

                      {/* Mobile total + qty */}
                      <div className="mt-4 sm:hidden flex items-center justify-between">
                        <div className="inline-flex items-center border border-[#4d4635]">
                          <button
                            type="button"
                            onClick={() => handleQuantity(item, (item.quantity || 1) - 1)}
                            disabled={isUpdating || isRemoving || (item.quantity || 1) <= 1}
                            className="w-9 h-9 flex items-center justify-center text-[#d0c5af] hover:bg-[#1c1b1b] disabled:opacity-40"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} strokeWidth={1.5} />
                          </button>
                          <span className="w-10 text-center se-mono text-sm text-[#e5e2e1]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantity(item, (item.quantity || 1) + 1)}
                            disabled={isUpdating || isRemoving}
                            className="w-9 h-9 flex items-center justify-center text-[#d0c5af] hover:bg-[#1c1b1b] disabled:opacity-40"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} strokeWidth={1.5} />
                          </button>
                        </div>
                        <span className="se-mono text-base text-[#e5e2e1]">
                          {formatLKR(itemSubtotal)}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-4 flex-wrap">
                        {slug ? (
                          <Link
                            to={`/shopping/product/${slug}`}
                            className="se-label text-[10px] tracking-[0.24em] text-[#99907c] hover:text-[#e5e2e1]"
                          >
                            View piece
                          </Link>
                        ) : null}
                        <span className="text-[#4d4635]">·</span>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          disabled={isRemoving || isUpdating}
                          className="se-label text-[10px] tracking-[0.24em] text-[#99907c] hover:text-[#ffb4ab] inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isRemoving ? (
                            <Loader2 size={12} strokeWidth={1.5} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} strokeWidth={1.5} />
                          )}
                          {isRemoving ? "Removing" : "Remove"}
                        </button>
                      </div>
                    </div>

                    {/* Desktop qty + total */}
                    <div className="hidden sm:flex flex-col items-end gap-3">
                      <div className="inline-flex items-center border border-[#4d4635]">
                        <button
                          type="button"
                          onClick={() => handleQuantity(item, (item.quantity || 1) - 1)}
                          disabled={isUpdating || isRemoving || (item.quantity || 1) <= 1}
                          className="w-9 h-9 flex items-center justify-center text-[#d0c5af] hover:bg-[#1c1b1b] disabled:opacity-40"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} strokeWidth={1.5} />
                        </button>
                        <span className="w-10 text-center se-mono text-sm text-[#e5e2e1]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantity(item, (item.quantity || 1) + 1)}
                          disabled={isUpdating || isRemoving}
                          className="w-9 h-9 flex items-center justify-center text-[#d0c5af] hover:bg-[#1c1b1b] disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} strokeWidth={1.5} />
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="se-mono text-lg md:text-xl text-[#e5e2e1]">
                          {formatLKR(itemSubtotal)}
                        </div>
                        <div className="mt-1 se-body text-[11px] text-[#99907c]">
                          {item.quantity > 1 ? `${formatLKR(item.unitPrice)} per piece` : "Per piece"}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>

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
          <aside className="lg:col-span-4">
            <div className="border border-[#4d4635] p-6 md:p-7 lg:sticky lg:top-32">
              <Eyebrow tone="gold" size="sm">Order summary</Eyebrow>
              <div className="mt-6 space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="se-body text-sm text-[#d0c5af]">Subtotal</span>
                  <span className="se-mono text-sm text-[#e5e2e1]">{formatLKR(totalPrice)}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="se-body text-sm text-[#d0c5af]">Shipping</span>
                  <span className="se-body text-sm text-[#99907c]">Complimentary</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="se-body text-sm text-[#d0c5af]">Tax (incl.)</span>
                  <span className="se-mono text-sm text-[#99907c]">—</span>
                </div>
              </div>
              <Hairline className="my-6" />
              <div className="flex items-baseline justify-between">
                <Eyebrow tone="muted" size="xs">Total</Eyebrow>
                <span className="se-serif text-3xl text-[#f2ca50]">
                  {formatLKR(totalPrice)}
                </span>
              </div>
              <Btn
                variant="default"
                size="lg"
                className="mt-6 w-full"
                iconRight={ArrowRight}
                onClick={handleProceed}
                disabled={busy || items.length === 0}
              >
                Take it to checkout
              </Btn>
              <div className="mt-4 flex items-center gap-2 justify-center se-label text-[9px] tracking-[0.28em] text-[#99907c]">
                <Lock size={11} strokeWidth={1.5} /> Encrypted checkout · Card or manual transfer
              </div>
            </div>

            <div className="mt-6 border border-[#4d4635] p-5 md:p-6">
              <Eyebrow tone="muted" size="xs">Need a hand?</Eyebrow>
              <p className="mt-3 se-body text-xs md:text-sm text-[#d0c5af] leading-relaxed">
                The atelier replies on WhatsApp between nine and seven, Sri Lankan time. We are
                happy to hold a piece for you.
              </p>
              <Link
                to="/contact"
                className="mt-4 inline-flex items-center gap-2 se-label text-[10px] tracking-[0.24em] text-[#f2ca50] hover:text-[#ffe088]"
              >
                Reach the atelier <ArrowRight size={12} strokeWidth={1.5} />
              </Link>
            </div>

            <Link
              to="/shopping/wishlist"
              className="mt-4 inline-flex items-center gap-2 se-label text-[10px] tracking-[0.24em] text-[#99907c] hover:text-[#f2ca50] transition-colors"
            >
              <Heart size={12} strokeWidth={1.5} />
              Move pieces to wishlist
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default Cart;
