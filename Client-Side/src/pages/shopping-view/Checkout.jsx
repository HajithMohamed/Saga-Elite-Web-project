import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "@/hooks/use-toast";
import {
  fetchCartAction,
  updateCartItemAction,
  removeFromCartAction,
} from "@/store/cart-slice";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";

const Checkout = () => {
  const dispatch = useDispatch();
  const { items, totalPrice, isLoading } = useSelector((state) => state.cart.cart);

  useEffect(() => {
    dispatch(fetchCartAction());
  }, [dispatch]);

  const handleQuantityChange = async (item, quantity) => {
    try {
      await dispatch(updateCartItemAction({ itemId: item.id, quantity })).unwrap();
    } catch (err) {
      toast({
        title: "Update failed",
        description: typeof err === "string" ? err : err?.message || "Unable to update quantity.",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await dispatch(removeFromCartAction(itemId)).unwrap();
      toast({
        title: "Removed",
        description: "Item removed from your cart.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Remove failed",
        description: typeof err === "string" ? err : err?.message || "Unable to remove item.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060606] text-white py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold uppercase tracking-[0.2em] text-white">
              Checkout
            </h1>
            <p className="text-gray-400 mt-3 max-w-2xl">
              Review your cart, adjust quantities, and prepare to complete your order.
            </p>
          </div>
          <div className="rounded-full border border-[#D4AF37]/20 bg-[#0a0a0a] px-5 py-3 text-sm uppercase tracking-[0.2em] text-[#D4AF37]">
            Total: LKR {totalPrice.toLocaleString()}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-neutral-800 bg-[#0d0d0d] p-10 text-center text-gray-400">
            Your cart is empty. Add items from the store to proceed.
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 rounded-3xl border border-neutral-800 bg-[#0d0d0d] p-6">
                <div className="flex gap-4">
                  <img
                    src={item.product.image || "/LOGO.png"}
                    alt={item.product.name}
                    className="h-32 w-32 rounded-3xl object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
                      {item.product.category}
                    </p>
                    <h2 className="text-xl font-bold uppercase tracking-[0.1em] text-white">
                      {item.product.name}
                    </h2>
                    <p className="text-sm text-gray-400 mt-2">{item.product.brand}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Variant: {item.variant.size} / {item.variant.color}
                    </p>
                    <p className="mt-4 text-lg font-bold text-[#D4AF37]">
                      LKR {item.unitPrice.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-4">
                  <div className="flex items-center gap-3 rounded-full border border-neutral-700 bg-[#111] p-2">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item, item.quantity - 1)}
                      className="rounded-full bg-neutral-900 p-2 text-gray-300 hover:text-white"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-base font-bold text-white">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                      className="rounded-full bg-neutral-900 p-2 text-gray-300 hover:text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-gray-400">Subtotal</p>
                    <p className="text-sm font-bold text-white">
                      LKR {item.subTotal.toLocaleString()}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm uppercase tracking-[0.2em] text-red-300 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
