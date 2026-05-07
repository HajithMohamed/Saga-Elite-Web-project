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
  Check,
  ShieldCheck,
  Truck,
  ChevronDown,
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

const SRI_LANKA_DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
  "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
  "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
  "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya",
];

const PAYMENT_METHODS = [
  {
    id: "card",
    label: "Card Payment",
    sublabel: "Visa · Mastercard",
    description: "Instant secure checkout via PayHere gateway.",
    badge: "Activates with hosting",
    icon: CreditCard,
  },
  {
    id: "manual_bank_transfer",
    label: "Manual Bank Transfer",
    sublabel: "Sampath / Commercial / BoC",
    description: "We'll generate a payment reference for your transfer.",
    badge: "Recommended",
    icon: Building2,
  },
];

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

const normalizeBuyNowItem = (item) => {
  if (!item?.product || !item?.variant) return null;

  const quantity = Math.max(1, Number(item.quantity) || 1);
  const unitPrice = getDiscountedUnitPrice(item.product, item.variant);

  return {
    id: `buynow-${item.product.id || item.product._id}-${item.variant.sku}`,
    product: item.product,
    variant: item.variant,
    quantity,
    unitPrice,
    subTotal: unitPrice * quantity,
  };
};

const loadPersistedBuyNowItem = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(BUY_NOW_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persistBuyNowItem = (item) => {
  if (typeof window === "undefined") return;
  if (!item) {
    window.sessionStorage.removeItem(BUY_NOW_STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(BUY_NOW_STORAGE_KEY, JSON.stringify(item));
};

const fieldBaseClass =
  "h-12 w-full rounded-xl border bg-[#0a0a0a] px-4 text-sm text-[#e5e2e1] placeholder-[#574500] transition focus:outline-none focus:ring-2 focus:ring-[#f2ca50]/20";

const Field = ({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  className,
  ...rest
}) => (
  <div className={cn("space-y-2", className)}>
    <label className="se-label block text-[10px] uppercase tracking-[0.28em] text-[#99907c]">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn(
        fieldBaseClass,
        error ? "border-rose-500/60" : "border-[#4d4635]/40 focus:border-[#f2ca50]"
      )}
      {...rest}
    />
    {error && <p className="text-xs text-rose-400">{error}</p>}
  </div>
);

const SelectField = ({
  label,
  value,
  onChange,
  options = [],
  error,
  placeholder = "Select",
  disabled = false,
  className,
}) => (
  <div className={cn("space-y-2", className)}>
    <label className="se-label block text-[10px] uppercase tracking-[0.28em] text-[#99907c]">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          fieldBaseClass,
          "appearance-none pr-10",
          disabled && "cursor-not-allowed opacity-70",
          error ? "border-rose-500/60" : "border-[#4d4635]/40 focus:border-[#f2ca50]"
        )}
      >
        {!value && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-[#0a0a0a]">
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#99907c]" />
    </div>
    {error && <p className="text-xs text-rose-400">{error}</p>}
  </div>
);

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated } = useSelector((s) => s.auth);
  const { items, totalPrice } = useSelector((s) => s.cart.cart);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "Sri Lanka",
    addressLine: "",
    city: "",
    district: "",
    postalCode: "",
    deliveryMode: "delivery",
    notes: "",
    paymentMethod: "manual_bank_transfer",
    termsAccepted: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [checkoutItems, setCheckoutItems] = useState([]);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [bankDetails, setBankDetails] = useState(null);
  const [currentStep] = useState(2);
  const [isBuyNow, setIsBuyNow] = useState(false);
  const [hasInitializedSource, setHasInitializedSource] = useState(false);

  const checkoutSteps = [
    { id: 1, label: "Cart" },
    { id: 2, label: "Delivery" },
    { id: 3, label: "Payment" },
    { id: 4, label: "Complete" },
  ];

  const formatLKR = (value = 0) =>
    `LKR ${(Number(value) || 0).toLocaleString("en-LK", {
      maximumFractionDigits: 0,
    })}`;

  const itemCount = checkoutItems.reduce(
    (sum, item) => sum + (Number(item?.quantity) || 0),
    0
  );

  const cartStateItems = Array.isArray(location.state?.cartItems)
    ? location.state.cartItems
    : null;

  useEffect(() => {
    const routedBuyNowItem = normalizeBuyNowItem(location.state?.buyNowItem);
    const persistedBuyNowItem = normalizeBuyNowItem(loadPersistedBuyNowItem());

    if (routedBuyNowItem) {
      persistBuyNowItem(location.state?.buyNowItem || routedBuyNowItem);
      setIsBuyNow(true);
      setCheckoutItems([routedBuyNowItem]);
      setCheckoutTotal(routedBuyNowItem.subTotal);
      setHasInitializedSource(true);
      return;
    }

    if (cartStateItems?.length) {
      persistBuyNowItem(null);
      setIsBuyNow(false);
      setCheckoutItems(cartStateItems);
      setCheckoutTotal(
        location.state?.cartTotal ||
          cartStateItems.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
          )
      );
      setHasInitializedSource(true);
      return;
    }

    if (persistedBuyNowItem) {
      persistBuyNowItem(persistedBuyNowItem);
      setIsBuyNow(true);
      setCheckoutItems([persistedBuyNowItem]);
      setCheckoutTotal(persistedBuyNowItem.subTotal);
      setHasInitializedSource(true);
      return;
    }

    persistBuyNowItem(null);
    setIsBuyNow(false);
    setHasInitializedSource(true);
    dispatch(fetchCartAction());
  }, [cartStateItems, dispatch, location.state]);

  useEffect(() => {
    if (!hasInitializedSource || isBuyNow) return;
    setCheckoutItems(items);
    setCheckoutTotal(totalPrice);
  }, [hasInitializedSource, isBuyNow, items, totalPrice]);

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

  const updateField = (key) => (eventOrValue) => {
    const value =
      eventOrValue?.target !== undefined
        ? eventOrValue.target.type === "checkbox"
          ? eventOrValue.target.checked
          : eventOrValue.target.value
        : eventOrValue;
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const validate = () => {
    const next = {};
    if (!formData.fullName.trim()) next.fullName = "Required";
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email))
      next.email = "Enter a valid email";
    if (!formData.phone.trim()) next.phone = "Required";
    if (formData.deliveryMode === "delivery") {
      if (!formData.addressLine.trim()) next.addressLine = "Required";
      if (!formData.city.trim()) next.city = "Required";
      if (!formData.district) next.district = "Choose a district";
      if (!formData.postalCode.trim()) next.postalCode = "Required";
    }
    if (!formData.termsAccepted) next.termsAccepted = "Please accept the terms";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (checkoutItems.length === 0) {
      toast({ title: "Your bag is empty", variant: "destructive" });
      return;
    }
    if (!validate()) {
      toast({
        title: "Check your details",
        description: "Some required fields need attention.",
        variant: "destructive",
      });
      return;
    }

    const shippingAddress =
      formData.deliveryMode === "pickup"
        ? `STORE PICKUP — ${formData.fullName}`
        : [
            formData.fullName,
            formData.addressLine,
            `${formData.city}, ${formData.district} ${formData.postalCode}`.trim(),
            formData.country,
          ]
            .filter(Boolean)
            .join("\n");

    const orderItems = checkoutItems
      .map((item) => {
        const productId = item.product?.id || item.product?._id;
        const variantSku = item.variant?.sku;
        if (!productId || !variantSku) return null;
        return {
          productId,
          variantSku,
          size: item.variant?.size || undefined,
          color: item.variant?.color || undefined,
          quantity: Math.max(1, Number(item.quantity) || 1),
        };
      })
      .filter(Boolean);

    if (orderItems.length === 0) {
      toast({
        title: "Cart items unavailable",
        description: "We couldn't read product/variant info for this order.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await dispatch(
        createOrder({
          items: orderItems,
          checkoutMode: isBuyNow ? "buyNow" : "cart",
          shippingAddress,
          contactNumber: formData.phone,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
          guestEmail: formData.email,
        })
      ).unwrap();

      const newOrderId = response?.orderId || response?.data?._id;
      const totalAmount = checkoutTotal;

      persistBuyNowItem(null);

      if (formData.paymentMethod === "card") {
        toast({
          title: "Card payments launching soon",
          description:
            "We've recorded your order — finalising via bank transfer for now.",
          variant: "success",
        });
      }

      navigate("/shopping/manual-payment", {
        state: {
          orderId: newOrderId,
          amount: totalAmount,
        },
      });
    } catch (err) {
      toast({
        title: "Checkout failed",
        description: getErrorMessage(err, "Try again later."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Checkout header */}
      <header className="sticky top-0 z-40 border-b border-[#1c1b1b] bg-[#0a0a0a]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-4 md:px-8">
          <Link to="/shopping/home" className="flex flex-col leading-none">
            <span className="se-serif text-2xl tracking-[0.18em] text-[#e5e2e1]">
              SAGA ELITE
            </span>
            <span className="se-label mt-1 text-[9px] tracking-[0.32em] text-[#99907c]">
              Rare Fit Forever
            </span>
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-[#4d4635]/40 bg-[#0d0d0d] px-4 py-2">
            <Lock className="h-3.5 w-3.5 text-[#f2ca50]" />
            <span className="se-label text-[9px] tracking-[0.28em] text-[#d0c5af]">
              <span className="hidden sm:inline">Secure Checkout · </span>SSL Protected
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-4 pb-32 pt-8 md:px-8">
        {/* Progress stepper */}
        <nav aria-label="Checkout progress" className="mb-12 mt-2">
          <ol className="flex items-center justify-between gap-2 sm:gap-4">
            {checkoutSteps.map((step, index) => {
              const isComplete = step.id < currentStep;
              const isActive = step.id === currentStep;
              const labelTone = isActive
                ? "text-[#f2ca50]"
                : isComplete
                ? "text-[#d0c5af]"
                : "text-[#574500]";
              const circleTone = isComplete
                ? "border-[#f2ca50] bg-[#f2ca50] text-[#0a0a0a]"
                : isActive
                ? "border-[#f2ca50] bg-transparent text-[#f2ca50] shadow-[0_0_24px_rgba(242,202,80,0.45)]"
                : "border-[#4d4635] bg-transparent text-[#574500]";
              return (
                <React.Fragment key={step.id}>
                  <li className="flex items-center gap-3">
                    <div
                      className={cn(
                        "relative flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                        circleTone
                      )}
                    >
                      {isComplete ? (
                        <Check className="h-4 w-4" strokeWidth={3} />
                      ) : (
                        step.id
                      )}
                      {isActive && (
                        <motion.span
                          aria-hidden
                          className="pointer-events-none absolute inset-0 rounded-full"
                          animate={{
                            boxShadow: [
                              "0 0 0 0 rgba(242,202,80,0.55)",
                              "0 0 0 12px rgba(242,202,80,0)",
                            ],
                          }}
                          transition={{ duration: 1.8, repeat: Infinity }}
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        "se-label hidden text-[10px] uppercase tracking-[0.28em] sm:inline",
                        labelTone
                      )}
                    >
                      {step.label}
                    </span>
                  </li>
                  {index < checkoutSteps.length - 1 && (
                    <li
                      aria-hidden
                      className="relative h-px flex-1 overflow-hidden bg-[#1c1b1b]"
                    >
                      <motion.span
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#f2ca50] to-[#ffe088]"
                        initial={{ width: 0 }}
                        animate={{ width: step.id < currentStep ? "100%" : "0%" }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </li>
                  )}
                </React.Fragment>
              );
            })}
          </ol>
        </nav>

        <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left column — checkout sections */}
          <div className="space-y-6 lg:col-span-7">
            {/* Section 02 — Shipping Information */}
            <section className="rounded-[2rem] border border-[#1c1b1b] bg-[#0d0d0d] p-7 md:p-9">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="se-label text-[10px] tracking-[0.32em] text-[#574500]">
                    Step 02
                  </p>
                  <h2 className="se-serif mt-2 text-2xl text-[#e5e2e1] md:text-3xl">
                    Shipping Information
                  </h2>
                  <p className="se-body mt-2 text-sm text-[#99907c]">
                    Where should the drop arrive?
                  </p>
                </div>
                <Truck className="h-6 w-6 shrink-0 text-[#f2ca50]" />
              </div>

              {/* Delivery / Pickup toggle */}
              <div className="mb-6 inline-flex rounded-full border border-[#4d4635]/40 bg-[#0a0a0a] p-1">
                {[
                  { id: "delivery", label: "Delivery", icon: Truck },
                  { id: "pickup", label: "Pickup", icon: Building2 },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const active = formData.deliveryMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => updateField("deliveryMode")(mode.id)}
                      className={cn(
                        "se-label flex items-center gap-2 rounded-full px-5 py-2 text-[10px] uppercase tracking-[0.28em] transition",
                        active
                          ? "bg-[#f2ca50] text-[#0a0a0a]"
                          : "text-[#99907c] hover:text-[#e5e2e1]"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {mode.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Full name"
                  value={formData.fullName}
                  onChange={updateField("fullName")}
                  error={errors.fullName}
                  placeholder="Asanga Perera"
                  className="sm:col-span-2"
                />
                <Field
                  label="Email address"
                  type="email"
                  value={formData.email}
                  onChange={updateField("email")}
                  error={errors.email}
                  placeholder="you@example.com"
                />
                <Field
                  label="Phone number"
                  type="tel"
                  value={formData.phone}
                  onChange={updateField("phone")}
                  error={errors.phone}
                  placeholder="07X XXX XXXX"
                />
                {formData.deliveryMode === "delivery" && (
                  <>
                    <SelectField
                      label="Country"
                      value={formData.country}
                      onChange={updateField("country")}
                      options={["Sri Lanka"]}
                      disabled
                    />
                    <Field
                      label="City"
                      value={formData.city}
                      onChange={updateField("city")}
                      error={errors.city}
                      placeholder="Colombo"
                    />
                    <SelectField
                      label="District"
                      value={formData.district}
                      onChange={updateField("district")}
                      options={SRI_LANKA_DISTRICTS}
                      placeholder="Choose a district"
                      error={errors.district}
                    />
                    <Field
                      label="Postal code"
                      value={formData.postalCode}
                      onChange={updateField("postalCode")}
                      error={errors.postalCode}
                      placeholder="00100"
                    />
                    <Field
                      label="Address line"
                      value={formData.addressLine}
                      onChange={updateField("addressLine")}
                      error={errors.addressLine}
                      placeholder="No 12, Galle Road"
                      className="sm:col-span-2"
                    />
                  </>
                )}
              </div>

              <label className="mt-6 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={updateField("termsAccepted")}
                  className="mt-0.5 h-4 w-4 cursor-pointer rounded border border-[#4d4635] bg-[#0a0a0a] accent-[#f2ca50]"
                />
                <span className="se-body text-sm text-[#d0c5af]">
                  I have read and agree to the{" "}
                  <Link to="/terms" className="text-[#f2ca50] hover:text-[#ffe088]">
                    Terms & Conditions
                  </Link>
                  .
                </span>
              </label>
              {errors.termsAccepted && (
                <p className="mt-2 text-xs text-rose-400">{errors.termsAccepted}</p>
              )}
            </section>

            {/* Section 03 — Payment Method */}
            <section className="rounded-[2rem] border border-[#1c1b1b] bg-[#0d0d0d] p-7 md:p-9">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="se-label text-[10px] tracking-[0.32em] text-[#574500]">
                    Step 03
                  </p>
                  <h2 className="se-serif mt-2 text-2xl text-[#e5e2e1] md:text-3xl">
                    Payment Method
                  </h2>
                  <p className="se-body mt-2 text-sm text-[#99907c]">
                    Choose how you'd like to pay.
                  </p>
                </div>
                <CreditCard className="h-6 w-6 shrink-0 text-[#f2ca50]" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isSelected = formData.paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => updateField("paymentMethod")(method.id)}
                      className={cn(
                        "group relative flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all",
                        isSelected
                          ? "border-[#f2ca50] bg-[#0a0a0a] shadow-[0_0_24px_rgba(242,202,80,0.18)]"
                          : "border-[#4d4635]/40 bg-[#0a0a0a] hover:border-[#99907c]"
                      )}
                    >
                      <div className="flex w-full items-start justify-between">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full border transition",
                            isSelected
                              ? "border-[#f2ca50] bg-[#f2ca50]/10"
                              : "border-[#4d4635]/40 bg-[#131313]"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-5 w-5",
                              isSelected ? "text-[#f2ca50]" : "text-[#99907c]"
                            )}
                          />
                        </div>
                        <span
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-full border transition",
                            isSelected
                              ? "border-[#f2ca50] bg-[#f2ca50]"
                              : "border-[#4d4635]/60"
                          )}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-[#0a0a0a]" strokeWidth={3} />
                          )}
                        </span>
                      </div>
                      <div>
                        <p className="se-body text-sm font-medium text-[#e5e2e1]">
                          {method.label}
                        </p>
                        <p className="se-label mt-1 text-[9px] uppercase tracking-[0.28em] text-[#574500]">
                          {method.sublabel}
                        </p>
                        <p className="se-body mt-2 text-xs text-[#99907c]">
                          {method.description}
                        </p>
                      </div>
                      {method.badge && (
                        <span
                          className={cn(
                            "se-label rounded-full border px-3 py-1 text-[9px] tracking-[0.28em]",
                            method.id === "card"
                              ? "border-amber-500/30 bg-amber-500/5 text-amber-300"
                              : "border-[#4d4635]/40 bg-[#131313] text-[#99907c]"
                          )}
                        >
                          {method.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {formData.paymentMethod === "manual_bank_transfer" && (
                <div className="mt-6 rounded-2xl border border-[#4d4635]/40 bg-[#0a0a0a] p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="se-label text-[10px] tracking-[0.32em] text-[#f2ca50]">
                      Bank details
                    </span>
                    <span className="se-label text-[9px] tracking-[0.28em] text-[#574500]">
                      Reference will be generated
                    </span>
                  </div>
                  <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 se-body text-sm">
                    <dt className="text-[#99907c]">Bank</dt>
                    <dd className="text-[#e5e2e1]">{displayBankDetails.bankName}</dd>
                    <dt className="text-[#99907c]">Branch</dt>
                    <dd className="text-[#e5e2e1]">{displayBankDetails.branch}</dd>
                    <dt className="text-[#99907c]">Account name</dt>
                    <dd className="text-[#e5e2e1]">
                      {displayBankDetails.accountName}
                    </dd>
                    <dt className="text-[#99907c]">Account no</dt>
                    <dd className="se-instrument text-[#f2ca50]">
                      {displayBankDetails.accountNumber}
                    </dd>
                  </dl>
                  <p className="se-body mt-4 border-t border-[#1c1b1b] pt-4 text-sm text-[#d0c5af]">
                    {displayBankDetails.deadline}
                  </p>
                  <a
                    href={whatsAppLink}
                    target="_blank"
                    rel="noreferrer"
                    className="se-label mt-2 inline-flex items-center gap-2 text-[10px] tracking-[0.28em] text-[#f2ca50] transition hover:text-[#ffe088]"
                  >
                    Need help? WhatsApp →
                  </a>
                </div>
              )}

              {formData.paymentMethod === "card" && (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                  <div>
                    <p className="se-body text-sm text-amber-100">
                      Card gateway activates after hosting setup.
                    </p>
                    <p className="se-body mt-1 text-xs text-amber-200/70">
                      For now, your order will be processed via the same secure
                      bank-transfer reference flow.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right column — sticky order summary */}
          <aside className="lg:col-span-5">
            <div className="space-y-5 lg:sticky lg:top-28">
              <div className="rounded-[2rem] border border-[#1c1b1b] bg-gradient-to-b from-[#131313] to-[#0d0d0d] p-7 shadow-[0_0_60px_rgba(242,202,80,0.04)]">
                <div className="mb-6 flex items-end justify-between">
                  <div>
                    <p className="se-label text-[10px] tracking-[0.32em] text-[#574500]">
                      Order
                    </p>
                    <h2 className="se-serif mt-1 text-xl text-[#e5e2e1]">
                      Your Selection
                    </h2>
                  </div>
                  <span className="se-instrument text-sm text-[#99907c]">
                    {itemCount} {itemCount === 1 ? "piece" : "pieces"}
                  </span>
                </div>

                {checkoutItems.length === 0 ? (
                  <p className="se-body py-6 text-center text-sm text-[#574500]">
                    Your bag is empty.
                  </p>
                ) : (
                  <ul className="mb-6 space-y-4">
                    {checkoutItems.map((item) => (
                      <li key={item.id} className="flex items-center gap-4">
                        <div className="h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-[#1c1b1b]">
                          {item.product?.images?.[0]?.url ? (
                            <img
                              src={item.product.images[0].url}
                              alt={item.product?.name || ""}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="se-body truncate text-sm text-[#e5e2e1]">
                            {item.product?.name}
                          </p>
                          {(item.variant?.size || item.variant?.color) && (
                            <p className="se-label mt-0.5 text-[9px] tracking-[0.28em] text-[#574500]">
                              {[item.variant?.size, item.variant?.color]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                          <p className="se-instrument mt-1 text-xs text-[#99907c]">
                            Qty {item.quantity}
                          </p>
                        </div>
                        <span className="se-instrument shrink-0 text-sm text-[#e5e2e1]">
                          {formatLKR(item.unitPrice * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="space-y-3 border-t border-[#1c1b1b] pt-5">
                  <div className="flex justify-between se-body text-sm text-[#d0c5af]">
                    <span>Subtotal</span>
                    <span>{formatLKR(checkoutTotal)}</span>
                  </div>
                  <div className="flex justify-between se-body text-sm text-[#99907c]">
                    <span className="inline-flex items-center gap-2">
                      <Truck className="h-3.5 w-3.5" />
                      Delivery
                    </span>
                    <span>Calculated next step</span>
                  </div>
                </div>

                <div className="mt-5 flex items-baseline justify-between border-t border-[#1c1b1b] pt-5">
                  <span className="se-label text-[10px] tracking-[0.32em] text-[#99907c]">
                    Total
                  </span>
                  <span className="se-instrument text-3xl text-[#f2ca50]">
                    {formatLKR(checkoutTotal)}
                  </span>
                </div>
              </div>

              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                disabled={checkoutItems.length === 0 || isSubmitting}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#f2ca50] text-sm font-bold uppercase tracking-[0.18em] text-[#0a0a0a] shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] transition-all hover:bg-[#ffe088] hover:shadow-[0_6px_20px_rgba(212,175,55,0.45)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Placing order...
                  </>
                ) : formData.paymentMethod === "card" ? (
                  "Pay Now"
                ) : (
                  "Continue to Bank Transfer"
                )}
              </motion.button>

              <p className="se-body text-center text-xs text-[#574500]">
                {formData.paymentMethod === "card"
                  ? "You'll be redirected to the secure payment gateway."
                  : "Next: receive your bank transfer reference number."}
              </p>

              <div className="flex items-center justify-around border-t border-[#1c1b1b] pt-4 text-[#99907c]">
                <div className="flex flex-col items-center gap-1">
                  <Lock className="h-4 w-4" />
                  <span className="se-label text-[9px] tracking-[0.28em]">SSL</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="se-label text-[9px] tracking-[0.28em]">Trusted</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Gift className="h-4 w-4" />
                  <span className="se-label text-[9px] tracking-[0.28em]">Reward</span>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
