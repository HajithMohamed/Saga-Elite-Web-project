<<<<<<< HEAD
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
=======
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { createOrder } from "@/store/order-slice";
import { toast } from "@/hooks/use-toast";

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cart, isLoading } = useSelector((state) => state.order);

  const [formData, setFormData] = useState({
    shippingAddress: "",
    contactNumber: "",
    paymentMethod: "online",
    receiptInfo: "",
    notes: "",
  });

  const [formError, setFormError] = useState(null);

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (cart.length === 0) {
      setFormError("Your cart is empty. Add items before checking out.");
      return;
    }

    if (!formData.shippingAddress.trim() || !formData.contactNumber.trim()) {
      setFormError("Shipping address and contact number are required.");
      return;
    }

    if (formData.paymentMethod === "receipt" && !formData.receiptInfo.trim()) {
      setFormError("Please provide WhatsApp receipt details for receipt payment.");
      return;
    }

    setFormError(null);

    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.productId,
          variantSku: item.variantSku,
          quantity: item.quantity,
        })),
        shippingAddress: formData.shippingAddress.trim(),
        contactNumber: formData.contactNumber.trim(),
        paymentMethod: formData.paymentMethod,
        receiptInfo: formData.paymentMethod === "receipt" ? formData.receiptInfo.trim() : "",
        notes: formData.notes.trim(),
      };

      await dispatch(createOrder(payload)).unwrap();
      toast({
        title: "Order placed",
        description: "Your order was submitted successfully.",
        variant: "success",
      });
      navigate("/shopping/account");
    } catch (error) {
      toast({
        title: "Checkout failed",
        description: error || "Please try again.",
>>>>>>> 8fdbd2946fdad1c686ebf23637121492c0fefd87
        variant: "destructive",
      });
    }
  };

<<<<<<< HEAD
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37]" />
=======
  if (!cart.length) {
    return (
      <div className="min-h-screen bg-[#060606] text-white py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-widest text-white">Your cart is empty</h1>
          <p className="mt-4 text-gray-400">
            Add a few products to your cart before checking out.
          </p>
          <Link
            to="/shopping/product-list"
            className="mt-8 inline-flex rounded-full bg-[#D4AF37] px-8 py-4 text-sm font-bold uppercase text-black tracking-[0.2em] transition hover:bg-[#b99329]"
          >
            Start shopping
          </Link>
        </div>
>>>>>>> 8fdbd2946fdad1c686ebf23637121492c0fefd87
      </div>
    );
  }

  return (
<<<<<<< HEAD
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
=======
    <div className="min-h-screen bg-[#060606] text-white py-10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-widest text-white">Checkout</h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-400">
              Complete your purchase with online payment or send your receipt via WhatsApp for manual confirmation.
            </p>
          </div>
          <div className="rounded-3xl border border-[#D4AF37]/10 bg-[#090909] p-5 text-sm text-gray-300">
            <p className="uppercase tracking-[0.2em] text-[#D4AF37]">Order summary</p>
            <div className="mt-4 space-y-3">
              {cart.map((item) => (
                <div key={item.cartId} className="flex items-center justify-between gap-2 border-b border-[#D4AF37]/10 pb-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.productName}</p>
                    <p className="text-xs text-gray-500">{item.variantName}</p>
                  </div>
                  <p className="text-sm text-white">₹{(item.unitPrice * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-white">
              <span>Total</span>
              <span className="font-bold">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6 rounded-3xl border border-[#D4AF37]/10 bg-[#090909] p-8">
            <div>
              <h2 className="text-xl font-semibold text-white">Shipping details</h2>
              <p className="mt-2 text-sm text-gray-400">Provide your shipping address and contact information.</p>
            </div>

            <label className="block text-sm font-medium text-gray-200">
              Shipping address
              <textarea
                name="shippingAddress"
                value={formData.shippingAddress}
                onChange={handleChange}
                rows="5"
                className="mt-3 w-full rounded-3xl border border-gray-700 bg-[#080808] px-4 py-4 text-sm text-white outline-none focus:border-[#D4AF37]"
              />
            </label>

            <label className="block text-sm font-medium text-gray-200">
              Contact number
              <input
                type="text"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="WhatsApp number or mobile number"
                className="mt-3 w-full rounded-3xl border border-gray-700 bg-[#080808] px-4 py-4 text-sm text-white outline-none focus:border-[#D4AF37]"
              />
            </label>

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-200">Payment method</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: "online", label: "Online Payment", description: "Immediate confirmation." },
                  { value: "receipt", label: "WhatsApp Receipt", description: "Send payment receipt for manual confirmation." },
                ].map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: option.value }))}
                    className={`rounded-3xl border px-5 py-4 text-left transition ${
                      formData.paymentMethod === option.value
                        ? "border-[#D4AF37] bg-[#181818]"
                        : "border-gray-700 bg-[#080808] hover:border-[#D4AF37]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">{option.label}</p>
                    <p className="mt-2 text-xs text-gray-400">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {formData.paymentMethod === "receipt" && (
              <label className="block text-sm font-medium text-gray-200">
                WhatsApp receipt details
                <textarea
                  name="receiptInfo"
                  value={formData.receiptInfo}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Enter the receipt number, WhatsApp message, payment reference or receipt link."
                  className="mt-3 w-full rounded-3xl border border-gray-700 bg-[#080808] px-4 py-4 text-sm text-white outline-none focus:border-[#D4AF37]"
                />
              </label>
            )}

            <label className="block text-sm font-medium text-gray-200">
              Order notes (optional)
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Extra delivery instructions or preferred time."
                className="mt-3 w-full rounded-3xl border border-gray-700 bg-[#080808] px-4 py-4 text-sm text-white outline-none focus:border-[#D4AF37]"
              />
            </label>

            {formError && <p className="text-sm text-red-400">{formError}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#D4AF37] px-6 py-4 text-sm font-bold uppercase text-black tracking-[0.2em] transition hover:bg-[#b99329] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Processing order..." : "Place order"}
            </button>
          </div>

          <aside className="space-y-6 rounded-3xl border border-[#D4AF37]/10 bg-[#090909] p-8">
            <div>
              <h2 className="text-xl font-semibold text-white">Need help?</h2>
              <p className="mt-2 text-sm text-gray-400">
                If you choose WhatsApp receipt payment, our team will confirm your order after verifying the receipt.
              </p>
            </div>
            <div className="space-y-3 rounded-3xl bg-[#111111] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Shipping</p>
              <p className="text-sm text-gray-400">Orders are shipped once payment has been confirmed. Keep your contact number active for updates.</p>
            </div>
            <div className="space-y-3 rounded-3xl bg-[#111111] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Payment note</p>
              <p className="text-sm text-gray-400">Online payment is treated as paid instantly. Receipt payments remain pending until admin confirmation.</p>
            </div>
          </aside>
        </form>
>>>>>>> 8fdbd2946fdad1c686ebf23637121492c0fefd87
      </div>
    </div>
  );
};

export default Checkout;
