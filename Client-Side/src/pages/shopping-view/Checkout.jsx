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
        variant: "destructive",
      });
    }
  };

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
      </div>
    );
  }

  return (
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
      </div>
    </div>
  );
};

export default Checkout;
