import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  fetchCartAction,
  updateCartItemAction,
  removeFromCartAction,
} from "@/store/cart-slice";
import { checkGuestAction, registerGuestAction } from "@/store/auth-slice";
import {
  generateManualPaymentReference,
  storeManualPaymentContext,
} from "@/store/manualPaymentSlice";
import { createOrder } from "@/store/order-slice";
import { toast } from "@/hooks/use-toast";
import usePageMeta from "@/hooks/use-page-meta";
import VariantSelectors, {
  getColorsForSize,
  getProductSizes,
  getVariantBySelection,
} from "@/components/shopping-components/VariantSelectors";
import {
  Loader2,
  Minus,
  Plus,
  Trash2,
  CreditCard,
  Building2,
  AlertCircle,
  UploadCloud,
  Lock,
  Gift,
} from "lucide-react";
import { motion } from "framer-motion";
import { compressImageFile } from "@/lib/image-compression";
import { cn } from "@/lib/utils";
import { API_V1_URL as API_BASE } from "@/lib/api";

const BUY_NOW_STORAGE_KEY = "saga_buy_now_checkout";

const DEFAULT_MANUAL_BANK_DETAILS = {
  bankName: "Sampath Bank",
  branch: "Hatton",
  accountName: "N.Gayathree",
  accountNumber: "108052612262",
  whatsapp: "+94 77 070 4274",
  deadline: "Pay within 24 hours to confirm your order.",
};

const buildManualPaymentPath = (slug) =>
  slug ? `/shopping/manual-payment/${encodeURIComponent(slug)}` : "/shopping/manual-payment";

const getErrorMessage = (err, fallback) =>
  typeof err === "string" ? err : err?.message || fallback;

const getDiscountedUnitPrice = (product = {}, variant = {}) => {
  const base =
    Number(product?.basePrice || 0) + Number(variant?.priceAdjustment || 0);
  return Math.round(base * (1 - Number(product?.discountPercent || 0) / 100));
};

const getVariantId = (v = {}) => v?.id || v?._id || "";

const normalizeCheckoutVariant = (v = {}) => ({
  id: getVariantId(v),
  sku: v?.sku || "",
  size: v?.size || "",
  color: v?.color || "",
  stock: Number(v?.stock ?? 0),
  priceAdjustment: Number(v?.priceAdjustment || 0),
});

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated } = useSelector((s) => s.auth);
  const { items, totalPrice } = useSelector((s) => s.cart.cart);

  const [formData, setFormData] = useState({
    shippingAddress: "",
    contactNumber: "",
    paymentMethod: "manual_bank_transfer",
    notes: "",
    guestEmail: "",
  });

  const [checkoutItems, setCheckoutItems] = useState([]);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [bankDetails, setBankDetails] = useState(null);

  useEffect(() => {
    dispatch(fetchCartAction());
  }, [dispatch]);

  useEffect(() => {
    setCheckoutItems(items);
    setCheckoutTotal(totalPrice);
  }, [items, totalPrice]);

  useEffect(() => {
    axios
      .get(`${API_BASE}/site-config/bank_details`)
      .then((res) =>
        setBankDetails({
          ...DEFAULT_MANUAL_BANK_DETAILS,
          ...(res.data?.data || {}),
        })
      )
      .catch(() => setBankDetails(DEFAULT_MANUAL_BANK_DETAILS));
  }, []);

  const displayBankDetails = bankDetails || DEFAULT_MANUAL_BANK_DETAILS;

  const whatsAppLink = displayBankDetails.whatsapp
    ? `https://wa.me/${displayBankDetails.whatsapp.replace(/\D/g, "")}`
    : "#";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createOrder({ items: checkoutItems })).unwrap();
      navigate("/shopping/checkout-success");
    } catch (err) {
      toast({
        title: "Checkout failed",
        description: getErrorMessage(err, "Try again later."),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-10 text-white">
      <h1 className="text-3xl mb-6">Checkout</h1>

      {/* BANK SECTION */}
      <div className="bg-[#111] p-6 rounded-lg border border-gray-800">
        <h2 className="text-xl text-[#D4AF37] mb-4">Bank Details</h2>

        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
          <span>Bank:</span>
          <span>{displayBankDetails.bankName}</span>

          <span>Branch:</span>
          <span>{displayBankDetails.branch}</span>

          <span>Account Name:</span>
          <span>{displayBankDetails.accountName}</span>

          <span>Account No:</span>
          <span>{displayBankDetails.accountNumber}</span>

          <span>WhatsApp:</span>
          <span>{displayBankDetails.whatsapp}</span>
        </div>

        <div className="mt-4 text-sm text-gray-400">
          <p>{displayBankDetails.deadline}</p>
          <a href={whatsAppLink} className="text-[#D4AF37]">
            Contact via WhatsApp
          </a>
        </div>
      </div>

      {/* ORDER SUMMARY */}
      <div className="mt-8">
        {checkoutItems.map((item) => (
          <div key={item.id} className="flex justify-between py-2">
            <span>{item.product?.name}</span>
            <span>LKR {item.unitPrice * item.quantity}</span>
          </div>
        ))}

        <div className="mt-4 text-xl font-bold">
          Total: LKR {checkoutTotal}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="mt-6 bg-[#D4AF37] text-black px-6 py-3 rounded"
      >
        Place Order
      </button>
    </div>
  );
};

export default Checkout;