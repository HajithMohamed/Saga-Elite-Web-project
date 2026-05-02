import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  fetchCartAction,
  updateCartItemAction,
  removeFromCartAction,
} from "@/store/cart-slice";
import { toast } from "@/hooks/use-toast";
import {
  ArrowRight,
  ChevronLeft,
  Loader2,
  LockKeyhole,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Trash2,
} from "lucide-react";

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const getProductImage = (product) =>
  product?.image || product?.images?.[0]?.url || "/LOGO.png";

const getVariantLabel = (variant = {}) =>
  [variant?.size, variant?.color].filter(Boolean).join(" / ") || "Standard";

const getErrorMessage = (error, fallback) =>
  typeof error === "string" ? error : error?.message || fallback;

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeItemId, setActiveItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const { items = [], totalPrice = 0, totalQuantity = 0, isLoading } =
    useSelector((state) => state.cart.cart);

  useEffect(() => {
    dispatch(fetchCartAction()).finally(() => {
      setHasLoadedOnce(true);
    });
  }, [dispatch]);

  const handleQuantityChange = async (item, quantity) => {
    try {
      if (quantity < 1 || activeItemId === item.id || removingItemId === item.id) {
        return;
      }

      setActiveItemId(item.id);

      await dispatch(
        updateCartItemAction({
          itemId: item.id,
          quantity,
        })
      ).unwrap();
    } catch (err) {
      toast({
        title: "Update failed",
        description: getErrorMessage(err, "Unable to update quantity."),
        variant: "destructive",
      });
    } finally {
      setActiveItemId((current) => (current === item.id ? null : current));
    }
  };

  const handleRemove = async (itemId) => {
    try {
      if (activeItemId === itemId || removingItemId === itemId) {
        return;
      }

      setRemovingItemId(itemId);
      await dispatch(removeFromCartAction(itemId)).unwrap();

      toast({
        title: "Removed",
        description: "Item removed from cart.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Remove failed",
        description: getErrorMessage(err, "Unable to remove item."),
        variant: "destructive",
      });
    } finally {
      setRemovingItemId((current) => (current === itemId ? null : current));
    }
  };

  const handleProceedToCheckout = () => {
    if (items.length === 0 || activeItemId || removingItemId) return;

    navigate("/shopping/checkout", {
      state: {
        cartItems: items,
        cartTotal: totalPrice,
      },
    });
  };

  const showInitialLoader = !hasLoadedOnce && isLoading && items.length === 0;
  const hasPendingItemAction = Boolean(activeItemId || removingItemId);

  if (showInitialLoader) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] px-4 text-white">
        <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/10 bg-white/5">
          <Loader2 className="h-9 w-9 animate-spin text-[#D4AF37]" />
        </div>
        <p className="mt-6 text-lg font-semibold">Loading your cart</p>
        <p className="mt-2 text-sm text-zinc-500">
          Bringing your selected pieces into view.
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen overflow-hidden bg-background text-on-surface">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative isolate flex min-h-screen items-center justify-center px-4 py-16"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#d4af3726,transparent_35%),radial-gradient(circle_at_bottom_right,#ffffff12,transparent_28%)]" />
          <div className="relative w-full max-w-3xl rounded-[36px] border border-white/10 bg-white/[0.04] p-8 text-center shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-12">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/10 bg-black/30">
              <ShoppingBag className="h-11 w-11 text-[#D4AF37]" />
            </div>

            <span className="mt-8 inline-flex items-center rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#f1d27a]">
              Cart refreshed
            </span>

            <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-5xl">
              Your cart is empty
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
              Start building a sharper checkout. Add a few standout pieces and
              your bag will be ready right here.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/shopping/product-list"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-3 text-sm font-bold text-black transition-colors hover:bg-[#f2ca50]"
              >
                Browse Collection
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/shopping/home"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/10"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#d4af372b,transparent_30%),radial-gradient(circle_at_top_right,#ffffff12,transparent_25%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 md:px-6 md:pb-14 md:pt-12">
          <Link
            to="/shopping/product-list"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Continue shopping
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.45fr_0.95fr] lg:items-end">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#f1d27a]">
                Cart overview
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                Ready to check out?
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
                Review your pieces, adjust quantities, and move to checkout from
                a cleaner, more premium bag experience.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Items
                </p>
                <p className="mt-3 text-3xl font-semibold">{totalQuantity}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Current total
                </p>
                <p className="mt-3 text-lg font-semibold text-[#f1d27a]">
                  {formatCurrency(totalPrice)}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Checkout
                </p>
                <p className="mt-3 text-sm font-medium text-zinc-300">
                  Secure and streamlined
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.45fr_0.95fr]">
          <div className="space-y-5">
            <div className="rounded-[32px] border border-white/10 bg-[#0c0c0c] p-5 shadow-[0_20px_90px_rgba(0,0,0,0.35)] sm:p-7">
              <div className="mb-6 flex flex-col gap-2 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                    Bag review
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    Cart items
                  </h2>
                </div>
                <p className="text-sm text-zinc-400">
                  Fine-tune quantities before checkout.
                </p>
              </div>

              <div className="space-y-4">
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const isUpdating = activeItemId === item.id;
                  const isRemoving = removingItemId === item.id;
                  const isBusy = isUpdating || isRemoving;
                  const itemSubtotal =
                    item.subTotal ?? item.unitPrice * item.quantity;
                  const productSlug = item.product?.slug;

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 transition-colors hover:border-white/15 sm:p-5 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]"
                    >
                      <div className="flex flex-col gap-5 md:flex-row">
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30 md:h-20 md:w-20">
                          <img
                            src={getProductImage(item.product)}
                            className="h-full w-full object-cover"
                            alt={item.product?.name}
                          />
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col gap-4">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              {productSlug ? (
                                <Link
                                  to={`/shopping/product/${productSlug}`}
                                  className="text-xl font-semibold tracking-tight transition-colors hover:text-[#f1d27a]"
                                >
                                  {item.product?.name}
                                </Link>
                              ) : (
                                <h3 className="text-xl font-semibold tracking-tight">
                                  {item.product?.name}
                                </h3>
                              )}
                              <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
                                {getVariantLabel(item.variant)}
                              </p>
                              <div className="mt-4 flex flex-wrap gap-2">
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
                                  Unit {formatCurrency(item.unitPrice)}
                                </span>
                                <span className="rounded-full border border-[#D4AF37]/15 bg-[#D4AF37]/10 px-3 py-1 text-xs font-medium text-[#f1d27a]">
                                  Subtotal {formatCurrency(itemSubtotal)}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemove(item.id)}
                              disabled={isBusy}
                              className="inline-flex items-center gap-2 self-start rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-300 transition-colors hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isRemoving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              Remove
                            </button>
                          </div>

                          <div className="flex flex-col gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                                Quantity
                              </p>
                              <div className="mt-3 inline-flex items-center rounded-full border border-white/10 bg-black/30 p-1">
                                <motion.button
                                  type="button"
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() =>
                                    handleQuantityChange(item, item.quantity - 1)
                                  }
                                  disabled={item.quantity <= 1 || isBusy}
                                  className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <Minus className="h-4 w-4" />
                                </motion.button>
                                <span className="flex h-10 min-w-12 items-center justify-center text-sm font-semibold">
                                  {isUpdating ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
                                  ) : (
                                    item.quantity
                                  )}
                                </span>
                                <motion.button
                                  type="button"
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() =>
                                    handleQuantityChange(item, item.quantity + 1)
                                  }
                                  disabled={isBusy}
                                  className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <Plus className="h-4 w-4" />
                                </motion.button>
                              </div>
                            </div>

                            <div className="sm:text-right">
                              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                                Line total
                              </p>
                              <p className="mt-3 text-2xl font-semibold text-[#f1d27a]">
                                {formatCurrency(itemSubtotal)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              </div>

              <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-zinc-400">
                  Need a different piece? Keep browsing before you check out.
                </p>
                <Link
                  to="/shopping/product-list"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#f1d27a] transition-colors hover:text-[#f7df98]"
                >
                  Explore more products
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {isLoading && hasLoadedOnce ? (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-400">
                Cart totals are refreshing in the background.
              </div>
            ) : null}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-4">
            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#0d0d0d] shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
              <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top,#d4af3720,transparent_55%)] p-6 sm:p-7">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  Order summary
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Checkout snapshot
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Everything you need before payment.
                </p>
              </div>

              <div className="space-y-6 p-6 sm:p-7">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-zinc-400">
                    <span>Items</span>
                    <span className="font-medium text-white">{totalQuantity}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-zinc-400">
                    <span>Subtotal</span>
                    <span className="font-medium text-white">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-zinc-400">
                    <span>Delivery</span>
                    <span className="font-medium text-emerald-400">
                      Free Delivery 🚚
                    </span>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm uppercase tracking-[0.22em] text-zinc-500">
                      Total
                    </span>
                    <span className="text-3xl font-semibold tracking-tight text-[#f1d27a]">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    Final delivery costs will be confirmed in the checkout step.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  disabled={hasPendingItemAction}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-[#f2ca50] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-5 w-5" />
                </button>

                <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#f1d27a]" />
                    Secure Checkout
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4 text-[#f1d27a]" />
                    SSL Encrypted
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur sm:p-7">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                Why this cart feels better
              </p>
              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3 rounded-[22px] border border-white/8 bg-black/20 p-4">
                  <Truck className="mt-0.5 h-5 w-5 text-[#f1d27a]" />
                  <div>
                    <p className="font-medium text-white">Delivery clarity</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      Shipping details stay visible before you commit.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-[22px] border border-white/8 bg-black/20 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-[#f1d27a]" />
                  <div>
                    <p className="font-medium text-white">Secure checkout</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      Your order summary stays anchored and easy to review.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-[22px] border border-white/8 bg-black/20 p-4">
                  <ShoppingBag className="mt-0.5 h-5 w-5 text-[#f1d27a]" />
                  <div>
                    <p className="font-medium text-white">Curated flow</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      Clean hierarchy keeps focus on products and the next step.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default Cart;
