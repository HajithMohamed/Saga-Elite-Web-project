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
import { getVariantImage } from "@/lib/variant-image";
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

// District → province, for resolving the admin-managed shipping zone
// (ShippingZone.provinces holds province names).
const DISTRICT_TO_PROVINCE = {
  Colombo: "Western", Gampaha: "Western", Kalutara: "Western",
  Kandy: "Central", Matale: "Central", "Nuwara Eliya": "Central",
  Galle: "Southern", Matara: "Southern", Hambantota: "Southern",
  Jaffna: "Northern", Kilinochchi: "Northern", Mannar: "Northern",
  Mullaitivu: "Northern", Vavuniya: "Northern",
  Trincomalee: "Eastern", Batticaloa: "Eastern", Ampara: "Eastern",
  Kurunegala: "North Western", Puttalam: "North Western",
  Anuradhapura: "North Central", Polonnaruwa: "North Central",
  Badulla: "Uva", Monaragala: "Uva",
  Ratnapura: "Sabaragamuwa", Kegalle: "Sabaragamuwa",
};

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
    sublabel: "Visa · Mastercard · Amex",
    description: "Pay securely online via PayHere. Your card details never touch our servers.",
    badge: "Secure",
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

// Light, non-destructive sanitizer for live typing: keeps digits / "+" / spaces,
// never re-prepends a leading "0" and never restructures the value — so backspace
// works naturally and the cursor stays put. Full formatting + validation happens
// on blur / submit via formatSriLankanPhoneInput + isValidSriLankanMobile.
const sanitizePhoneInput = (value) =>
  String(value || "")
    .replace(/[^\d+\s]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 18);

