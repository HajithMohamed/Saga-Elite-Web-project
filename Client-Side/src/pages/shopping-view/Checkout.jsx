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
  const [couponInput, setCouponInput] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [rewardSuggestions, setRewardSuggestions] = useState([]);

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

  // Always use Saga Elite gold as the checkout accent — never override with variant colour
  const CHECKOUT_GOLD = "#f2ca50";

  // Delivery Pricing Logic
  const isFastDistrict = FAST_DISTRICTS.includes(formData.district);
  const selectedDelivery = DELIVERY_METHODS.find(m => m.id === formData.deliveryMode) || DELIVERY_METHODS[0];
  const isFreeShippingQualify = checkoutTotal >= FREE_SHIPPING_THRESHOLD;
  
  const shippingFee = formData.deliveryMode === "pickup" 
    ? 0 
    : formData.deliveryMode === "standard" && isFreeShippingQualify 
      ? 0 
      : selectedDelivery.price;

  const couponDiscount = Math.min(
    checkoutTotal,
    Math.max(0, Number(appliedCoupon?.discount || 0))
  );
  const finalTotal = Math.max(0, checkoutTotal - couponDiscount) + shippingFee;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - checkoutTotal);
  const shippingProgress = Math.min(100, (checkoutTotal / FREE_SHIPPING_THRESHOLD) * 100);

  const displayBankDetails = bankDetails || DEFAULT_MANUAL_BANK_DETAILS;
  const whatsAppLink = displayBankDetails.whatsapp
    ? `https://wa.me/${displayBankDetails.whatsapp.replace(/\D/g, "")}`
    : "#";

  const checkoutProductIds = useMemo(
    () =>
      checkoutItems
        .map((item) => item.product?.id || item.product?._id)
        .filter(Boolean),
    [checkoutItems]
  );
  const checkoutProductKey = checkoutProductIds.join("|");

  useEffect(() => {
    setAppliedCoupon(null);
  }, [checkoutTotal, checkoutProductKey]);

  useEffect(() => {
    if (!isAuthenticated) {
      setRewardSuggestions([]);
      return;
    }

    let cancelled = false;
    axiosInstance
      .get("/coupons/my-rewards")
      .then((res) => {
        if (cancelled) return;
        const rewards = res.data?.data?.rewards || [];
        setRewardSuggestions(
          rewards.filter((reward) => reward.status === "available").slice(0, 3)
        );
      })
      .catch(() => {
        if (!cancelled) setRewardSuggestions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const applyCouponCode = async (codeToApply = couponInput) => {
    const code = String(codeToApply || "").trim().toUpperCase();
    if (!code) {
      toast({ title: "Enter a reward code", variant: "destructive" });
      return;
    }
    if (checkoutTotal <= 0) {
      toast({ title: "Add items before applying a reward", variant: "destructive" });
      return;
    }

    setCouponApplying(true);
    try {
      const res = await axiosInstance.post("/coupons/validate", {
        code,
        subtotal: checkoutTotal,
        productIds: checkoutProductIds,
      });
      const data = res.data?.data;
      setAppliedCoupon(data);
      setCouponInput(data?.code || code);
      setFormData((prev) => ({ ...prev, couponCode: data?.code || code }));
      toast({
        title: "Reward applied",
        description: `You saved ${formatLKR(data?.discount || 0)}.`,
        variant: "success",
      });
    } catch (err) {
      setAppliedCoupon(null);
      toast({
        title: "Reward not applied",
        description: err?.response?.data?.message || err?.message || "Check the code and try again.",
        variant: "destructive",
      });
    } finally {
      setCouponApplying(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setFormData((prev) => ({ ...prev, couponCode: "" }));
  };

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
          shippingFee,
          notes: `Delivery Mode: ${formData.deliveryMode}\n${formData.notes}`,
          guestEmail: formData.email,
          couponCode: appliedCoupon?.code || undefined,
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
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e2e1] pb-36 md:pb-16">
      {/* ═══════════ STICKY HEADER ═══════════ */}
      <header className="sticky top-0 z-40 border-b border-[#1c1b1b] bg-[#0a0a0a]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 md:px-8">
          <Link to="/shopping/home" className="flex flex-col leading-none group">
            <span className="font-serif text-xl md:text-2xl tracking-[0.18em] text-[#e5e2e1] group-hover:text-[#f2ca50] transition-colors duration-300">
              SAGA ELITE
            </span>
            <span className="text-[8px] uppercase tracking-[0.32em] text-[#99907c] mt-0.5">Rare Fit Forever</span>
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-[#f2ca50]/30 bg-[#f2ca50]/5 px-4 py-2">
            <Lock className="h-3.5 w-3.5 text-[#f2ca50]" />
            <span className="text-[10px] uppercase tracking-widest text-[#f2ca50] font-bold hidden sm:inline">Secure Checkout ·</span>
            <span className="text-[10px] uppercase tracking-widest text-[#f2ca50] font-bold">SSL</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 md:px-8 pt-8">

        {/* ═══════════ BREADCRUMB ═══════════ */}
        <nav className="mb-8 flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#99907c]">
          <Link to="/" className="hover:text-[#f2ca50] transition-colors">Home</Link>
          <span className="text-[#2a2a2a]">›</span>
          <Link to="/shopping/cart" className="hover:text-[#f2ca50] transition-colors">Shopping Cart</Link>
          <span className="text-[#2a2a2a]">›</span>
          <span className="text-[#f2ca50] font-bold">Secure Checkout</span>
        </nav>

        {/* ═══════════ PROGRESS STEPPER ═══════════ */}
        <div className="mb-10 overflow-x-auto pb-2">
          <div className="flex items-center min-w-max">
            {checkoutSteps.map((step, idx) => {
              const isActive = currentStepNum === step.num;
              const isPast   = currentStepNum >  step.num;
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-2 min-w-[80px]">
                    <div className={[
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300",
                      isPast   ? "bg-[#f2ca50] border-[#f2ca50] text-black"           :
                      isActive ? "bg-transparent border-[#f2ca50] text-[#f2ca50]"    :
                                 "bg-transparent border-[#2a2a2a] text-[#4d4635]"
                    ].join(" ")}>
                      {isPast ? <Check size={14} /> : step.num}
                    </div>
                    <span className={[
                      "text-[9px] uppercase tracking-widest font-bold",
                      isActive ? "text-[#f2ca50]" : isPast ? "text-[#e5e2e1]" : "text-[#4d4635]"
                    ].join(" ")}>
                      {step.label}
                    </span>
                  </div>
                  {idx < checkoutSteps.length - 1 && (
                    <div
                      className={[
                        "h-[2px] mx-3 rounded-full transition-colors duration-500",
                        currentStepNum > step.num ? "bg-[#f2ca50]" : "bg-[#1c1b1b]"
                      ].join(" ")}
                      style={{ minWidth: 48, flex: 1 }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ═══════════ MOBILE COLLAPSIBLE SUMMARY ═══════════ */}
        <div className="lg:hidden mb-8">
          <details className="group bg-[#131313] border border-[#1c1b1b] rounded-2xl overflow-hidden">
            <summary className="flex items-center justify-between p-5 cursor-pointer list-none select-none">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-widest text-[#e5e2e1]">Order Summary</span>
                <span className="text-[10px] text-[#99907c] font-bold">({itemCount} item{itemCount !== 1 ? "s" : ""})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#f2ca50]">{formatLKR(finalTotal)}</span>
                <ChevronDown className="w-4 h-4 text-[#99907c] transition-transform duration-300 group-open:rotate-180" />
              </div>
            </summary>
            <div className="p-5 border-t border-[#1c1b1b] bg-[#0a0a0a] flex flex-col gap-4">
              {checkoutItems.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-16 h-16 bg-[#131313] rounded-xl border border-[#1c1b1b] overflow-hidden flex-shrink-0">
                    <img src={item.product?.image} alt={item.product?.name} className="w-full h-full object-contain p-1" />
                    <span className="absolute -top-1.5 -right-1.5 bg-[#f2ca50] text-black w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black">{item.quantity}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center gap-0.5 min-w-0">
                    <h4 className="text-xs font-bold text-[#e5e2e1] line-clamp-2">{item.product?.name}</h4>
                    <div className="text-[10px] text-[#99907c] uppercase tracking-wider">
                      {[item.variant?.size, item.variant?.color].filter(Boolean).join(" · ")}
                    </div>
                    <div className="text-xs font-bold text-[#f2ca50]">{formatLKR(item.unitPrice * item.quantity)}</div>
                  </div>
                </div>
              ))}
              <div className="border-t border-[#1c1b1b] pt-4 flex flex-col gap-2">
                <div className="flex justify-between text-sm"><span className="text-[#99907c]">Subtotal</span><span className="text-[#e5e2e1] font-bold">{formatLKR(checkoutTotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[#99907c]">Shipping</span><span className="text-[#e5e2e1] font-bold">{shippingFee === 0 ? "FREE" : formatLKR(shippingFee)}</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-sm"><span className="text-green-400">Discount</span><span className="text-green-400 font-bold">-{formatLKR(couponDiscount)}</span></div>}
                <div className="flex justify-between text-base pt-2 border-t border-[#f2ca50]/20"><span className="font-bold text-[#e5e2e1]">Total</span><span className="font-bold text-[#f2ca50]">{formatLKR(finalTotal)}</span></div>
              </div>
            </div>
          </details>
        </div>

        {/* ═══════════ MAIN GRID ═══════════ */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">

          {/* LEFT 65% */}
          <div className="w-full lg:w-[65%] flex flex-col gap-8">
            <AnimatePresence mode="wait">

              {/* ── STEP 1: CONTACT ── */}
              {currentStep === "contact" && (
                <motion.div key="contact"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}
                  className="flex flex-col gap-8"
                >
                  {/* Sign-in nudge */}
                  {!isAuthenticated && (
                    <div className="p-5 rounded-2xl border border-[#4d4635]/60 bg-[#131313] flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-[#e5e2e1] text-sm">Already have an account?</h4>
                        <p className="text-[11px] text-[#99907c] mt-0.5">Sign in for faster checkout, saved addresses & exclusive rewards.</p>
                      </div>
                      <Link to="/auth/login" className="whitespace-nowrap px-6 py-3 rounded-xl border border-[#f2ca50] text-[#f2ca50] font-bold uppercase tracking-widest text-[10px] hover:bg-[#f2ca50]/10 transition-colors flex-shrink-0">
                        Sign In
                      </Link>
                    </div>
                  )}

                  <section className="bg-[#131313] border border-[#1c1b1b] rounded-2xl p-6 md:p-8 flex flex-col gap-6">
                    <h2 className="text-xl font-bold text-[#e5e2e1]">Contact Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-[#99907c]">Full Name *</label>
                        <input type="text" value={formData.fullName}
                          onChange={(e) => updateField("fullName")(e)}
                          placeholder="Your full name"
                          className={["h-14 rounded-xl bg-[#0a0a0a] border px-4 text-[#e5e2e1] placeholder-[#4d4635] outline-none transition-colors", errors.fullName ? "border-[#ffb4ab]" : "border-[#1c1b1b] focus:border-[#f2ca50]"].join(" ")}
                        />
                        {errors.fullName && <span className="text-[10px] text-[#ffb4ab]">{errors.fullName}</span>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-[#99907c]">Email Address *</label>
                        <input type="email" value={formData.email}
                          onChange={handleEmailChange} readOnly={isAuthenticated}
                          placeholder="you@example.com"
                          className={["h-14 rounded-xl bg-[#0a0a0a] border px-4 text-[#e5e2e1] placeholder-[#4d4635] outline-none transition-colors", errors.email ? "border-[#ffb4ab]" : "border-[#1c1b1b] focus:border-[#f2ca50]", isAuthenticated ? "opacity-60 cursor-not-allowed" : ""].join(" ")}
                        />
                        {errors.email && <span className="text-[10px] text-[#ffb4ab]">{errors.email}</span>}
                        {errors.emailHint && <span className="text-[10px] text-[#f2ca50]">💡 {errors.emailHint}</span>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-[#99907c]">Phone Number *</label>
                        <input type="tel" value={formData.phone}
                          onChange={handlePhoneChange} placeholder="07X XXX XXXX"
                          className={["h-14 rounded-xl bg-[#0a0a0a] border px-4 text-[#e5e2e1] placeholder-[#4d4635] outline-none transition-colors", errors.phone ? "border-[#ffb4ab]" : "border-[#1c1b1b] focus:border-[#f2ca50]"].join(" ")}
                        />
                        {errors.phone && <span className="text-[10px] text-[#ffb4ab]">{errors.phone}</span>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-[#99907c]">
                          Alt. Phone <span className="normal-case font-normal text-[#4d4635]">(Optional)</span>
                        </label>
                        <input type="tel" value={formData.alternativePhone}
                          onChange={handleAlternativePhoneChange} placeholder="07X XXX XXXX"
                          className={["h-14 rounded-xl bg-[#0a0a0a] border px-4 text-[#e5e2e1] placeholder-[#4d4635] outline-none transition-colors", errors.alternativePhone ? "border-[#ffb4ab]" : "border-[#1c1b1b] focus:border-[#f2ca50]"].join(" ")}
                        />
                        {errors.alternativePhone && <span className="text-[10px] text-[#ffb4ab]">{errors.alternativePhone}</span>}
                      </div>
                    </div>
                  </section>

                  <section className="bg-[#131313] border border-[#1c1b1b] rounded-2xl p-6 md:p-8 flex flex-col gap-6">
                    <h2 className="text-xl font-bold text-[#e5e2e1]">Delivery Address</h2>

                    {savedAddresses.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {savedAddresses.map((addr, i) => (
                          <div key={i}
                            onClick={() => { applySavedAddress(addr); setUseNewAddress(false); }}
                            className={["p-4 rounded-xl border cursor-pointer transition-all", !useNewAddress ? "border-[#f2ca50] bg-[#f2ca50]/5" : "border-[#1c1b1b] bg-[#0a0a0a] hover:border-[#4d4635]"].join(" ")}
                          >
                            <div className="text-xs font-bold text-[#e5e2e1] mb-1">{addr.label || "Saved Address"}</div>
                            <div className="text-[10px] text-[#99907c]">{addr.street}, {addr.city}</div>
                          </div>
                        ))}
                        <div onClick={() => setUseNewAddress(true)}
                          className={["p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-center", useNewAddress ? "border-[#f2ca50] text-[#f2ca50]" : "border-[#1c1b1b] text-[#4d4635] hover:border-[#4d4635]"].join(" ")}
                        >
                          <span className="text-xs font-bold uppercase tracking-widest">+ New Address</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-[#99907c]">Street Address *</label>
                        <input type="text" value={formData.addressLine}
                          onChange={(e) => updateField("addressLine")(e)} placeholder="No. 12, Main Street"
                          className={["h-14 rounded-xl bg-[#0a0a0a] border px-4 text-[#e5e2e1] placeholder-[#4d4635] outline-none transition-colors", errors.addressLine ? "border-[#ffb4ab]" : "border-[#1c1b1b] focus:border-[#f2ca50]"].join(" ")}
                        />
                        {errors.addressLine && <span className="text-[10px] text-[#ffb4ab]">{errors.addressLine}</span>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-[#99907c]">City *</label>
                        <input type="text" value={formData.city}
                          onChange={(e) => updateField("city")(e)} placeholder="Colombo"
                          className={["h-14 rounded-xl bg-[#0a0a0a] border px-4 text-[#e5e2e1] placeholder-[#4d4635] outline-none transition-colors", errors.city ? "border-[#ffb4ab]" : "border-[#1c1b1b] focus:border-[#f2ca50]"].join(" ")}
                        />
                        {errors.city && <span className="text-[10px] text-[#ffb4ab]">{errors.city}</span>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-[#99907c]">District *</label>
                        <select value={formData.district}
                          onChange={(e) => updateField("district")(e)}
                          className={["h-14 rounded-xl bg-[#0a0a0a] border px-4 text-[#e5e2e1] outline-none transition-colors appearance-none cursor-pointer", errors.district ? "border-[#ffb4ab]" : "border-[#1c1b1b] focus:border-[#f2ca50]"].join(" ")}
                        >
                          <option value="">Select District</option>
                          {SRI_LANKA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {errors.district && <span className="text-[10px] text-[#ffb4ab]">{errors.district}</span>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-[#99907c]">Postal Code *</label>
                        <input type="text" value={formData.postalCode}
                          onChange={(e) => updateField("postalCode")(e)} placeholder="10100"
                          className={["h-14 rounded-xl bg-[#0a0a0a] border px-4 text-[#e5e2e1] placeholder-[#4d4635] outline-none transition-colors", errors.postalCode ? "border-[#ffb4ab]" : "border-[#1c1b1b] focus:border-[#f2ca50]"].join(" ")}
                        />
                        {errors.postalCode && <span className="text-[10px] text-[#ffb4ab]">{errors.postalCode}</span>}
                      </div>
                    </div>
                  </section>

                  <div className="flex justify-end">
                    <button onClick={() => proceedToStep("address")}
                      className="bg-[#f2ca50] text-black h-14 px-10 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:brightness-110 transition-all"
                    >
                      Continue to Shipping
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: SHIPPING ── */}
              {currentStep === "address" && (
                <motion.div key="address"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}
                  className="flex flex-col gap-8"
                >
                  <section className="bg-[#131313] border border-[#1c1b1b] rounded-2xl p-6 md:p-8 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-[#e5e2e1]">Shipping Method</h2>
                      <button onClick={() => setCurrentStep("contact")} className="text-[10px] uppercase tracking-widest font-bold text-[#99907c] hover:text-[#f2ca50] transition-colors">
                        ← Edit Contact
                      </button>
                    </div>

                    {!isFreeShippingQualify && formData.deliveryMode === "standard" && (
                      <div className="p-4 rounded-xl border border-[#4d4635]/40 bg-[#0a0a0a] flex flex-col gap-2">
                        <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                          <span className="text-[#99907c]">Add {formatLKR(amountToFreeShipping)} more for free shipping</span>
                          <span className="text-[#f2ca50]">{Math.round(shippingProgress)}%</span>
                        </div>
                        <div className="h-1.5 bg-[#1c1b1b] rounded-full overflow-hidden">
                          <div className="h-full bg-[#f2ca50] rounded-full transition-all duration-700" style={{ width: `${shippingProgress}%` }} />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      {DELIVERY_METHODS.map((method) => {
                        const isSelected = formData.deliveryMode === method.id;
                        const Icon = method.icon;
                        const eta = isFastDistrict ? method.fastEta : method.eta;
                        const fee = method.id === "pickup" ? 0 : (method.id === "standard" && isFreeShippingQualify) ? 0 : method.price;
                        return (
                          <div key={method.id}
                            onClick={() => updateField("deliveryMode")(method.id)}
                            className={["relative flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-300", isSelected ? "border-[#f2ca50] bg-[#f2ca50]/5" : "border-[#1c1b1b] bg-[#0a0a0a] hover:border-[#4d4635]"].join(" ")}
                          >
                            <div className={["mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors", isSelected ? "border-[#f2ca50]" : "border-[#4d4635]"].join(" ")}>
                              {isSelected && <div className="w-2 h-2 bg-[#f2ca50] rounded-full" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className={["font-bold text-sm", isSelected ? "text-[#f2ca50]" : "text-[#e5e2e1]"].join(" ")}>{method.label}</h4>
                                <span className="font-bold text-[#e5e2e1] text-sm flex-shrink-0">
                                  {fee === 0 ? <span className="text-green-400">FREE</span> : formatLKR(fee)}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#99907c] mt-1">{method.desc}</p>
                              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/40 border border-[#2a2a2a]">
                                <Clock size={10} className="text-[#d0c5af]" />
                                <span className="text-[9px] uppercase tracking-widest text-[#d0c5af] font-bold">{eta}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <div className="flex items-center justify-between">
                    <button onClick={() => setCurrentStep("contact")} className="text-[10px] uppercase tracking-widest font-bold text-[#99907c] hover:text-[#f2ca50] transition-colors">← Back</button>
                    <button onClick={() => proceedToStep("payment")}
                      className="bg-[#f2ca50] text-black h-14 px-10 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:brightness-110 transition-all"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3: PAYMENT ── */}
              {currentStep === "payment" && (
                <motion.div key="payment"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}
                  className="flex flex-col gap-8"
                >
                  <section className="bg-[#131313] border border-[#1c1b1b] rounded-2xl p-6 md:p-8 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-[#e5e2e1]">Payment Method</h2>
                      <button onClick={() => setCurrentStep("address")} className="text-[10px] uppercase tracking-widest font-bold text-[#99907c] hover:text-[#f2ca50] transition-colors">
                        ← Edit Shipping
                      </button>
                    </div>
                    <p className="text-[11px] text-[#99907c] -mt-2">All transactions are encrypted and 100% secure.</p>

                    <div className="flex flex-col gap-3">
                      {PAYMENT_METHODS.map((method) => {
                        const isSelected = formData.paymentMethod === method.id;
                        const Icon = method.icon;
                        return (
                          <div key={method.id} className={["border rounded-2xl overflow-hidden transition-all duration-300", isSelected ? "border-[#f2ca50]" : "border-[#1c1b1b]"].join(" ")}>
                            <div
                              onClick={() => updateField("paymentMethod")(method.id)}
                              className={["flex items-center gap-4 p-5 cursor-pointer transition-colors", isSelected ? "bg-[#f2ca50]/5" : "bg-[#0a0a0a] hover:bg-[#131313]"].join(" ")}
                            >
                              <div className={["w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors", isSelected ? "border-[#f2ca50]" : "border-[#4d4635]"].join(" ")}>
                                {isSelected && <div className="w-2 h-2 bg-[#f2ca50] rounded-full" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className={["font-bold text-sm", isSelected ? "text-[#f2ca50]" : "text-[#e5e2e1]"].join(" ")}>{method.label}</h4>
                                  {method.badge && (
                                    <span className="text-[8px] uppercase tracking-widest bg-[#4d4635] text-[#d0c5af] px-2 py-0.5 rounded font-bold">{method.badge}</span>
                                  )}
                                </div>
                                <span className="text-[10px] text-[#99907c]">{method.sublabel}</span>
                              </div>
                              <Icon className={["w-6 h-6 flex-shrink-0 transition-colors", isSelected ? "text-[#f2ca50]" : "text-[#4d4635]"].join(" ")} />
                            </div>

                            <AnimatePresence>
                              {isSelected && method.id === "manual_bank_transfer" && (
                                <motion.div key="bank-panel"
                                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                                  className="overflow-hidden border-t border-[#f2ca50]/20 bg-[#0a0a0a]"
                                >
                                  <div className="p-6 flex flex-col gap-4">
                                    <div className="p-4 rounded-xl border border-[#4d4635]/50 bg-[#131313]">
                                      {[
                                        { label: "Bank", value: displayBankDetails.bankName },
                                        { label: "Branch", value: displayBankDetails.branch },
                                        { label: "Account Name", value: displayBankDetails.accountName },
                                      ].map(({ label, value }) => (
                                        <div key={label} className="flex justify-between items-center py-3 border-b border-[#1c1b1b]">
                                          <span className="text-[10px] uppercase tracking-widest text-[#99907c] font-bold">{label}</span>
                                          <span className="font-bold text-[#e5e2e1] text-sm">{value}</span>
                                        </div>
                                      ))}
                                      <div className="flex justify-between items-center pt-3">
                                        <span className="text-[10px] uppercase tracking-widest text-[#99907c] font-bold">Account No.</span>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-[#f2ca50] tracking-wider">{displayBankDetails.accountNumber}</span>
                                          <button onClick={(e) => { e.preventDefault(); copyToClipboard(displayBankDetails.accountNumber); }} className="text-[#99907c] hover:text-[#f2ca50] transition-colors p-1"><Copy size={13} /></button>
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-[11px] text-[#99907c] leading-relaxed p-3 bg-[#131313] rounded-xl border border-[#1c1b1b]">
                                      ⏱ {displayBankDetails.deadline || "Pay within 24 hours to confirm your order."} You can upload your payment slip on the next page.
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                              {isSelected && method.id === "card" && (
                                <motion.div key="card-panel"
                                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                                  className="overflow-hidden border-t border-[#f2ca50]/20 bg-[#0a0a0a]"
                                >
                                  <div className="p-6 flex flex-col items-center text-center gap-3">
                                    <Lock className="w-8 h-8 text-[#4d4635]" />
                                    <p className="text-[11px] text-[#99907c] max-w-xs leading-relaxed">
                                      You will be redirected to our secure payment gateway after placing your order.
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Order Notes */}
                  <section className="bg-[#131313] border border-[#1c1b1b] rounded-2xl p-6 md:p-8 flex flex-col gap-4">
                    <h3 className="text-base font-bold text-[#e5e2e1]">
                      Order Notes <span className="text-[#4d4635] text-xs font-normal normal-case">(Optional)</span>
                    </h3>
                    <textarea value={formData.notes}
                      onChange={(e) => updateField("notes")(e)}
                      placeholder="Special delivery instructions, gate codes, etc..."
                      maxLength={500}
                      className="h-28 rounded-xl bg-[#0a0a0a] border border-[#1c1b1b] focus:border-[#f2ca50] p-4 text-[#e5e2e1] placeholder-[#4d4635] outline-none transition-colors resize-none text-sm"
                    />
                    <span className="text-[10px] text-[#4d4635] self-end">{(formData.notes || "").length}/500</span>
                  </section>

                  {/* Terms */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.termsAccepted}
                      onChange={(e) => updateField("termsAccepted")(e)}
                      className="mt-1 w-4 h-4 accent-[#f2ca50] flex-shrink-0"
                    />
                    <span className="text-[11px] text-[#99907c] leading-relaxed">
                      I agree to the{" "}
                      <Link to="/terms" className="text-[#f2ca50] hover:underline">Terms & Conditions</Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-[#f2ca50] hover:underline">Privacy Policy</Link>.
                    </span>
                  </label>
                  {errors.termsAccepted && <span className="text-[10px] text-[#ffb4ab] -mt-4">{errors.termsAccepted}</span>}

                  {/* CTA */}
                  <button onClick={handleSubmit} disabled={isSubmitting}
                    className="w-full bg-[#f2ca50] text-black h-16 rounded-xl font-black uppercase tracking-[0.18em] text-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_6px_30px_rgba(242,202,80,0.25)] flex items-center justify-center gap-2"
                  >
                    {isSubmitting
                      ? <><Loader2 className="animate-spin" size={18} /> Processing...</>
                      : <><Lock size={16} /> Place Secure Order</>
                    }
                  </button>

                  <button onClick={() => setCurrentStep("address")} className="text-[10px] uppercase tracking-widest font-bold text-[#99907c] hover:text-[#f2ca50] transition-colors text-center">
                    ← Back to Shipping
                  </button>

                  {/* Trust badges */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#1c1b1b]">
                    {[
                      { icon: ShieldCheck, label: "Secure Checkout"  },
                      { icon: Lock,        label: "SSL Protected"    },
                      { icon: Truck,       label: "Island Delivery"  },
                      { icon: Check,       label: "Easy Returns"     },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex flex-col items-center gap-2 text-center">
                        <Icon className="w-5 h-5 text-[#f2ca50]" />
                        <span className="text-[9px] uppercase tracking-widest text-[#99907c] font-bold">{label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* RIGHT 35% — STICKY SUMMARY (Desktop only) */}
          <div className="w-full lg:w-[35%] hidden lg:block">
            <div className="sticky top-[110px] flex flex-col gap-6">

              <div className="bg-[#131313] border border-[#1c1b1b] rounded-[24px] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                <h3 className="text-lg font-bold text-[#e5e2e1] mb-6">Order Summary</h3>

                {/* Items */}
                <div className="flex flex-col gap-5 max-h-[350px] overflow-y-auto pr-1 mb-6">
                  {checkoutItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative w-[72px] h-[72px] bg-[#0a0a0a] rounded-xl border border-[#1c1b1b] overflow-hidden flex-shrink-0">
                        <img src={item.product?.image} alt={item.product?.name} className="w-full h-full object-contain p-1.5" />
                        <span className="absolute -top-1.5 -right-1.5 bg-[#f2ca50] text-black w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black">{item.quantity}</span>
                      </div>
                      <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
                        <h4 className="text-xs font-bold text-[#e5e2e1] line-clamp-2 leading-snug">{item.product?.name}</h4>
                        <div className="text-[9px] text-[#99907c] uppercase tracking-wider font-bold">
                          {[item.variant?.size, item.variant?.color].filter(Boolean).join(" · ")}
                        </div>
                        <div className="text-sm font-bold text-[#f2ca50]">{formatLKR(item.unitPrice * item.quantity)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo code */}
                <div className="flex gap-2 mb-3">
                  <input type="text" placeholder="Gift card or discount code"
                    value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 h-11 bg-[#0a0a0a] border border-[#1c1b1b] focus:border-[#f2ca50] rounded-xl px-4 text-sm text-[#e5e2e1] placeholder-[#4d4635] outline-none transition-colors"
                  />
                  <button onClick={() => applyCouponCode()} disabled={!couponInput || couponApplying}
                    className="h-11 px-5 bg-[#4d4635] text-[#d0c5af] rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#f2ca50] hover:text-black transition-colors disabled:opacity-40 flex items-center justify-center"
                  >
                    {couponApplying ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-green-400 font-bold flex items-center gap-1.5">
                      <Gift size={11} /> {appliedCoupon.code} applied
                    </span>
                    <button onClick={removeCoupon} className="text-[#99907c] hover:text-[#ffb4ab] transition-colors"><Trash2 size={12} /></button>
                  </div>
                )}
                {rewardSuggestions.length > 0 && !appliedCoupon && (
                  <div className="flex flex-col gap-2 mb-4">
                    {rewardSuggestions.map((r) => (
                      <button key={r.code} onClick={() => applyCouponCode(r.code)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl border border-[#4d4635]/40 hover:border-[#f2ca50]/40 bg-[#0a0a0a] transition-colors text-left group"
                      >
                        <span className="text-[10px] font-bold text-[#d0c5af] uppercase tracking-widest group-hover:text-[#f2ca50]">{r.code}</span>
                        <span className="text-[10px] text-[#99907c]">Tap to apply</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Totals */}
                <div className="border-t border-[#1c1b1b] pt-5 flex flex-col gap-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#99907c]">Subtotal</span>
                    <span className="text-[#e5e2e1] font-bold">{formatLKR(checkoutTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#99907c]">Shipping ({selectedDelivery.label})</span>
                    <span className="font-bold">{shippingFee === 0 ? <span className="text-green-400">FREE</span> : <span className="text-[#e5e2e1]">{formatLKR(shippingFee)}</span>}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400">Discount ({appliedCoupon?.code})</span>
                      <span className="text-green-400 font-bold">-{formatLKR(couponDiscount)}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-[#f2ca50]/20 mt-4 pt-5 flex justify-between items-end">
                  <div>
                    <span className="text-base font-bold text-[#e5e2e1]">Total</span>
                    <div className="text-[9px] uppercase tracking-widest text-[#4d4635] mt-0.5">incl. all charges</div>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-[#99907c] font-bold">LKR</span>
                    <span className="text-[28px] font-black text-[#f2ca50] leading-none">{finalTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Trust block */}
              <div className="bg-[#131313] border border-[#1c1b1b] rounded-2xl p-5 flex flex-col gap-3">
                {[
                  { icon: ShieldCheck, label: "Secure & Encrypted Checkout"    },
                  { icon: Truck,       label: "Islandwide Delivery Available"   },
                  { icon: Package,     label: "Careful Packaging Guaranteed"    },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[#f2ca50] flex-shrink-0" />
                    <span className="text-[10px] uppercase tracking-widest text-[#99907c] font-bold">{label}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ═══════════ MOBILE STICKY BOTTOM BAR ═══════════ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-t-2 border-[#f2ca50] px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <div className="text-[9px] uppercase tracking-widest text-[#99907c] font-bold">Total Due</div>
            <div className="text-xl font-black text-[#f2ca50]">{formatLKR(finalTotal)}</div>
          </div>
          <div className="text-[10px] text-[#99907c]">{itemCount} item{itemCount !== 1 ? "s" : ""}</div>
        </div>
        <button
          onClick={
            currentStep === "contact" ? () => proceedToStep("address") :
            currentStep === "address" ? () => proceedToStep("payment") :
            handleSubmit
          }
          disabled={isSubmitting}
          className="w-full bg-[#f2ca50] text-black h-14 rounded-xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50"
        >
          {isSubmitting
            ? <><Loader2 className="animate-spin" size={16} /> Processing...</>
            : currentStep === "payment"
              ? <><Lock size={14} /> Place Secure Order</>
              : "Continue →"
          }
        </button>
      </div>

      {/* ═══════════ OTP MODAL ═══════════ */}
      {otpModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#131313] p-8 border border-[#1c1b1b] shadow-2xl flex flex-col gap-5">
            <div>
              <h3 className="text-xl font-bold text-white">Verify Your Email</h3>
              <p className="text-[11px] text-[#99907c] mt-1">
                Enter the 4-digit code sent to <span className="text-[#f2ca50]">{formData.email}</span>.
              </p>
            </div>
            <input type="text" value={otpModal.code}
              onChange={(e) => setOtpModal((prev) => ({ ...prev, code: e.target.value }))}
              placeholder="0000" maxLength={4}
              className="w-full h-16 rounded-xl bg-[#0a0a0a] border border-[#1c1b1b] focus:border-[#f2ca50] text-center text-3xl tracking-[0.6em] text-white font-black outline-none"
            />
            {!otpModal.sent ? (
              <button onClick={sendGuestOtp} disabled={otpModal.sending}
                className="w-full bg-[#f2ca50] text-black h-12 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {otpModal.sending ? <><Loader2 className="animate-spin" size={14} /> Sending...</> : "Send Code"}
              </button>
            ) : (
              <button onClick={verifyGuestOtp} disabled={otpModal.verifying}
                className="w-full bg-[#f2ca50] text-black h-12 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {otpModal.verifying ? <><Loader2 className="animate-spin" size={14} /> Verifying...</> : "Verify & Place Order"}
              </button>
            )}
            <button
              onClick={() => setOtpModal({ open: false, sending: false, sent: false, code: "", verifying: false })}
              className="text-[#99907c] text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;