import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  fetchCartAction,
  updateCartItemAction,
  removeFromCartAction,
} from "@/store/cart-slice";
import { createOrder } from "@/store/order-slice";
import { toast } from "@/hooks/use-toast";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items = [], totalPrice = 0, isLoading } =
    useSelector((state) => state.cart.cart);

  const [formData, setFormData] = useState({
    shippingAddress: "",
    contactNumber: "",
    paymentMethod: "online",
    receiptInfo: "",
    notes: "",
  });

  const [formError, setFormError] = useState(null);

  useEffect(() => {
    dispatch(fetchCartAction());
  }, [dispatch]);

  // ---------------- CART ACTIONS ----------------
  const handleQuantityChange = async (item, quantity) => {
    try {
      if (quantity < 1) return;

      await dispatch(
        updateCartItemAction({
          itemId: item.id,
          quantity,
        })
      ).unwrap();
    } catch (err) {
      toast({
        title: "Update failed",
        description: err?.message || "Unable to update quantity.",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await dispatch(removeFromCartAction(itemId)).unwrap();

      toast({
        title: "Removed",
        description: "Item removed from cart.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Remove failed",
        description: err?.message || "Unable to remove item.",
        variant: "destructive",
      });
    }
  };

  // ---------------- FORM HANDLING ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  // ---------------- ORDER SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!items.length) {
      setFormError("Your cart is empty.");
      return;
    }

    if (!formData.shippingAddress || !formData.contactNumber) {
      setFormError("Shipping address and contact number are required.");
      return;
    }

    if (
      formData.paymentMethod === "receipt" &&
      !formData.receiptInfo
    ) {
      setFormError("Please provide receipt details.");
      return;
    }

    setFormError(null);

    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.productId,
          variantSku: item.variantSku,
          quantity: item.quantity,
        })),
        shippingAddress: formData.shippingAddress,
        contactNumber: formData.contactNumber,
        paymentMethod: formData.paymentMethod,
        receiptInfo:
          formData.paymentMethod === "receipt"
            ? formData.receiptInfo
            : "",
        notes: formData.notes,
      };

      await dispatch(createOrder(payload)).unwrap();

      toast({
        title: "Order placed",
        description: "Your order was successfully submitted.",
        variant: "success",
      });

      navigate("/shopping/account");
    } catch (err) {
      toast({
        title: "Checkout failed",
        description: err?.message || "Try again later.",
        variant: "destructive",
      });
    }
  };

  // ---------------- LOADING ----------------
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  // ---------------- EMPTY CART ----------------
  if (!items.length) {
    return (
      <div className="min-h-screen bg-[#060606] text-white flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold">Your cart is empty</h1>
        <p className="text-gray-400 mt-2">
          Add products before checkout
        </p>
        <Link
          to="/shopping/product-list"
          className="mt-6 bg-[#D4AF37] px-6 py-3 rounded-full text-black font-bold"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060606] text-white py-12">
      <div className="container mx-auto px-4 md:px-8 grid lg:grid-cols-2 gap-10">

        {/* LEFT: CART */}
        <div>
          <h1 className="text-3xl font-bold mb-6">Checkout</h1>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 bg-[#0d0d0d] p-4 rounded-2xl border border-[#222]"
              >
                <img
                  src={item.product.image || "/LOGO.png"}
                  className="h-24 w-24 object-cover rounded-xl"
                />

                <div className="flex-1">
                  <h2 className="font-semibold">
                    {item.product.name}
                  </h2>

                  <p className="text-sm text-gray-400">
                    {item.variant.size} / {item.variant.color}
                  </p>

                  <p className="text-[#D4AF37] font-bold mt-2">
                    LKR {item.unitPrice}
                  </p>

                  {/* Quantity */}
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() =>
                        handleQuantityChange(item, item.quantity - 1)
                      }
                    >
                      <Minus size={16} />
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() =>
                        handleQuantityChange(item, item.quantity + 1)
                      }
                    >
                      <Plus size={16} />
                    </button>

                    <button
                      onClick={() => handleRemove(item.id)}
                      className="ml-auto text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TOTAL */}
          <div className="mt-6 text-xl font-bold">
            Total: LKR {totalPrice || totalAmount}
          </div>
        </div>

        {/* RIGHT: FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#0d0d0d] p-6 rounded-3xl border border-[#222]"
        >
          <h2 className="text-xl font-bold mb-4">
            Shipping Details
          </h2>

          <input
            name="shippingAddress"
            value={formData.shippingAddress}
            onChange={handleChange}
            placeholder="Shipping Address"
            className="w-full p-3 mb-3 bg-black border border-gray-700 rounded-xl"
          />

          <input
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            placeholder="Contact Number"
            className="w-full p-3 mb-3 bg-black border border-gray-700 rounded-xl"
          />

          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            className="w-full p-3 mb-3 bg-black border border-gray-700 rounded-xl"
          >
            <option value="online">Online Payment</option>
            <option value="receipt">WhatsApp Receipt</option>
          </select>

          {formData.paymentMethod === "receipt" && (
            <textarea
              name="receiptInfo"
              value={formData.receiptInfo}
              onChange={handleChange}
              placeholder="Receipt details"
              className="w-full p-3 mb-3 bg-black border border-gray-700 rounded-xl"
            />
          )}

          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Notes (optional)"
            className="w-full p-3 mb-3 bg-black border border-gray-700 rounded-xl"
          />

          {formError && (
            <p className="text-red-400 text-sm mb-3">
              {formError}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-[#D4AF37] text-black font-bold py-3 rounded-full"
          >
            Place Order
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;