const useCheckoutPersistence = (initialValue, migrate) => {
  const [val, setVal] = useState(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = window.localStorage.getItem(CHECKOUT_PERSIST_KEY);
      // Merge over the defaults so newly added form fields never come back
      // undefined from an older persisted snapshot.
      const merged = stored ? { ...initialValue, ...JSON.parse(stored) } : initialValue;
      return migrate ? migrate(merged) : merged;
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
  "h-12 w-full rounded-xl border bg-page px-4 text-sm text-ink-2 placeholder-goldshadow transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20";

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
    <label className="se-label block text-[10px] uppercase tracking-[0.28em] text-muted">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn(
        fieldBaseClass,
        error ? "border-rose-500/60" : "border-line/40 focus:border-[var(--accent)]"
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
    <label className="se-label block text-[10px] uppercase tracking-[0.28em] text-muted">
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
          error ? "border-rose-500/60" : "border-line/40 focus:border-[var(--accent)]"
        )}
      >
        {!value && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-page">
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
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
    // Permanent (billing) address — delivery mirrors it while
    // "same as permanent" is ticked.
    sameAsPermanent: true,
    permStreet: "",
    permCity: "",
    permDistrict: "",
    permPostalCode: "",
    deliveryMode: "standard",
    notes: "",
    paymentMethod: "manual_bank_transfer",
    termsAccepted: false,
    couponCode: "",
  }, (merged) => {
    // Older persisted checkouts pre-date the permanent-address block —
    // seed it from the delivery fields so nothing appears blank.
    if (!merged.permStreet && !merged.permCity && !merged.permPostalCode &&
        (merged.addressLine || merged.city || merged.postalCode)) {
      return {
        ...merged,
        permStreet: merged.addressLine,
        permCity: merged.city,
        permDistrict: merged.district,
        permPostalCode: merged.postalCode,
      };
    }
    return merged;
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
    // Guests have no server cart — skip the fetch instead of collecting 401s.
    if (isAuthenticated) dispatch(fetchCartAction());
  }, [cartStateItems, dispatch, location.state, isAuthenticated]);

  useEffect(() => {
    if (!hasInitializedSource || isBuyNow) return;
    setCheckoutItems(items);
    setCheckoutTotal(totalPrice);
  }, [hasInitializedSource, isBuyNow, items, totalPrice]);

  // Pre-fill the permanent block from the default saved address, without
  // clobbering anything the customer already typed this session.
  const seedPermanentFromSaved = (list) => {
    const def = list.find((a) => a.isDefault) || list[0];
    if (!def) return;
    setFormData((prev) => {
      if (prev.permStreet || prev.permCity || prev.permPostalCode) return prev;
      return {
        ...prev,
        permStreet: def.street || "",
        permCity: def.city || "",
        permDistrict: def.district || "",
        permPostalCode: def.postalCode || "",
        ...(prev.sameAsPermanent
          ? {
              addressLine: def.street || "",
              city: def.city || "",
              district: def.district || prev.district || "",
              postalCode: def.postalCode || "",
            }
          : {}),
      };
    });
  };

  // Saved addresses fetch (Fix #4)
  useEffect(() => {
    if (isAuthenticated) {
      axiosInstance
        .get("/user/addresses")
        .then((res) => {
          const list = res.data?.data?.addresses || [];
          setSavedAddresses(list);
          if (list.length > 0) {
            setUseNewAddress(false);
            seedPermanentFromSaved(list);
          }
        })
        .catch(() => setSavedAddresses([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed helper is stable per render
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
        if (list.length > 0) {
          setUseNewAddress(false);
          seedPermanentFromSaved(list);
        }
      })
      .catch(() => setSavedAddresses([]));
  };

  const applySavedAddress = (addr) => {
    if (!addr) return;
    setFormData((prev) => ({
      ...prev,
      // Saved addresses fill the permanent block; delivery mirrors it while
      // "same as permanent" is ticked.
      permStreet: addr.street || "",
      permCity: addr.city || "",
      permDistrict: addr.district || prev.permDistrict || "",
      permPostalCode: addr.postalCode || "",
      ...(prev.sameAsPermanent
        ? {
            addressLine: addr.street || "",
            city: addr.city || "",
            district: addr.district || prev.district || "",
            postalCode: addr.postalCode || "",
          }
        : {}),
      country: addr.country || "Sri Lanka",
    }));
  };

  // Permanent-address field writes; mirrored into the delivery fields while
  // the "same as permanent" checkbox is ticked.
  const PERM_TO_DELIVERY = {
    permStreet: "addressLine",
    permCity: "city",
    permDistrict: "district",
    permPostalCode: "postalCode",
  };

  const updatePermField = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(prev.sameAsPermanent ? { [PERM_TO_DELIVERY[field]]: value } : {}),
    }));
    setErrors((prev) => ({ ...prev, [PERM_TO_DELIVERY[field]]: "" }));
  };

  const toggleSameAsPermanent = (checked) => {
    setFormData((prev) => ({
      ...prev,
      sameAsPermanent: checked,
      // Ticking the box copies the permanent address onto delivery.
      ...(checked
        ? {
            addressLine: prev.permStreet,
            city: prev.permCity,
            district: prev.permDistrict,
            postalCode: prev.permPostalCode,
          }
        : {}),
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

  // Admin-managed shipping zones — resolves the delivery fee/ETA from the
  // selected district. Falls back to the hardcoded prices if unavailable.
  const [shippingZones, setShippingZones] = useState([]);
  useEffect(() => {
    axios
      .get(`${API_BASE}/shipping-zones`)
      .then((res) => {
        const zones = res.data?.data?.zones || res.data?.data || [];
        setShippingZones(Array.isArray(zones) ? zones : []);
      })
      .catch(() => setShippingZones([]));
  }, []);

  // Always use Saga Elite gold as the checkout accent — never override with variant colour
  const CHECKOUT_GOLD = "#f2ca50";

  // Delivery Pricing Logic — zone-based (admin-managed), with the previous
  // hardcoded prices as a graceful fallback when no zone matches.
  const isFastDistrict = FAST_DISTRICTS.includes(formData.district);
  const selectedDelivery = DELIVERY_METHODS.find(m => m.id === formData.deliveryMode) || DELIVERY_METHODS[0];

  const deliveryProvince = DISTRICT_TO_PROVINCE[formData.district] || "";
  const activeZone = useMemo(() => {
    if (!deliveryProvince || shippingZones.length === 0) return null;
    return (
      shippingZones.find((zone) =>
        (zone.provinces || []).some(
          (p) => String(p).trim().toLowerCase() === deliveryProvince.toLowerCase()
        )
      ) || null
    );
  }, [shippingZones, deliveryProvince]);

  // Free-shipping threshold: the zone's own freeAbove wins; otherwise the
  // legacy global threshold applies.
  const freeShippingThreshold =
    activeZone && Number(activeZone.freeAbove) > 0
      ? Number(activeZone.freeAbove)
      : FREE_SHIPPING_THRESHOLD;
  const isFreeShippingQualify = checkoutTotal >= freeShippingThreshold;

  const standardFee = activeZone ? Number(activeZone.deliveryFee) || 0 : DELIVERY_METHODS[0].price;

  const shippingFee = formData.deliveryMode === "pickup"
    ? 0
    : formData.deliveryMode === "standard"
      ? (isFreeShippingQualify ? 0 : standardFee)
      : selectedDelivery.price;

  const couponDiscount = Math.min(
    checkoutTotal,
    Math.max(0, Number(appliedCoupon?.discount || 0))
  );
  const finalTotal = Math.max(0, checkoutTotal - couponDiscount) + shippingFee;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - checkoutTotal);
  const shippingProgress = Math.min(100, (checkoutTotal / freeShippingThreshold) * 100);

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
    const val = sanitizePhoneInput(e.target.value);
    setFormData((prev) => ({ ...prev, phone: val }));
    setErrors((prev) => ({ ...prev, phone: undefined, alternativePhone: undefined }));
  };

  const handleAlternativePhoneChange = (e) => {
    const val = sanitizePhoneInput(e.target.value);
    setFormData((prev) => ({ ...prev, alternativePhone: val }));
    setErrors((prev) => ({ ...prev, alternativePhone: undefined }));
  };

  // Validate + tidy formatting only once the user leaves the field. A valid
  // number is reformatted to the canonical "0XX XXX XXXX" display; an invalid
  // one is left as typed so it can be corrected.
  const handlePhoneBlur = () => {
    const trimmed = formData.phone.trim();
    if (!trimmed) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
      return;
    }
    if (isValidSriLankanMobile(trimmed)) {
      setFormData((prev) => ({ ...prev, phone: formatSriLankanPhoneInput(trimmed) }));
      setErrors((prev) => ({ ...prev, phone: undefined }));
    } else {
      setErrors((prev) => ({ ...prev, phone: "Enter a valid Sri Lankan mobile number" }));
    }
  };

  const handleAlternativePhoneBlur = () => {
    const trimmed = formData.alternativePhone.trim();
    if (!trimmed) {
      setErrors((prev) => ({ ...prev, alternativePhone: undefined }));
      return;
    }
    if (!isValidSriLankanMobile(trimmed)) {
      setErrors((prev) => ({ ...prev, alternativePhone: "Enter a valid Sri Lankan mobile number" }));
      return;
    }
    if (
      formData.phone.trim() &&
      normalizeSriLankanPhoneForMatch(formData.phone) ===
        normalizeSriLankanPhoneForMatch(trimmed)
    ) {
      setErrors((prev) => ({
        ...prev,
        alternativePhone: "Alternative phone must be different from the primary phone",
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, alternativePhone: formatSriLankanPhoneInput(trimmed) }));
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
      if (Object.keys(nextErrors).length === 0) {
        setCurrentStep("address");
      } else {
        toast({
          title: "Check your contact details",
          description: "Please complete the highlighted fields before continuing.",
          variant: "destructive",
        });
      }
    } else if (currentStep === "address") {
      const nextErrors = validateStep("address");
      if (Object.keys(nextErrors).length === 0) {
        setCurrentStep("payment");
      } else {
        // The delivery-address inputs live on the contact step, so send the
        // user back there to see the highlighted fields — otherwise the button
        // silently does nothing and the flow feels broken.
        toast({
          title: "Delivery address needed",
          description: "Please complete your delivery address to continue.",
          variant: "destructive",
        });
        setCurrentStep("contact");
      }
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

    // Billing = the permanent address (equals delivery when "same as" ticked).
    const billingAddress = formData.permStreet
      ? [
          formData.fullName,
          formData.permStreet,
          `${formData.permCity}, ${formData.permDistrict} ${formData.permPostalCode}`.trim(),
          formData.country,
        ]
          .filter(Boolean)
          .join("\n")
      : undefined;

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

    // Structured address payload for persistence (Fix #4) — stores the
    // PERMANENT address so the next checkout auto-fills it. Pickup keeps the
    // delivery-fields fallback.
    const permComplete =
      formData.permStreet && formData.permCity && formData.permPostalCode;
    const structuredAddress =
      formData.deliveryMode === "pickup" && !permComplete
        ? null
        : permComplete
          ? {
              label: formData.permDistrict || undefined,
              street: formData.permStreet,
              city: formData.permCity,
              district: formData.permDistrict || undefined,
              postalCode: formData.permPostalCode,
              country: formData.country || "Sri Lanka",
            }
          : {
              label: formData.district || undefined,
              street: formData.addressLine,
              city: formData.city,
              district: formData.district || undefined,
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
          billingAddress,
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

      // Guest checked out with an email that already has an account — the order
      // was linked to it. Let them know so they can sign in to track it.
      if (response?.linkedToAccount) {
        toast({
          title: "This email already has a Saga Elite account",
          description:
            "We've linked this order to your account — sign in with this email to track it in your order history.",
        });
      }

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
    <div className="min-h-screen bg-page text-ink-2 pb-36 md:pb-16">
      {/* ═══════════ STICKY HEADER ═══════════ */}
      <header className="sticky top-0 z-40 border-b border-card bg-page/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 md:px-8">
          <Link to="/shopping/home" className="flex flex-col leading-none group">
            <span className="font-serif text-xl md:text-2xl tracking-[0.18em] text-ink-2 group-hover:text-gold-ink transition-colors duration-300">
              SAGA ELITE
            </span>
            <span className="text-[8px] uppercase tracking-[0.32em] text-muted mt-0.5">Rare Fit Forever</span>
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-gold-ink/30 bg-gold/5 px-4 py-2">
            <Lock className="h-3.5 w-3.5 text-gold-ink" />
            <span className="text-[10px] uppercase tracking-widest text-gold-ink font-bold hidden sm:inline">Secure Checkout ·</span>
            <span className="text-[10px] uppercase tracking-widest text-gold-ink font-bold">SSL</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 md:px-8 pt-8">

        {/* ═══════════ BREADCRUMB ═══════════ */}
        <nav className="mb-8 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted">
          <Link to="/" className="hover:text-gold-ink transition-colors">Home</Link>
          <span className="text-muted">›</span>
          <Link to="/shopping/cart" className="hover:text-gold-ink transition-colors">Shopping Cart</Link>
          <span className="text-muted">›</span>
          <span className="text-gold-ink font-bold">Secure Checkout</span>
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
                      isPast   ? "bg-gold border-gold-ink text-black"           :
                      isActive ? "bg-transparent border-gold-ink text-gold-ink"    :
                                 "bg-transparent border-elevated text-line"
                    ].join(" ")}>
                      {isPast ? <Check size={14} /> : step.num}
                    </div>
                    <span className={[
                      "text-[9px] uppercase tracking-widest font-bold",
                      isActive ? "text-gold-ink" : isPast ? "text-ink-2" : "text-line"
                    ].join(" ")}>
                      {step.label}
                    </span>
                  </div>
                  {idx < checkoutSteps.length - 1 && (
                    <div
                      className={[
                        "h-[2px] mx-3 rounded-full transition-colors duration-500",
                        currentStepNum > step.num ? "bg-gold" : "bg-card"
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
          <details className="group bg-panel border border-card rounded-2xl overflow-hidden">
            <summary className="flex items-center justify-between p-5 cursor-pointer list-none select-none">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-widest text-ink-2">Order Summary</span>
                <span className="text-[10px] text-muted font-bold">({itemCount} item{itemCount !== 1 ? "s" : ""})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gold-ink">{formatLKR(finalTotal)}</span>
                <ChevronDown className="w-4 h-4 text-muted transition-transform duration-300 group-open:rotate-180" />
              </div>
            </summary>
            <div className="p-5 border-t border-card bg-page flex flex-col gap-4">
              {checkoutItems.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-16 h-16 bg-panel rounded-xl border border-card overflow-hidden flex-shrink-0">
                    <img src={getVariantImage(item.product, item.variant?.color)} alt={item.product?.name} className="w-full h-full object-contain p-1" />
                    <span className="absolute -top-1.5 -right-1.5 bg-gold text-black w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black">{item.quantity}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center gap-0.5 min-w-0">
                    <h4 className="text-xs font-bold text-ink-2 line-clamp-2">{item.product?.name}</h4>
                    <div className="text-[10px] text-muted uppercase tracking-wider">
                      {[item.variant?.size, item.variant?.color].filter(Boolean).join(" · ")}
                    </div>
                    <div className="text-xs font-bold text-gold-ink">{formatLKR(item.unitPrice * item.quantity)}</div>
                  </div>
                </div>
              ))}
              <div className="border-t border-card pt-4 flex flex-col gap-2">
                <div className="flex justify-between text-sm"><span className="text-muted">Subtotal</span><span className="text-ink-2 font-bold">{formatLKR(checkoutTotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted">Delivery{activeZone && formData.deliveryMode !== "pickup" ? ` · ${activeZone.name}` : ""}</span><span className="text-ink-2 font-bold">{shippingFee === 0 ? "FREE" : formatLKR(shippingFee)}</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-sm"><span className="text-green-400">Discount</span><span className="text-green-400 font-bold">-{formatLKR(couponDiscount)}</span></div>}
                <div className="flex justify-between text-base pt-2 border-t border-gold-ink/20"><span className="font-bold text-ink-2">Total</span><span className="font-bold text-gold-ink">{formatLKR(finalTotal)}</span></div>
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
                    <div className="p-5 rounded-2xl border border-line/60 bg-panel flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-ink-2 text-sm">Already have an account?</h4>
                        <p className="text-[11px] text-muted mt-0.5">Sign in for faster checkout, saved addresses & exclusive rewards.</p>
                      </div>
                      <Link to="/auth/login" className="whitespace-nowrap px-6 py-3 rounded-xl border border-gold-ink text-gold-ink font-bold uppercase tracking-widest text-[10px] hover:bg-gold/10 transition-colors flex-shrink-0">
                        Sign In
                      </Link>
                    </div>
                  )}

                  <section className="bg-panel border border-card rounded-2xl p-6 md:p-8 flex flex-col gap-6">
                    <h2 className="text-xl font-bold text-ink-2">Contact Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted">Full Name *</label>
                        <input type="text" value={formData.fullName}
                          onChange={(e) => updateField("fullName")(e)}
                          placeholder="Your full name"
                          className={["h-14 rounded-xl bg-page border px-4 text-ink-2 placeholder-line outline-none transition-colors", errors.fullName ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")}
                        />
                        {errors.fullName && <span className="text-[10px] text-danger-ink">{errors.fullName}</span>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted">Email Address *</label>
                        <input type="email" value={formData.email}
                          onChange={handleEmailChange} readOnly={isAuthenticated}
                          onBlur={() => { if (!isAuthenticated) fetchGuestAddresses(formData.email); }}
                          placeholder="you@example.com"
                          className={["h-14 rounded-xl bg-page border px-4 text-ink-2 placeholder-line outline-none transition-colors", errors.email ? "border-danger-ink" : "border-card focus:border-gold-ink", isAuthenticated ? "opacity-60 cursor-not-allowed" : ""].join(" ")}
                        />
                        {errors.email && <span className="text-[10px] text-danger-ink">{errors.email}</span>}
                        {errors.emailHint && <span className="text-[10px] text-gold-ink">💡 {errors.emailHint}</span>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted">Phone Number *</label>
                        <input type="tel" value={formData.phone} inputMode="tel"
                          onChange={handlePhoneChange} onBlur={handlePhoneBlur} placeholder="07X XXX XXXX"
                          className={["h-14 rounded-xl bg-page border px-4 text-ink-2 placeholder-line outline-none transition-colors", errors.phone ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")}
                        />
                        {errors.phone && <span className="text-[10px] text-danger-ink">{errors.phone}</span>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted">
                          Alt. Phone <span className="normal-case font-normal text-line">(Optional)</span>
                        </label>
                        <input type="tel" value={formData.alternativePhone} inputMode="tel"
                          onChange={handleAlternativePhoneChange} onBlur={handleAlternativePhoneBlur} placeholder="07X XXX XXXX"
                          className={["h-14 rounded-xl bg-page border px-4 text-ink-2 placeholder-line outline-none transition-colors", errors.alternativePhone ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")}
                        />
                        {errors.alternativePhone && <span className="text-[10px] text-danger-ink">{errors.alternativePhone}</span>}
                      </div>
                    </div>
                  </section>

                  <section className="bg-panel border border-card rounded-2xl p-6 md:p-8 flex flex-col gap-6">
                    <div>
                      <h2 className="text-xl font-bold text-ink-2">Permanent Address</h2>
                      <p className="text-[11px] text-muted mt-1">Saved to your account and auto-filled on your next purchase.</p>
                    </div>

                    {savedAddresses.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {savedAddresses.map((addr, i) => (
                          <div key={i}
                            onClick={() => { applySavedAddress(addr); setUseNewAddress(false); }}
                            className={["p-4 rounded-xl border cursor-pointer transition-all", !useNewAddress ? "border-gold-ink bg-gold/5" : "border-card bg-page hover:border-line"].join(" ")}
                          >
                            <div className="text-xs font-bold text-ink-2 mb-1">{addr.label || "Saved Address"}</div>
                            <div className="text-[10px] text-muted">{addr.street}, {addr.city}</div>
                          </div>
                        ))}
                        <div onClick={() => setUseNewAddress(true)}
                          className={["p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-center", useNewAddress ? "border-gold-ink text-gold-ink" : "border-card text-line hover:border-line"].join(" ")}
                        >
                          <span className="text-xs font-bold uppercase tracking-widest">+ New Address</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted">Street Address *</label>
                        <input type="text" value={formData.permStreet}
                          onChange={updatePermField("permStreet")} placeholder="No. 12, Main Street"
                          className={["h-14 rounded-xl bg-page border px-4 text-ink-2 placeholder-line outline-none transition-colors", formData.sameAsPermanent && errors.addressLine ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")}
                        />
                        {formData.sameAsPermanent && errors.addressLine && <span className="text-[10px] text-danger-ink">{errors.addressLine}</span>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted">City *</label>
                        <input type="text" value={formData.permCity}
                          onChange={updatePermField("permCity")} placeholder="Colombo"
                          className={["h-14 rounded-xl bg-page border px-4 text-ink-2 placeholder-line outline-none transition-colors", formData.sameAsPermanent && errors.city ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")}
                        />
                        {formData.sameAsPermanent && errors.city && <span className="text-[10px] text-danger-ink">{errors.city}</span>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted">District *</label>
                        <select value={formData.permDistrict}
                          onChange={updatePermField("permDistrict")}
                          className={["h-14 rounded-xl bg-page border px-4 text-ink-2 outline-none transition-colors appearance-none cursor-pointer", formData.sameAsPermanent && errors.district ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")}
                        >
                          <option value="">Select District</option>
                          {SRI_LANKA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {formData.sameAsPermanent && errors.district && <span className="text-[10px] text-danger-ink">{errors.district}</span>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted">Postal Code *</label>
                        <input type="text" value={formData.permPostalCode}
                          onChange={updatePermField("permPostalCode")} placeholder="10100"
                          className={["h-14 rounded-xl bg-page border px-4 text-ink-2 placeholder-line outline-none transition-colors", formData.sameAsPermanent && errors.postalCode ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")}
                        />
                        {formData.sameAsPermanent && errors.postalCode && <span className="text-[10px] text-danger-ink">{errors.postalCode}</span>}
                      </div>
                    </div>

                    {/* Same-as-permanent toggle */}
                    <label className="flex items-start gap-3 cursor-pointer select-none rounded-xl border border-card bg-page p-4 hover:border-line transition-colors">
                      <input
                        type="checkbox"
                        checked={!!formData.sameAsPermanent}
                        onChange={(e) => toggleSameAsPermanent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-gold cursor-pointer"
                      />
                      <span className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-ink-2">Delivery address is same as permanent address</span>
                        <span className="text-[10px] text-muted">Untick to ship this order somewhere else — your permanent address stays saved.</span>
                      </span>
                    </label>

                    {!formData.sameAsPermanent && (
                      <div className="flex flex-col gap-4 rounded-xl border border-gold-ink/20 bg-gold/[0.02] p-4 md:p-5">
                        <h3 className="text-sm font-bold text-ink-2">Delivery Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2 flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-muted">Street Address *</label>
                            <input type="text" value={formData.addressLine}
                              onChange={(e) => updateField("addressLine")(e)} placeholder="No. 12, Main Street"
                              className={["h-14 rounded-xl bg-page border px-4 text-ink-2 placeholder-line outline-none transition-colors", errors.addressLine ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")}
                            />
                            {errors.addressLine && <span className="text-[10px] text-danger-ink">{errors.addressLine}</span>}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-muted">City *</label>
                            <input type="text" value={formData.city}
                              onChange={(e) => updateField("city")(e)} placeholder="Colombo"
                              className={["h-14 rounded-xl bg-page border px-4 text-ink-2 placeholder-line outline-none transition-colors", errors.city ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")}
                            />
                            {errors.city && <span className="text-[10px] text-danger-ink">{errors.city}</span>}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-muted">District *</label>
                            <select value={formData.district}
                              onChange={(e) => updateField("district")(e)}
                              className={["h-14 rounded-xl bg-page border px-4 text-ink-2 outline-none transition-colors appearance-none cursor-pointer", errors.district ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")}
                            >
                              <option value="">Select District</option>
                              {SRI_LANKA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                            {errors.district && <span className="text-[10px] text-danger-ink">{errors.district}</span>}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-muted">Postal Code *</label>
                            <input type="text" value={formData.postalCode}
                              onChange={(e) => updateField("postalCode")(e)} placeholder="10100"
                              className={["h-14 rounded-xl bg-page border px-4 text-ink-2 placeholder-line outline-none transition-colors", errors.postalCode ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")}
                            />
                            {errors.postalCode && <span className="text-[10px] text-danger-ink">{errors.postalCode}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Desktop-only CTA — on mobile the sticky bottom bar drives navigation */}
                  <div className="hidden lg:flex justify-end">
                    <button onClick={() => proceedToStep("address")}
                      className="bg-gold text-black h-14 px-10 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:brightness-110 transition-all"
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
                  <section className="bg-panel border border-card rounded-2xl p-6 md:p-8 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-ink-2">Shipping Method</h2>
                      <button onClick={() => setCurrentStep("contact")} className="text-[10px] uppercase tracking-widest font-bold text-muted hover:text-gold-ink transition-colors">
                        ← Edit Contact
                      </button>
                    </div>

                    {!isFreeShippingQualify && formData.deliveryMode === "standard" && (
                      <div className="p-4 rounded-xl border border-line/40 bg-page flex flex-col gap-2">
                        <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                          <span className="text-muted">Add {formatLKR(amountToFreeShipping)} more for free shipping</span>
                          <span className="text-gold-ink">{Math.round(shippingProgress)}%</span>
                        </div>
                        <div className="h-1.5 bg-card rounded-full overflow-hidden">
                          <div className="h-full bg-gold rounded-full transition-all duration-700" style={{ width: `${shippingProgress}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Delivery zone transparency — resolved from the admin-managed
                        shipping zones by the selected district's province. */}
                    {activeZone && formData.deliveryMode !== "pickup" && (
                      <div className="p-4 rounded-xl border border-gold-ink/20 bg-gold/[0.03] flex flex-col gap-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <div className="text-[9px] uppercase tracking-widest font-bold text-muted">Delivery Zone</div>
                            <div className="text-sm font-bold text-ink-2 mt-0.5">{activeZone.name}</div>
                          </div>
                          <div>
                            <div className="text-[9px] uppercase tracking-widest font-bold text-muted">Estimated</div>
                            <div className="text-sm font-bold text-ink-2 mt-0.5">{activeZone.estimatedDays || "1–3 business days"}</div>
                          </div>
                          <div>
                            <div className="text-[9px] uppercase tracking-widest font-bold text-muted">Delivery Charge</div>
                            <div className="text-sm font-bold mt-0.5">
                              {isFreeShippingQualify && formData.deliveryMode === "standard"
                                ? <span className="text-green-400">FREE</span>
                                : <span className="text-gold-ink">{formatLKR(standardFee)}</span>}
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted border-t border-gold-ink/10 pt-2.5">
                          Delivery charges are calculated automatically based on your delivery zone
                          ({deliveryProvince} Province).
                          {Number(activeZone.freeAbove) > 0 && (
                            <> Orders above {formatLKR(activeZone.freeAbove)} ship free in this zone.</>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      {DELIVERY_METHODS.map((method) => {
                        const isSelected = formData.deliveryMode === method.id;
                        const Icon = method.icon;
                        const eta = method.id === "standard" && activeZone?.estimatedDays
                          ? activeZone.estimatedDays
                          : isFastDistrict ? method.fastEta : method.eta;
                        const fee = method.id === "pickup"
                          ? 0
                          : method.id === "standard"
                            ? (isFreeShippingQualify ? 0 : standardFee)
                            : method.price;
                        return (
                          <div key={method.id}
                            onClick={() => updateField("deliveryMode")(method.id)}
                            className={["relative flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-300", isSelected ? "border-gold-ink bg-gold/5" : "border-card bg-page hover:border-line"].join(" ")}
                          >
                            <div className={["mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors", isSelected ? "border-gold-ink" : "border-line"].join(" ")}>
                              {isSelected && <div className="w-2 h-2 bg-gold rounded-full" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className={["font-bold text-sm", isSelected ? "text-gold-ink" : "text-ink-2"].join(" ")}>{method.label}</h4>
                                <span className="font-bold text-ink-2 text-sm flex-shrink-0">
                                  {fee === 0 ? <span className="text-green-400">FREE</span> : formatLKR(fee)}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted mt-1">{method.desc}</p>
                              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/40 border border-elevated">
                                <Clock size={10} className="text-cream" />
                                <span className="text-[9px] uppercase tracking-widest text-cream font-bold">{eta}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <div className="flex items-center justify-between">
                    <button onClick={() => setCurrentStep("contact")} className="text-[10px] uppercase tracking-widest font-bold text-muted hover:text-gold-ink transition-colors">← Back</button>
                    {/* Desktop-only CTA — on mobile the sticky bottom bar drives navigation */}
                    <button onClick={() => proceedToStep("payment")}
                      className="hidden lg:block bg-gold text-black h-14 px-10 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:brightness-110 transition-all"
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
                  <section className="bg-panel border border-card rounded-2xl p-6 md:p-8 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-ink-2">Payment Method</h2>
                      <button onClick={() => setCurrentStep("address")} className="text-[10px] uppercase tracking-widest font-bold text-muted hover:text-gold-ink transition-colors">
                        ← Edit Shipping
                      </button>
                    </div>
                    <p className="text-[11px] text-muted -mt-2">All transactions are encrypted and 100% secure.</p>

                    <div className="flex flex-col gap-3">
                      {PAYMENT_METHODS.map((method) => {
                        const isSelected = formData.paymentMethod === method.id;
                        const Icon = method.icon;
                        return (
                          <div key={method.id} className={["border rounded-2xl overflow-hidden transition-all duration-300", isSelected ? "border-gold-ink" : "border-card"].join(" ")}>
                            <div
                              onClick={() => updateField("paymentMethod")(method.id)}
                              className={["flex items-center gap-4 p-5 cursor-pointer transition-colors", isSelected ? "bg-gold/5" : "bg-page hover:bg-panel"].join(" ")}
                            >
                              <div className={["w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors", isSelected ? "border-gold-ink" : "border-line"].join(" ")}>
                                {isSelected && <div className="w-2 h-2 bg-gold rounded-full" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className={["font-bold text-sm", isSelected ? "text-gold-ink" : "text-ink-2"].join(" ")}>{method.label}</h4>
                                  {method.badge && (
                                    <span className="text-[8px] uppercase tracking-widest bg-line text-cream px-2 py-0.5 rounded font-bold">{method.badge}</span>
                                  )}
                                </div>
                                <span className="text-[10px] text-muted">{method.sublabel}</span>
                              </div>
                              <Icon className={["w-6 h-6 flex-shrink-0 transition-colors", isSelected ? "text-gold-ink" : "text-line"].join(" ")} />
                            </div>

                            <AnimatePresence>
                              {isSelected && method.id === "manual_bank_transfer" && (
                                <motion.div key="bank-panel"
                                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                                  className="overflow-hidden border-t border-gold-ink/20 bg-page"
                                >
                                  <div className="p-6 flex flex-col gap-4">
                                    <div className="p-4 rounded-xl border border-line/50 bg-panel">
                                      {[
                                        { label: "Bank", value: displayBankDetails.bankName },
                                        { label: "Branch", value: displayBankDetails.branch },
                                        { label: "Account Name", value: displayBankDetails.accountName },
                                      ].map(({ label, value }) => (
                                        <div key={label} className="flex justify-between items-center py-3 border-b border-card">
                                          <span className="text-[10px] uppercase tracking-widest text-muted font-bold">{label}</span>
                                          <span className="font-bold text-ink-2 text-sm">{value}</span>
                                        </div>
                                      ))}
                                      <div className="flex justify-between items-center pt-3">
                                        <span className="text-[10px] uppercase tracking-widest text-muted font-bold">Account No.</span>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-gold-ink tracking-wider">{displayBankDetails.accountNumber}</span>
                                          <button onClick={(e) => { e.preventDefault(); copyToClipboard(displayBankDetails.accountNumber); }} className="text-muted hover:text-gold-ink transition-colors p-1"><Copy size={13} /></button>
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-[11px] text-muted leading-relaxed p-3 bg-panel rounded-xl border border-card">
                                      ⏱ {displayBankDetails.deadline || "Pay within 24 hours to confirm your order."} You can upload your payment slip on the next page.
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                              {isSelected && method.id === "card" && (
                                <motion.div key="card-panel"
                                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                                  className="overflow-hidden border-t border-gold-ink/20 bg-page"
                                >
                                  <div className="p-6 flex flex-col items-center text-center gap-3">
                                    <Lock className="w-8 h-8 text-line" />
                                    <p className="text-[11px] text-muted max-w-xs leading-relaxed">
                                      After placing your order you'll complete payment on PayHere's secure window — your card details are never stored on our servers.
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
                  <section className="bg-panel border border-card rounded-2xl p-6 md:p-8 flex flex-col gap-4">
                    <h3 className="text-base font-bold text-ink-2">
                      Order Notes <span className="text-line text-xs font-normal normal-case">(Optional)</span>
                    </h3>
                    <textarea value={formData.notes}
                      onChange={(e) => updateField("notes")(e)}
                      placeholder="Special delivery instructions, gate codes, etc..."
                      maxLength={500}
                      className="h-28 rounded-xl bg-page border border-card focus:border-gold-ink p-4 text-ink-2 placeholder-line outline-none transition-colors resize-none text-sm"
                    />
                    <span className="text-[10px] text-line self-end">{(formData.notes || "").length}/500</span>
                  </section>

                  {/* Terms */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.termsAccepted}
                      onChange={(e) => updateField("termsAccepted")(e)}
                      className="mt-1 w-4 h-4 accent-gold flex-shrink-0"
                    />
                    <span className="text-[11px] text-muted leading-relaxed">
                      I agree to the{" "}
                      <Link to="/terms" className="text-gold-ink hover:underline">Terms & Conditions</Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-gold-ink hover:underline">Privacy Policy</Link>.
                    </span>
                  </label>
                  {errors.termsAccepted && <span className="text-[10px] text-danger-ink -mt-4">{errors.termsAccepted}</span>}

                  {/* CTA — desktop only; on mobile the sticky bottom bar places the order */}
                  <button onClick={handleSubmit} disabled={isSubmitting}
                    className="w-full bg-gold text-black h-16 rounded-xl font-black uppercase tracking-[0.18em] text-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_6px_30px_rgba(242,202,80,0.25)] hidden lg:flex items-center justify-center gap-2"
                  >
                    {isSubmitting
                      ? <><Loader2 className="animate-spin" size={18} /> Processing...</>
                      : <><Lock size={16} /> Place Secure Order</>
                    }
                  </button>

                  <button onClick={() => setCurrentStep("address")} className="text-[10px] uppercase tracking-widest font-bold text-muted hover:text-gold-ink transition-colors text-center">
                    ← Back to Shipping
                  </button>

                  {/* Trust badges */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-card">
                    {[
                      { icon: ShieldCheck, label: "Secure Checkout"  },
                      { icon: Lock,        label: "SSL Protected"    },
                      { icon: Truck,       label: "Island Delivery"  },
                      { icon: Check,       label: "Easy Returns"     },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex flex-col items-center gap-2 text-center">
                        <Icon className="w-5 h-5 text-gold-ink" />
                        <span className="text-[9px] uppercase tracking-widest text-muted font-bold">{label}</span>
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

              <div className="bg-panel border border-card rounded-[24px] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                <h3 className="text-lg font-bold text-ink-2 mb-6">Order Summary</h3>

                {/* Items */}
                <div className="flex flex-col gap-5 max-h-[350px] overflow-y-auto pr-1 mb-6">
                  {checkoutItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative w-[72px] h-[72px] bg-page rounded-xl border border-card overflow-hidden flex-shrink-0">
                        <img src={getVariantImage(item.product, item.variant?.color)} alt={item.product?.name} className="w-full h-full object-contain p-1.5" />
                        <span className="absolute -top-1.5 -right-1.5 bg-gold text-black w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black">{item.quantity}</span>
                      </div>
                      <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
                        <h4 className="text-xs font-bold text-ink-2 line-clamp-2 leading-snug">{item.product?.name}</h4>
                        <div className="text-[9px] text-muted uppercase tracking-wider font-bold">
                          {[item.variant?.size, item.variant?.color].filter(Boolean).join(" · ")}
                        </div>
                        <div className="text-sm font-bold text-gold-ink">{formatLKR(item.unitPrice * item.quantity)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo code */}
                <div className="flex gap-2 mb-3">
                  <input type="text" placeholder="Gift card or discount code"
                    value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 h-11 bg-page border border-card focus:border-gold-ink rounded-xl px-4 text-sm text-ink-2 placeholder-line outline-none transition-colors"
                  />
                  <button onClick={() => applyCouponCode()} disabled={!couponInput || couponApplying}
                    className="h-11 px-5 bg-line text-cream rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gold hover:text-black transition-colors disabled:opacity-40 flex items-center justify-center"
                  >
                    {couponApplying ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-green-400 font-bold flex items-center gap-1.5">
                      <Gift size={11} /> {appliedCoupon.code} applied
                    </span>
                    <button onClick={removeCoupon} className="text-muted hover:text-danger-ink transition-colors"><Trash2 size={12} /></button>
                  </div>
                )}
                {rewardSuggestions.length > 0 && !appliedCoupon && (
                  <div className="flex flex-col gap-2 mb-4">
                    {rewardSuggestions.map((r) => (
                      <button key={r.code} onClick={() => applyCouponCode(r.code)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl border border-line/40 hover:border-gold-ink/40 bg-page transition-colors text-left group"
                      >
                        <span className="text-[10px] font-bold text-cream uppercase tracking-widest group-hover:text-gold-ink">{r.code}</span>
                        <span className="text-[10px] text-muted">Tap to apply</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Totals */}
                <div className="border-t border-card pt-5 flex flex-col gap-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Subtotal</span>
                    <span className="text-ink-2 font-bold">{formatLKR(checkoutTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Shipping ({selectedDelivery.label})</span>
                    <span className="font-bold">{shippingFee === 0 ? <span className="text-green-400">FREE</span> : <span className="text-ink-2">{formatLKR(shippingFee)}</span>}</span>
                  </div>
                  {activeZone && formData.deliveryMode !== "pickup" && (
                    <p className="text-[9px] uppercase tracking-widest text-line -mt-1.5">
                      {activeZone.name} · {activeZone.estimatedDays || "1–3 business days"}
                    </p>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400">Discount ({appliedCoupon?.code})</span>
                      <span className="text-green-400 font-bold">-{formatLKR(couponDiscount)}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-gold-ink/20 mt-4 pt-5 flex justify-between items-end">
                  <div>
                    <span className="text-base font-bold text-ink-2">Total</span>
                    <div className="text-[9px] uppercase tracking-widest text-line mt-0.5">incl. all charges</div>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-muted font-bold">LKR</span>
                    <span className="text-[28px] font-black text-gold-ink leading-none">{finalTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Trust block */}
              <div className="bg-panel border border-card rounded-2xl p-5 flex flex-col gap-3">
                {[
                  { icon: ShieldCheck, label: "Secure & Encrypted Checkout"    },
                  { icon: Truck,       label: "Islandwide Delivery Available"   },
                  { icon: Package,     label: "Careful Packaging Guaranteed"    },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-gold-ink flex-shrink-0" />
                    <span className="text-[10px] uppercase tracking-widest text-muted font-bold">{label}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ═══════════ MOBILE STICKY BOTTOM BAR ═══════════ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-page/95 backdrop-blur-xl border-t-2 border-gold-ink px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <div className="text-[9px] uppercase tracking-widest text-muted font-bold">Total Due</div>
            <div className="text-xl font-black text-gold-ink">{formatLKR(finalTotal)}</div>
          </div>
          <div className="text-[10px] text-muted">{itemCount} item{itemCount !== 1 ? "s" : ""}</div>
        </div>
        <button
          onClick={
            currentStep === "contact" ? () => proceedToStep("address") :
            currentStep === "address" ? () => proceedToStep("payment") :
            handleSubmit
          }
          disabled={isSubmitting}
          className="w-full bg-gold text-black h-14 rounded-xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50"
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
          <div className="w-full max-w-sm rounded-2xl bg-panel p-8 border border-card shadow-2xl flex flex-col gap-5">
            <div>
              <h3 className="text-xl font-bold text-ink">Verify Your Email</h3>
              <p className="text-[11px] text-muted mt-1">
                Enter the 4-digit code sent to <span className="text-gold-ink">{formData.email}</span>.
              </p>
            </div>
            <input type="text" value={otpModal.code}
              onChange={(e) => setOtpModal((prev) => ({ ...prev, code: e.target.value }))}
              placeholder="0000" maxLength={4}
              className="w-full h-16 rounded-xl bg-page border border-card focus:border-gold-ink text-center text-3xl tracking-[0.6em] text-ink font-black outline-none"
            />
            {!otpModal.sent ? (
              <button onClick={sendGuestOtp} disabled={otpModal.sending}
                className="w-full bg-gold text-black h-12 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {otpModal.sending ? <><Loader2 className="animate-spin" size={14} /> Sending...</> : "Send Code"}
              </button>
            ) : (
              <button onClick={verifyGuestOtp} disabled={otpModal.verifying}
                className="w-full bg-gold text-black h-12 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {otpModal.verifying ? <><Loader2 className="animate-spin" size={14} /> Verifying...</> : "Verify & Place Order"}
              </button>
            )}
            <button
              onClick={() => setOtpModal({ open: false, sending: false, sent: false, code: "", verifying: false })}
              className="text-muted text-[10px] font-bold uppercase tracking-widest hover:text-ink transition-colors text-center"
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