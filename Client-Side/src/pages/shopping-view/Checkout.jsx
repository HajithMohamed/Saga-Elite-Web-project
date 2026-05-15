import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import axiosInstance from "@/api/axiosInstance";
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
  Eyebrow,
  resolveColor,
  ColorSwatch,
  SizeChip,
} from "@/components/ui/editorial";
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
  Copy,
  Clock,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { API_V1_URL as API_BASE } from "@/lib/api";

const BUY_NOW_STORAGE_KEY = "saga_buy_now_checkout";
const CHECKOUT_PERSIST_KEY = "saga_checkout_form_state";
const FREE_SHIPPING_THRESHOLD = 20000;

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

const FAST_DISTRICTS = ["Colombo", "Gampaha", "Kalutara"];

const DELIVERY_METHODS = [
  {
    id: "standard",
    label: "Standard Delivery",
    eta: "3-5 Business Days",
    fastEta: "1-2 Business Days", // For fast districts
    price: 450,
    icon: Truck,
    desc: "Carefully packaged and tracked.",
  },
  {
    id: "express",
    label: "Express VIP",
    eta: "Next Business Day",
    fastEta: "Same/Next Day",
    price: 1200,
    icon: Package,
    desc: "Priority dispatch. Signature packaging.",
  },
  {
    id: "pickup",
    label: "Atelier Pickup",
    eta: "Ready in 2 Hours",
    fastEta: "Ready in 2 Hours",
    price: 0,
    icon: Building2,
    desc: "Collect from our flagship store.",
  },
];

const PAYMENT_METHODS = [
  {
    id: "card",
    label: "Card Payment",
    sublabel: "Visa · Mastercard",
    description: "Secure checkout on our demo gateway (PayHere wires in post-hosting).",
    badge: "Demo mode",
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

const VALID_SRI_LANKAN_MOBILE_PREFIXES = new Set(["70", "71", "72", "74", "75", "76", "77", "78"]);

const stripPhoneDigits = (value) => String(value || "").replace(/\D/g, "");

const normalizeSriLankanPhoneForMatch = (value) => {
  const digits = stripPhoneDigits(value);
  if (!digits) return "";

  if (digits.startsWith("0094") && digits.length >= 13) {
    return `94${digits.slice(4)}`;
  }

  if (digits.startsWith("94") && digits.length >= 11) {
    return digits.slice(0, 11);
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `94${digits.slice(1)}`;
  }

  if (digits.length === 9 && VALID_SRI_LANKAN_MOBILE_PREFIXES.has(digits.slice(0, 2))) {
    return `94${digits}`;
  }

  return digits;
};

const isValidSriLankanMobile = (value) => {
  const digits = stripPhoneDigits(value);
  if (!digits) return false;

  let localDigits = digits;

  if (localDigits.startsWith("0094") && localDigits.length >= 13) {
    localDigits = localDigits.slice(4);
  } else if (localDigits.startsWith("94") && localDigits.length >= 11) {
    localDigits = localDigits.slice(2);
  } else if (localDigits.startsWith("0") && localDigits.length === 10) {
    localDigits = localDigits.slice(1);
  }

  if (localDigits.length !== 9) return false;
  return VALID_SRI_LANKAN_MOBILE_PREFIXES.has(localDigits.slice(0, 2));
};

const formatSriLankanPhoneInput = (value) => {
  const digits = stripPhoneDigits(value);
  if (!digits) return "";

  let localDigits = digits;

  if (localDigits.startsWith("0094") && localDigits.length >= 13) {
    localDigits = localDigits.slice(4);
  } else if (localDigits.startsWith("94") && localDigits.length >= 11) {
    localDigits = localDigits.slice(2);
  } else if (localDigits.startsWith("0") && localDigits.length === 10) {
    localDigits = localDigits.slice(1);
  }

  if (localDigits.length === 9) {
    localDigits = `0${localDigits}`;
  }

  const display = localDigits.length > 10 ? localDigits.slice(0, 10) : localDigits;

  if (display.length <= 3) return display;
  if (display.length <= 6) return `${display.slice(0, 3)} ${display.slice(3)}`;
  return `${display.slice(0, 3)} ${display.slice(3, 6)} ${display.slice(6, 10)}`;
};

const useCheckoutPersistence = (initialValue) => {
  const [val, setVal] = useState(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = window.localStorage.getItem(CHECKOUT_PERSIST_KEY);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });


  useEffect(() => {
    window.localStorage.setItem(CHECKOUT_PERSIST_KEY, JSON.stringify(val));
  }, [val]);

  const clearPersisted = () => {
    window.localStorage.removeItem(CHECKOUT_PERSIST_KEY);
  };

  return [val, setVal, clearPersisted];
};

const getDiscountedUnitPrice = (product = {}, variant = {}) => {
  const base =
    Number(product?.basePrice || 0) + Number(variant?.priceAdjustment || 0);
  return Math.round(base * (1 - Number(product?.discountPercent || 0) / 100));
};

const getVariantId = (v = {}) => v?.id || v?._id || "";

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
  "h-12 w-full rounded-xl border bg-[#0a0a0a] px-4 text-sm text-[#e5e2e1] placeholder-[#574500] transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20";

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
        error ? "border-rose-500/60" : "border-[#4d4635]/40 focus:border-[var(--accent)]"
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
          error ? "border-rose-500/60" : "border-[#4d4635]/40 focus:border-[var(--accent)]"
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

  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const { items, totalPrice } = useSelector((s) => s.cart.cart);

  const [formData, setFormData, clearPersisted] = useCheckoutPersistence({
    fullName: "",
    email: "",
    phone: "",
    alternativePhone: "",
    country: "Sri Lanka",
    addressLine: "",
    city: "",
    district: "",
    postalCode: "",
    deliveryMode: "standard",
    notes: "",
    paymentMethod: "manual_bank_transfer",
    termsAccepted: false,
    couponCode: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [bankDetails, setBankDetails] = useState(null);
  const [currentStep, setCurrentStep] = useState("contact"); // contact, address, payment
  const [isBuyNow, setIsBuyNow] = useState(false);
  const [hasInitializedSource, setHasInitializedSource] = useState(false);
  const [couponExpanded, setCouponExpanded] = useState(false);

  // Saved addresses (Fix #4) — for both guests and registered users
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [useNewAddress, setUseNewAddress] = useState(true);

  // Guest OTP for manual bank transfer (Fix #3)
  const [otpModal, setOtpModal] = useState({
    open: false,
    sending: false,
    sent: false,
    code: "",
    verifying: false,
  });
  const [guestVerified, setGuestVerified] = useState(false);

  const checkoutSteps = [
    { id: "contact", label: "Contact", num: 1 },
    { id: "address", label: "Delivery", num: 2 },
    { id: "payment", label: "Payment", num: 3 },
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

  // Saved addresses fetch (Fix #4)
  useEffect(() => {
    if (isAuthenticated) {
      axiosInstance
        .get("/user/addresses")
        .then((res) => {
          const list = res.data?.data?.addresses || [];
          setSavedAddresses(list);
          if (list.length > 0) setUseNewAddress(false);
        })
        .catch(() => setSavedAddresses([]));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    setFormData((prev) => {
      const next = { ...prev };
      let updated = false;

      const profileName = String(user.name || user.username || "").trim();
      const profileEmail = String(user.email || "").trim();
      const profilePhone = formatSriLankanPhoneInput(user.phoneNumber || "");

      if (!next.fullName.trim() && profileName) {
        next.fullName = profileName;
        updated = true;
      }

      if (!next.email.trim() && profileEmail) {
        next.email = profileEmail;
        updated = true;
      }

      if (!next.phone.trim() && profilePhone) {
        next.phone = profilePhone;
        updated = true;
      }

      return updated ? next : prev;
    });
  }, [isAuthenticated, user, setFormData]);

  const fetchGuestAddresses = (email) => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return;
    axiosInstance
      .get("/guest/addresses", { params: { email } })
      .then((res) => {
        const list = res.data?.data?.addresses || [];
        setSavedAddresses(list);
        if (list.length > 0) setUseNewAddress(false);
      })
      .catch(() => setSavedAddresses([]));
  };

  const applySavedAddress = (addr) => {
    if (!addr) return;
    setFormData((prev) => ({
      ...prev,
      addressLine: addr.street || "",
      city: addr.city || "",
      postalCode: addr.postalCode || "",
      country: addr.country || "Sri Lanka",
      district: prev.district, // district isn't on saved address; user picks
    }));
  };

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

  // Theme Accent Color Logic
  const primaryColorName = checkoutItems[0]?.variant?.color;
  const themeColor = primaryColorName ? resolveColor(primaryColorName) : "#f2ca50";
  
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", themeColor);
    return () => {
      document.documentElement.style.removeProperty("--accent");
    };
  }, [themeColor]);

  // Delivery Pricing Logic
  const isFastDistrict = FAST_DISTRICTS.includes(formData.district);
  const selectedDelivery = DELIVERY_METHODS.find(m => m.id === formData.deliveryMode) || DELIVERY_METHODS[0];
  const isFreeShippingQualify = checkoutTotal >= FREE_SHIPPING_THRESHOLD;
  
  const shippingFee = formData.deliveryMode === "pickup" 
    ? 0 
    : formData.deliveryMode === "standard" && isFreeShippingQualify 
      ? 0 
      : selectedDelivery.price;

  const finalTotal = checkoutTotal + shippingFee;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - checkoutTotal);
  const shippingProgress = Math.min(100, (checkoutTotal / FREE_SHIPPING_THRESHOLD) * 100);

  const displayBankDetails = bankDetails || DEFAULT_MANUAL_BANK_DETAILS;
  const whatsAppLink = displayBankDetails.whatsapp
    ? `https://wa.me/${displayBankDetails.whatsapp.replace(/\D/g, "")}`
    : "#";

  const handlePhoneChange = (e) => {
    const val = formatSriLankanPhoneInput(e.target.value);
    setFormData((prev) => ({ ...prev, phone: val }));
    setErrors((prev) => ({ ...prev, phone: undefined, alternativePhone: undefined }));
  };

  const handleAlternativePhoneChange = (e) => {
    const val = formatSriLankanPhoneInput(e.target.value);
    setFormData((prev) => ({ ...prev, alternativePhone: val }));
    setErrors((prev) => ({ ...prev, alternativePhone: undefined }));
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, email: val }));
    setErrors((prev) => ({ ...prev, email: undefined }));
    // Email change invalidates any prior OTP verification.
    setGuestVerified(false);
    // Simple typo suggestion
    if (val.includes("@gmai.com") || val.includes("@gmail.co") || val.includes("@gnail.com")) {
      setErrors((prev) => ({ ...prev, emailHint: "Did you mean @gmail.com?" }));
    } else {
      setErrors((prev) => ({ ...prev, emailHint: undefined }));
    }
  };

  // ── OTP modal handlers (Fix #3) ──
  const sendGuestOtp = async () => {
    setOtpModal((m) => ({ ...m, sending: true }));
    try {
      await axiosInstance.post("/guest/otp/send", {
        email: formData.email,
        phone: formData.phone,
        name: formData.fullName,
      });
      setOtpModal((m) => ({ ...m, sending: false, sent: true }));
      toast({ title: "OTP sent", description: "Check your email and WhatsApp." });
    } catch (err) {
      setOtpModal((m) => ({ ...m, sending: false }));
      toast({
        title: "Could not send OTP",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    }
  };

  const verifyGuestOtp = async () => {
    if (!/^\d{4}$/.test(otpModal.code.trim())) {
      toast({ title: "Enter the 4-digit code", variant: "destructive" });
      return;
    }
    setOtpModal((m) => ({ ...m, verifying: true }));
    try {
      await axiosInstance.post("/guest/otp/verify", {
        email: formData.email,
        otp: otpModal.code.trim(),
      });
      setGuestVerified(true);
      setOtpModal({ open: false, sending: false, sent: false, code: "", verifying: false });
      toast({ title: "Verified", description: "Placing your order…", variant: "success" });
      // Re-trigger submit now that we're verified.
      setTimeout(() => {
        document
          .querySelector("form")
          ?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }, 50);
    } catch (err) {
      setOtpModal((m) => ({ ...m, verifying: false }));
      toast({
        title: "Verification failed",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    }
  };

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

  const validateStep = (step) => {
    const next = {};
    if (step === "contact" || step === "all") {
      if (!formData.fullName.trim()) next.fullName = "Required";
      if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email))
        next.email = "Enter a valid email";
      if (!formData.phone.trim() || !isValidSriLankanMobile(formData.phone)) {
        next.phone = "Enter a valid Sri Lankan mobile number";
      }

      if (formData.alternativePhone.trim()) {
        if (!isValidSriLankanMobile(formData.alternativePhone)) {
          next.alternativePhone = "Enter a valid Sri Lankan mobile number";
        } else if (
          normalizeSriLankanPhoneForMatch(formData.phone) ===
          normalizeSriLankanPhoneForMatch(formData.alternativePhone)
        ) {
          next.alternativePhone = "Alternative phone must be different from the primary phone";
        }
      }
    }
    if ((step === "address" || step === "all") && formData.deliveryMode !== "pickup") {
      if (!formData.addressLine.trim()) next.addressLine = "Required";
      if (!formData.city.trim()) next.city = "Required";
      if (!formData.district) next.district = "Choose a district";
      if (!formData.postalCode.trim()) next.postalCode = "Required";
    }
    if (step === "payment" || step === "all") {
      if (!formData.termsAccepted) next.termsAccepted = "Please accept the terms";
    }
    setErrors(next);
    return next;
  };

  const proceedToStep = (step) => {
    if (currentStep === "contact") {
      const nextErrors = validateStep("contact");
      if (Object.keys(nextErrors).length === 0) setCurrentStep("address");
    } else if (currentStep === "address") {
      const nextErrors = validateStep("address");
      if (Object.keys(nextErrors).length === 0) setCurrentStep("payment");
    }
    else if (step) setCurrentStep(step); // allow backward nav without validation
  };

  const handleQuantity = async (item, newQuantity) => {
    if (isBuyNow || newQuantity < 1) return;
    try {
      await dispatch(updateCartItemAction({ itemId: item.id, quantity: newQuantity })).unwrap();
      dispatch(fetchCartAction());
    } catch (err) {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const handleRemove = async (itemId) => {
    if (isBuyNow) {
      setCheckoutItems([]);
      return;
    }
    try {
      await dispatch(removeFromCartAction(itemId)).unwrap();
      dispatch(fetchCartAction());
    } catch (err) {
      toast({ title: "Remove failed", variant: "destructive" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (checkoutItems.length === 0) {
      toast({ title: "Your bag is empty", variant: "destructive" });
      return;
    }
    const nextErrors = validateStep("all");
    if (Object.keys(nextErrors).length > 0) {
      toast({
        title: "Check your details",
        description: "Some required fields need attention.",
        variant: "destructive",
      });
      // Find first error step
      if (
        nextErrors.fullName ||
        nextErrors.email ||
        nextErrors.phone ||
        nextErrors.alternativePhone
      ) {
        setCurrentStep("contact");
      } else if (nextErrors.addressLine || nextErrors.city || nextErrors.district) {
        setCurrentStep("address");
      }
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

    // Guest + bank transfer requires OTP verification (Fix #3).
    if (
      !isAuthenticated &&
      formData.paymentMethod === "manual_bank_transfer" &&
      !guestVerified
    ) {
      setOtpModal({ open: true, sending: false, sent: false, code: "", verifying: false });
      return;
    }

    // Structured address payload for persistence (Fix #4). Pickup mode skips it.
    const structuredAddress =
      formData.deliveryMode === "pickup"
        ? null
        : {
            label: formData.district || undefined,
            street: formData.addressLine,
            city: formData.city,
            postalCode: formData.postalCode,
            country: formData.country || "Sri Lanka",
          };

    setIsSubmitting(true);
    try {
      const response = await dispatch(
        createOrder({
          items: orderItems,
          checkoutMode: isBuyNow ? "buyNow" : "cart",
          shippingAddress,
          structuredAddress,
          contactNumber: formData.phone,
          alternativePhone: formData.alternativePhone || undefined,
          paymentMethod: formData.paymentMethod,
          notes: `Delivery Mode: ${formData.deliveryMode}\n${formData.notes}`,
          guestEmail: formData.email,
        })
      ).unwrap();

      const newOrderId = response?.orderId || response?.data?._id;
      const totalAmount = finalTotal;
      const manualPaymentSlug = response?.manualPayment?.slug || null;
      const manualPaymentRef = response?.manualPayment?.referenceNumber || null;
      const guestEmailReturned = response?.guestEmail || formData.email || null;

      persistBuyNowItem(null);
      clearPersisted();

      const isCardPayment = formData.paymentMethod === "card";

      // Card sample flow goes to the dedicated demo gateway page keyed on
      // orderId (no manualPayment slug yet — that record is created when the
      // customer submits the card form). Bank transfers keep their existing
      // slug-based manual-payment route.
      const target = isCardPayment
        ? `/shopping/card-payment/${encodeURIComponent(newOrderId)}`
        : manualPaymentSlug
          ? `/shopping/manual-payment/${encodeURIComponent(manualPaymentSlug)}`
          : "/shopping/manual-payment";

      navigate(
        guestEmailReturned
          ? `${target}?email=${encodeURIComponent(guestEmailReturned)}`
          : target,
        {
          state: {
            orderId: newOrderId,
            amount: totalAmount,
            referenceNumber: manualPaymentRef,
            slug: manualPaymentSlug,
          },
        }
      );
    } catch (err) {
      toast({
        title: "Checkout failed",
        description: typeof err === "string" ? err : err?.message || "Try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard", variant: "success" });
  };

  const getStepNumber = (id) => checkoutSteps.find(s => s.id === id).num;
  const currentStepNum = getStepNumber(currentStep);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e2e1] pb-32 md:pb-12">
      {/* Checkout header */}
      <header className="sticky top-0 z-40 border-b border-[#1c1b1b] bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-4 md:px-8">
          <Link to="/shopping/home" className="flex flex-col leading-none">
            <span className="se-serif text-2xl tracking-[0.18em] text-[#e5e2e1]">
              SAGA ELITE
            </span>
            <span className="se-label mt-1 text-[9px] tracking-[0.32em] text-[#99907c]">
              Rare Fit Forever
            </span>
          </Link>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4">
            {!isAuthenticated && (
              <span className="se-label text-[9px] tracking-[0.28em] text-[var(--accent)] hidden sm:inline-flex items-center gap-1">
                <Check size={12}/> Fast Guest Checkout
              </span>
            )}
            <div className="flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[#0d0d0d] px-4 py-2">
              <Lock className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span className="se-label text-[9px] tracking-[0.28em] text-[#d0c5af]">
                <span className="hidden sm:inline">Secure Checkout · </span>SSL
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-4 pt-8 md:px-8">
        
        {/* Progress stepper */}
        <nav aria-label="Checkout progress" className="mb-10 mt-2">
          <ol className="flex items-center justify-between gap-2 sm:gap-4 max-w-2xl mx-auto">
            {checkoutSteps.map((step, index) => {
              const isComplete = step.num < currentStepNum;
              const isActive = step.id === currentStep;
              const labelTone = isActive
                ? "text-[var(--accent)]"
                : isComplete
                ? "text-[#d0c5af]"
                : "text-[#574500]";
              const circleTone = isComplete
                ? "border-[var(--accent)] bg-[var(--accent)] text-[#0a0a0a]"
                : isActive
                ? "border-[var(--accent)] bg-transparent text-[var(--accent)] shadow-[0_0_24px_var(--accent-glow,rgba(242,202,80,0.45))]"
                : "border-[#4d4635] bg-transparent text-[#574500]";
              return (
                <React.Fragment key={step.id}>
                  <li className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => isComplete && proceedToStep(step.id)}
                      disabled={!isComplete && !isActive}
                      className={cn(
                        "relative flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                        circleTone,
                        isComplete && "cursor-pointer hover:bg-[var(--accent)] hover:text-[#0a0a0a]"
                      )}
                    >
                      {isComplete ? (
                        <Check className="h-4 w-4" strokeWidth={3} />
                      ) : (
                        step.num
                      )}
                    </button>
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
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--accent)] to-[#ffffff]"
                        initial={{ width: 0 }}
                        animate={{ width: step.num < currentStepNum ? "100%" : "0%" }}
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
            
            {/* Step 1: Contact Information */}
            <section className={cn("rounded-[2rem] border border-[#1c1b1b] bg-[#0d0d0d] p-7 md:p-9 transition-all duration-500", currentStep !== "contact" && "opacity-60 grayscale-[50%] pointer-events-none")}>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="se-label text-[10px] tracking-[0.32em] text-[#574500]">Step 01</p>
                  <h2 className="se-serif mt-2 text-2xl text-[#e5e2e1] md:text-3xl">Contact details</h2>
                </div>
                {currentStepNum > 1 && (
                  <button type="button" onClick={() => proceedToStep("contact")} className="text-[var(--accent)] text-sm underline se-body pointer-events-auto">Edit</button>
                )}
              </div>

              {currentStep === "contact" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Full name"
                    value={formData.fullName}
                    onChange={updateField("fullName")}
                    error={errors.fullName}
                    placeholder="Asanga Perera"
                    className="sm:col-span-2"
                  />
                  <div className="space-y-1">
                    <Field
                      label="Email address"
                      type="email"
                      value={formData.email}
                      onChange={handleEmailChange}
                      onBlur={() => !isAuthenticated && fetchGuestAddresses(formData.email)}
                      error={errors.email}
                      placeholder="you@example.com"
                    />
                    {errors.emailHint && <p className="text-[11px] text-[var(--accent)]">{errors.emailHint}</p>}
                  </div>
                  <Field
                    label="Phone number"
                    type="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    error={errors.phone}
                    placeholder="07X XXX XXXX"
                  />
                  <Field
                    label="Alternative phone number"
                    type="tel"
                    value={formData.alternativePhone}
                    onChange={handleAlternativePhoneChange}
                    error={errors.alternativePhone}
                    placeholder="07X XXX XXXX"
                    className="sm:col-span-2"
                  />
                  <div className="sm:col-span-2 mt-4">
                    <button type="button" onClick={() => proceedToStep("address")} className="w-full h-12 bg-white text-black font-semibold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors">
                      Continue to Delivery
                    </button>
                  </div>
                </motion.div>
              )}
            </section>

            {/* Step 2: Delivery Information */}
            <section className={cn("rounded-[2rem] border border-[#1c1b1b] bg-[#0d0d0d] p-7 md:p-9 transition-all duration-500", currentStep !== "address" && "opacity-60 grayscale-[50%] pointer-events-none")}>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="se-label text-[10px] tracking-[0.32em] text-[#574500]">Step 02</p>
                  <h2 className="se-serif mt-2 text-2xl text-[#e5e2e1] md:text-3xl">Delivery</h2>
                </div>
                {currentStepNum > 2 && (
                  <button type="button" onClick={() => proceedToStep("address")} className="text-[var(--accent)] text-sm underline se-body pointer-events-auto">Edit</button>
                )}
              </div>

              {currentStep === "address" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                  
                  {/* Delivery Method Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {DELIVERY_METHODS.map((method) => {
                      const Icon = method.icon;
                      const isActive = formData.deliveryMode === method.id;
                      const displayEta = isFastDistrict ? method.fastEta : method.eta;
                      return (
                        <div
                          key={method.id}
                          onClick={() => updateField("deliveryMode")(method.id)}
                          className={cn(
                            "relative cursor-pointer rounded-xl border p-4 transition-all duration-300",
                            isActive ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[#4d4635]/40 hover:border-[#99907c]"
                          )}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <Icon className={cn("h-5 w-5", isActive ? "text-[var(--accent)]" : "text-[#99907c]")} />
                            {isActive && <Check className="h-4 w-4 text-[var(--accent)]" />}
                          </div>
                          <p className="se-body text-sm font-semibold text-white">{method.label}</p>
                          <p className="se-label text-[9px] tracking-widest text-[#99907c] mt-1">{displayEta}</p>
                          <p className="se-mono text-sm text-white mt-2">
                            {method.price === 0 ? "FREE" : (method.id === "standard" && isFreeShippingQualify ? <span className="text-[var(--accent)]">FREE</span> : formatLKR(method.price))}
                          </p>
                        </div>
                      )
                    })}
                  </div>

                  {formData.deliveryMode !== "pickup" && savedAddresses.length > 0 && (
                    <div className="mb-6 rounded-xl border border-[var(--accent)]/30 bg-[#0a0a0a] p-4">
                      <p className="se-label text-[10px] tracking-[0.28em] text-[var(--accent)] mb-3">
                        Saved addresses
                      </p>
                      <div className="space-y-2">
                        {savedAddresses.map((addr, idx) => (
                          <button
                            key={addr._id || idx}
                            type="button"
                            onClick={() => {
                              applySavedAddress(addr);
                              setUseNewAddress(false);
                            }}
                            className={cn(
                              "block w-full text-left rounded-lg border px-3 py-2 transition",
                              !useNewAddress &&
                                formData.addressLine === addr.street &&
                                formData.postalCode === addr.postalCode
                                ? "border-[var(--accent)] bg-[var(--accent)]/10"
                                : "border-[#4d4635]/40 hover:border-[#99907c]"
                            )}
                          >
                            <p className="se-body text-sm text-white">{addr.street}</p>
                            <p className="text-xs text-[#99907c] mt-1">
                              {addr.city}, {addr.postalCode} · {addr.country}
                            </p>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setUseNewAddress(true);
                            setFormData((prev) => ({
                              ...prev,
                              addressLine: "",
                              city: "",
                              postalCode: "",
                            }));
                          }}
                          className={cn(
                            "block w-full text-left rounded-lg border px-3 py-2 transition text-sm",
                            useNewAddress
                              ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                              : "border-dashed border-[#4d4635]/40 text-[#99907c] hover:border-[#99907c]"
                          )}
                        >
                          + Use a new address
                        </button>
                      </div>
                    </div>
                  )}

                  {formData.deliveryMode !== "pickup" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-5 sm:grid-cols-2 mb-6">
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
                    </motion.div>
                  )}

                  <button type="button" onClick={() => proceedToStep("payment")} className="w-full h-12 bg-white text-black font-semibold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors">
                    Continue to Payment
                  </button>
                </motion.div>
              )}
            </section>

            {/* Step 3: Payment Information */}
            <section className={cn("rounded-[2rem] border border-[#1c1b1b] bg-[#0d0d0d] p-7 md:p-9 transition-all duration-500", currentStep !== "payment" && "opacity-60 grayscale-[50%] pointer-events-none")}>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="se-label text-[10px] tracking-[0.32em] text-[#574500]">Step 03</p>
                  <h2 className="se-serif mt-2 text-2xl text-[#e5e2e1] md:text-3xl">Payment</h2>
                </div>
              </div>

              {currentStep === "payment" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                  <div className="grid gap-4 sm:grid-cols-2 mb-8">
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
                              ? "border-[var(--accent)] bg-[#0a0a0a] shadow-[0_0_24px_var(--accent-glow,rgba(242,202,80,0.18))]"
                              : "border-[#4d4635]/40 bg-[#0a0a0a] hover:border-[#99907c]"
                          )}
                        >
                          <div className="flex w-full items-start justify-between">
                            <div className={cn("flex h-10 w-10 items-center justify-center rounded-full border transition", isSelected ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-[#4d4635]/40 bg-[#131313]")}>
                              <Icon className={cn("h-5 w-5", isSelected ? "text-[var(--accent)]" : "text-[#99907c]")} />
                            </div>
                            <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border transition", isSelected ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[#4d4635]/60")}>
                              {isSelected && <Check className="h-3 w-3 text-[#0a0a0a]" strokeWidth={3} />}
                            </span>
                          </div>
                          <div>
                            <p className="se-body text-sm font-medium text-[#e5e2e1]">{method.label}</p>
                            <p className="se-label mt-1 text-[9px] uppercase tracking-[0.28em] text-[#574500]">{method.sublabel}</p>
                            <p className="se-body mt-2 text-xs text-[#99907c]">{method.description}</p>
                          </div>
                          {method.badge && (
                            <span className={cn("se-label rounded-full border px-3 py-1 text-[9px] tracking-[0.28em]", method.id === "card" ? "border-amber-500/30 bg-amber-500/5 text-amber-300" : "border-[#4d4635]/40 bg-[#131313] text-[#99907c]")}>
                              {method.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {formData.paymentMethod === "manual_bank_transfer" && (
                    <div className="mt-6 rounded-2xl border border-[#4d4635]/40 bg-[#0a0a0a] p-6 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent)]"></div>
                      <div className="mb-5 flex items-center justify-between pl-3">
                        <span className="se-label text-[10px] tracking-[0.32em] text-[var(--accent)]">Bank details</span>
                        <span className="se-label text-[9px] tracking-[0.28em] text-[#574500]">Reference generated next step</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-3">
                        <div>
                          <p className="text-[#99907c] text-xs uppercase tracking-widest mb-1">Bank</p>
                          <p className="text-white text-sm">{displayBankDetails.bankName} - {displayBankDetails.branch}</p>
                        </div>
                        <div>
                          <p className="text-[#99907c] text-xs uppercase tracking-widest mb-1">Account Name</p>
                          <p className="text-white text-sm">{displayBankDetails.accountName}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-[#99907c] text-xs uppercase tracking-widest mb-1">Account Number</p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="se-instrument text-2xl text-[var(--accent)] tracking-widest">{displayBankDetails.accountNumber}</p>
                            <button type="button" onClick={() => copyToClipboard(displayBankDetails.accountNumber)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#99907c] hover:text-white" title="Copy Account Number">
                              <Copy size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.paymentMethod === "card" && (
                    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-5">
                      <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
                      <div>
                        <p className="se-body text-sm text-[#f0e8c8]">You'll be taken to our demo card gateway after placing the order.</p>
                        <p className="se-body mt-1 text-xs text-[#99907c]">No real charge is made — our team will manually verify the sample transaction. The PayHere gateway activates once hosting is configured.</p>
                      </div>
                    </div>
                  )}

                  <label className="mt-8 flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={formData.termsAccepted}
                      onChange={updateField("termsAccepted")}
                      className="mt-0.5 h-4 w-4 cursor-pointer rounded border border-[#4d4635] bg-[#0a0a0a] accent-[var(--accent)]"
                    />
                    <span className="se-body text-sm text-[#d0c5af]">
                      I have read and agree to the <Link to="/terms" className="text-[var(--accent)] underline underline-offset-4">Terms & Conditions</Link>.
                    </span>
                  </label>
                  {errors.termsAccepted && <p className="mt-2 text-xs text-rose-400">{errors.termsAccepted}</p>}

                  {/* Desktop Submit Button (Mobile is fixed at bottom) */}
                  <div className="hidden lg:block mt-10">
                    <button
                      type="submit"
                      disabled={checkoutItems.length === 0 || isSubmitting}
                      className="w-full h-14 bg-[var(--accent)] text-black font-bold uppercase tracking-[0.2em] text-sm hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? <><Loader2 className="animate-spin h-5 w-5"/> Processing...</> : (
                        <>Complete Order <span className="opacity-50">|</span> {formatLKR(finalTotal)}</>
                      )}
                    </button>
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div className="flex flex-col items-center gap-2 text-[#99907c]"><Lock size={18}/> <span className="text-[10px] uppercase tracking-widest">Secure Checkout</span></div>
                      <div className="flex flex-col items-center gap-2 text-[#99907c]"><Check size={18}/> <span className="text-[10px] uppercase tracking-widest">Quality Guarantee</span></div>
                      <div className="flex flex-col items-center gap-2 text-[#99907c]"><ShieldCheck size={18}/> <span className="text-[10px] uppercase tracking-widest">Easy Exchange</span></div>
                      <div className="flex flex-col items-center gap-2 text-[#99907c]"><Gift size={18}/> <span className="text-[10px] uppercase tracking-widest">Premium Packing</span></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </section>
          </div>

          {/* Right column — sticky order summary */}
          <aside className="lg:col-span-5">
            <div className="space-y-5 lg:sticky lg:top-28">
              <div className="rounded-[2rem] border border-[var(--accent)]/30 bg-gradient-to-b from-[#131313] to-[#0d0d0d] p-7 shadow-[0_0_60px_var(--accent-glow,rgba(242,202,80,0.08))]">
                
                {/* Emotional Header */}
                <div className="mb-6 text-center border-b border-[#1c1b1b] pb-6">
                  <Clock className="w-5 h-5 mx-auto text-[var(--accent)] mb-3" />
                  <p className="text-white se-serif text-lg">Your rare fit is almost yours</p>
                  <p className="text-[#99907c] text-xs mt-1">Reserved for 15:00 minutes</p>
                </div>

                {checkoutItems.length === 0 ? (
                  <p className="se-body py-6 text-center text-sm text-[#574500]">Your bag is empty.</p>
                ) : (
                  <ul className="mb-6 space-y-6">
                    {checkoutItems.map((item) => (
                      <li key={item.id} className="flex items-start gap-4">
                        {/* Mini Gallery */}
                        <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-[#1c1b1b] border border-[#4d4635]">
                          {item.product?.images?.[0]?.url ? (
                            <img src={item.product.images[0].url} alt={item.product?.name || ""} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="se-body truncate text-base text-[#e5e2e1]">{item.product?.name}</p>
                          
                          {/* Variant Preview: Color Circle + Size */}
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            {item.variant?.color && (
                              <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: resolveColor(item.variant.color) }}/>
                                <span className="text-xs text-[#99907c]">{item.variant.color}</span>
                              </div>
                            )}
                            {item.variant?.size && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-[#99907c] bg-white/5 px-2 py-0.5 rounded border border-white/10">{item.variant.size}</span>
                              </div>
                            )}
                          </div>

                          {/* Editable Cart Controls */}
                          {!isBuyNow && (
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-3 border border-[#4d4635] rounded-full px-2 py-0.5">
                                <button type="button" onClick={() => handleQuantity(item, item.quantity - 1)} className="text-[#99907c] hover:text-white"><Minus size={12}/></button>
                                <span className="text-xs text-white w-4 text-center">{item.quantity}</span>
                                <button type="button" onClick={() => handleQuantity(item, item.quantity + 1)} className="text-[#99907c] hover:text-white"><Plus size={12}/></button>
                              </div>
                              <button type="button" onClick={() => handleRemove(item.id)} className="text-rose-500/70 hover:text-rose-500 text-xs flex items-center gap-1"><Trash2 size={12}/> Remove</button>
                            </div>
                          )}
                          {(item.variant?.stock > 0 && item.variant?.stock <= 5) && (
                            <p className="text-rose-400 text-[10px] mt-2 uppercase tracking-widest">Only {item.variant.stock} left in size</p>
                          )}
                        </div>
                        <span className="se-instrument shrink-0 text-base text-[#e5e2e1] pt-1">
                          {formatLKR(item.unitPrice * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Shipping Progress */}
                {!isFreeShippingQualify && (
                  <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333] mb-6">
                    <p className="text-xs text-white text-center mb-2">You are <span className="text-[var(--accent)]">{formatLKR(amountToFreeShipping)}</span> away from FREE delivery</p>
                    <div className="w-full bg-[#333] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[var(--accent)] h-full rounded-full transition-all duration-500" style={{ width: `${shippingProgress}%` }}></div>
                    </div>
                  </div>
                )}
                {isFreeShippingQualify && (
                  <div className="bg-[var(--accent)]/10 border border-[var(--accent)] p-3 rounded-xl mb-6 text-center">
                    <p className="text-xs text-[var(--accent)] uppercase tracking-widest font-semibold flex justify-center items-center gap-2"><Package size={14}/> Your order qualifies for Premium Packaging</p>
                  </div>
                )}

                {/* Coupon Section */}
                <div className="border-t border-[#1c1b1b] py-4">
                  <button type="button" onClick={() => setCouponExpanded(!couponExpanded)} className="flex items-center justify-between w-full text-sm text-[#99907c] hover:text-white transition-colors">
                    <span className="flex items-center gap-2"><Gift size={16}/> Gift Card / Promo Code</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", couponExpanded && "rotate-180")}/>
                  </button>
                  <AnimatePresence>
                    {couponExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="flex gap-2 mt-4">
                          <input type="text" placeholder="Enter code" className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-3 text-sm text-white outline-none focus:border-[var(--accent)]" />
                          <button type="button" className="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors">Apply</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-3 border-t border-[#1c1b1b] pt-5">
                  <div className="flex justify-between se-body text-sm text-[#d0c5af]">
                    <span>Subtotal</span>
                    <span>{formatLKR(checkoutTotal)}</span>
                  </div>
                  <div className="flex justify-between items-start se-body text-sm text-[#99907c]">
                    <span className="inline-flex items-center gap-2">
                      <Truck className="h-3.5 w-3.5" />
                      Delivery
                    </span>
                    <div className="text-right">
                      {shippingFee === 0 ? (
                        <span className="text-[var(--accent)]">Complimentary</span>
                      ) : (
                        <span>{formatLKR(shippingFee)}</span>
                      )}
                      {formData.deliveryMode !== 'pickup' && (
                        <p className="text-[10px] mt-1 text-[#574500]">
                          {isFastDistrict ? selectedDelivery.fastEta : selectedDelivery.eta}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-end justify-between border-t border-[#1c1b1b] pt-5">
                  <span className="se-label text-[10px] tracking-[0.32em] text-[#99907c] pb-1">Total</span>
                  <span className="se-instrument text-4xl text-[var(--accent)] leading-none">{formatLKR(finalTotal)}</span>
                </div>

                {/* Guest gift notice (Fix #7) */}
                {!isAuthenticated && (
                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4">
                    <Gift className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                    <p className="text-xs text-[#d0c5af] leading-relaxed">
                      <Link to="/auth/register" className="text-[var(--accent)] underline">
                        Register
                      </Link>{" "}
                      to be eligible for surprise gifts with your order.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </aside>
        </form>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-[#1c1b1b] lg:hidden z-50">
        <div className="flex items-center justify-between mb-3 px-2">
          <span className="text-[#99907c] text-xs">Total</span>
          <span className="se-instrument text-2xl text-[var(--accent)]">{formatLKR(finalTotal)}</span>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={checkoutItems.length === 0 || isSubmitting || currentStep !== "payment"}
          className="w-full h-14 bg-[var(--accent)] text-black font-bold uppercase tracking-[0.2em] text-sm hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 rounded-xl shadow-[0_0_20px_var(--accent-glow,rgba(242,202,80,0.2))]"
        >
          {isSubmitting ? <><Loader2 className="animate-spin h-5 w-5"/> Processing...</> : "Complete Order"}
        </button>
        {currentStep !== "payment" && (
           <p className="text-center text-[10px] text-rose-400 mt-2">Please complete all steps above first.</p>
        )}
      </div>

      {/* OTP modal — guest manual bank transfer (Fix #3) */}
      <AnimatePresence>
        {otpModal.open && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOtpModal((m) => ({ ...m, open: false }))}
          >
            <motion.div
              className="relative w-full max-w-md rounded-2xl border border-[var(--accent)]/30 bg-[#0d0d0d] p-7 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="se-label text-[10px] tracking-[0.32em] text-[var(--accent)]">
                Verify your identity
              </p>
              <h3 className="se-serif text-2xl text-white mt-2">
                Confirm it's really you
              </h3>
              <p className="text-sm text-[#99907c] mt-3 leading-relaxed">
                Bank-transfer orders need OTP verification. We'll send a 4-digit code to{" "}
                <span className="text-white">{formData.email}</span>
                {formData.phone ? ` and your WhatsApp.` : "."}
              </p>

              {!otpModal.sent ? (
                <button
                  type="button"
                  disabled={otpModal.sending}
                  onClick={sendGuestOtp}
                  className="mt-6 w-full h-12 bg-[var(--accent)] text-black font-bold uppercase tracking-[0.2em] text-sm rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {otpModal.sending ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" /> Sending…
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              ) : (
                <div className="mt-6 space-y-4">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    value={otpModal.code}
                    onChange={(e) =>
                      setOtpModal((m) => ({
                        ...m,
                        code: e.target.value.replace(/\D/g, "").slice(0, 4),
                      }))
                    }
                    placeholder="0000"
                    className="w-full h-14 text-center text-2xl tracking-[0.5em] bg-[#0a0a0a] border border-[var(--accent)]/40 rounded-lg text-white outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    type="button"
                    disabled={otpModal.verifying}
                    onClick={verifyGuestOtp}
                    className="w-full h-12 bg-[var(--accent)] text-black font-bold uppercase tracking-[0.2em] text-sm rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {otpModal.verifying ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5" /> Verifying…
                      </>
                    ) : (
                      "Verify & continue"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={sendGuestOtp}
                    disabled={otpModal.sending}
                    className="w-full text-xs text-[#99907c] hover:text-white transition"
                  >
                    Resend code
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setOtpModal((m) => ({ ...m, open: false }))}
                className="mt-4 w-full text-xs text-[#574500] hover:text-[#99907c] transition"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Checkout;
