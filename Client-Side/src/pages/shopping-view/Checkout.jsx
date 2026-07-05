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

const PAYHERE_FORM_FIELDS = [
  "merchant_id",
  "return_url",
  "cancel_url",
  "notify_url",
  "order_id",
  "items",
  "currency",
  "amount",
  "first_name",
  "last_name",
  "email",
  "phone",
  "address",
  "city",
  "country",
  "hash",
];

const storePayHereContext = (orderId, reference, email) => {
  try {
    if (reference) window.sessionStorage.setItem(`payhere_ref_${orderId}`, reference);
    if (email) window.sessionStorage.setItem(`payhere_email_${orderId}`, email);
    window.sessionStorage.setItem(`payhere_started_${orderId}`, "1");
  } catch {
    // Non-fatal: the return page can still show a generic confirmation state.
  }
};

const redirectToPayHere = (checkoutUrl, payment) => {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = checkoutUrl;
  PAYHERE_FORM_FIELDS.forEach((key) => {
    const value = payment?.[key];
    if (value === undefined || value === null) return;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
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
  const [currentStep, setCurrentStep] = useState("contact"); // retained for legacy step helpers
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
    { id: "contact", label: "Contact Information", num: 1 },
    { id: "address", label: "Delivery Address", num: 2 },
    { id: "delivery", label: "Delivery Method", num: 3 },
    { id: "payment", label: "Payment", num: 4 },
    { id: "review", label: "Review Order", num: 5 },
  ];

  const sectionAnchorByStep = {
    contact: "checkout-contact",
    address: "checkout-delivery",
    payment: "checkout-payment",
  };

  const scrollToCheckoutSection = (sectionId) => {
    if (typeof document === "undefined") return;
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

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

  const proceedToStep = (stepId) => {
    if (stepId === "__legacy__") return;
    const currentIndex = checkoutSteps.findIndex((s) => s.id === currentStep);
    const targetIndex = checkoutSteps.findIndex((s) => s.id === stepId);

    // If going forward, validate current step
    if (targetIndex > currentIndex) {
      const nextErrors = validateStep(currentStep);
      if (Object.keys(nextErrors).length > 0) {
        toast({
          title: "Check your details",
          description: "Please complete the highlighted fields before continuing.",
          variant: "destructive",
        });
        return;
      }
    }

    setErrors({});
    setCurrentStep(stepId);
    
    // Smooth scroll to the active accordion on mobile or desktop
    if (typeof window !== "undefined") {
      setTimeout(() => {
        document.getElementById(`checkout-${stepId}`)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  const handleNextStep = () => {
    const currentIndex = checkoutSteps.findIndex((s) => s.id === currentStep);
    if (currentIndex < checkoutSteps.length - 1) {
      proceedToStep(checkoutSteps[currentIndex + 1].id);
    }
  };

  const getStepStatus = (stepId) => {
    const currentIndex = checkoutSteps.findIndex((s) => s.id === currentStep);
    const stepIndex = checkoutSteps.findIndex((s) => s.id === stepId);
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "future";
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
        scrollToCheckoutSection("checkout-contact");
      } else if (nextErrors.addressLine || nextErrors.city || nextErrors.district) {
        scrollToCheckoutSection("checkout-delivery");
      } else if (nextErrors.termsAccepted) {
        scrollToCheckoutSection("checkout-payment");
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

    // Guest + bank transfer check removed as per requirements.

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
      const payHere = response?.payHere || null;

      if (isCardPayment && payHere?.checkoutUrl && payHere?.payment) {
        storePayHereContext(newOrderId, payHere.referenceNumber, guestEmailReturned);
        redirectToPayHere(payHere.checkoutUrl, payHere.payment);
        return;
      }

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


  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  
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

        {/* ═══════════ MOBILE HORIZONTAL STEPPER ═══════════ */}
        <div className="lg:hidden mb-10 overflow-x-auto pb-2">
          <div className="flex items-center min-w-max px-2">
            {checkoutSteps.map((step, idx) => {
              const status = getStepStatus(step.id);
              return (
                <React.Fragment key={step.id}>
                  <button
                    type="button"
                    onClick={() => proceedToStep(step.id)}
                    className="flex flex-col items-center gap-2 min-w-[80px]"
                  >
                    <div className={[
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300",
                      status === "completed" ? "bg-gold border-gold-ink text-black" :
                      status === "active" ? "bg-transparent border-gold-ink text-gold-ink" :
                                 "bg-transparent border-elevated text-line"
                    ].join(" ")}>
                      {status === "completed" ? <Check size={14} /> : step.num}
                    </div>
                    <span className={[
                      "text-[9px] uppercase tracking-widest font-bold",
                      status === "active" ? "text-gold-ink" : status === "completed" ? "text-ink-2" : "text-line"
                    ].join(" ")}>
                      {step.label}
                    </span>
                  </button>
                  {idx < checkoutSteps.length - 1 && (
                    <div
                      className={[
                        "h-[2px] mx-2 rounded-full transition-colors duration-500",
                        status === "completed" ? "bg-gold" : "bg-card"
                      ].join(" ")}
                      style={{ minWidth: 24, flex: 1 }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ═══════════ MAIN GRID ═══════════ */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start relative">

          {/* LEFT PANEL: TIMELINE & ACCORDION */}
          <div className="w-full lg:w-[60%] flex flex-col relative z-0">
            {checkoutSteps.map((step, index) => {
              const status = getStepStatus(step.id);
              
              return (
                <div key={step.id} className="flex relative lg:mb-4" id={`checkout-${step.id}`}>
                  {/* Vertical Line for Desktop Timeline */}
                  {index < checkoutSteps.length - 1 && (
                    <div className="hidden lg:block absolute left-4 top-10 bottom-[-2rem] w-[2px] z-[-1] bg-card">
                       {/* Completed Progress Line */}
                       <div className="w-full transition-all duration-500 bg-gold" style={{ height: status === "completed" ? "100%" : "0%" }} />
                    </div>
                  )}

                  {/* Desktop Timeline Circle */}
                  <div className="hidden lg:flex flex-col items-center mr-6 z-10 pt-1">
                    <div className={[
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300",
                      status === "completed" ? "bg-gold border-gold-ink text-black" :
                      status === "active" ? "bg-page border-gold-ink text-gold-ink" :
                                 "bg-page border-elevated text-line"
                    ].join(" ")}>
                      {status === "completed" ? <Check size={14} /> : step.num}
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0 w-full mb-8 lg:mb-10">
                    <AnimatePresence mode="wait">
                      {status === "future" && (
                        <motion.h2 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-xl font-bold text-line py-1.5 hidden lg:block"
                        >
                          {step.label}
                        </motion.h2>
                      )}

                      {status === "completed" && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="bg-panel border border-card rounded-2xl p-5 md:p-6 flex justify-between items-start"
                        >
                          <div>
                            <h3 className="text-sm font-bold text-ink-2 mb-3 lg:hidden flex items-center gap-2">
                              <Check size={16} className="text-gold-ink" /> {step.label}
                            </h3>
                            
                            {step.id === "contact" && (
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-bold text-ink-2">{formData.fullName}</span>
                                <span className="text-sm text-muted">{formData.phone}</span>
                                <span className="text-sm text-muted">{formData.email}</span>
                              </div>
                            )}

                            {step.id === "address" && (
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-bold text-ink-2">{formData.addressLine || formData.permStreet}</span>
                                <span className="text-sm text-muted">
                                  {formData.city || formData.permCity}, {formData.district || formData.permDistrict} {formData.postalCode || formData.permPostalCode}
                                </span>
                              </div>
                            )}

                            {step.id === "delivery" && (
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-bold text-ink-2">{DELIVERY_METHODS.find(m => m.id === formData.deliveryMode)?.label}</span>
                                <span className="text-sm text-muted">{shippingFee === 0 ? "FREE" : formatLKR(shippingFee)}</span>
                              </div>
                            )}

                            {step.id === "payment" && (
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-bold text-ink-2">{PAYMENT_METHODS.find(m => m.id === formData.paymentMethod)?.label}</span>
                              </div>
                            )}
                          </div>
                          
                          <button 
                            onClick={() => proceedToStep(step.id)} 
                            className="text-[10px] uppercase tracking-widest font-bold text-gold-ink hover:underline p-2 -m-2"
                          >
                            Edit
                          </button>
                        </motion.div>
                      )}

                      {status === "active" && (
                        <motion.div
                           initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                           className="overflow-hidden"
                        >
                          <div className="bg-panel border border-card rounded-2xl p-6 md:p-8 flex flex-col gap-6">
                            <h2 className="text-xl font-bold text-ink-2 mb-2 lg:hidden">{step.label}</h2>
                            <h2 className="text-xl font-bold text-ink-2 mb-2 hidden lg:block">{step.label}</h2>
                            
                            {/* ACTIVE STEP FORMS */}
                            {step.id === "contact" && (
                              <div className="flex flex-col gap-6">
                                {!isAuthenticated && (
                                  <div className="p-4 rounded-xl border border-line/60 bg-page flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div>
                                      <h4 className="font-bold text-ink-2 text-sm">Already have an account?</h4>
                                      <p className="text-[11px] text-muted mt-0.5">Sign in for faster checkout.</p>
                                    </div>
                                    <Link to="/auth/login" className="whitespace-nowrap px-6 py-2 rounded-xl border border-gold-ink text-gold-ink font-bold uppercase tracking-widest text-[10px] hover:bg-gold/10 transition-colors flex-shrink-0">
                                      Sign In
                                    </Link>
                                  </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="md:col-span-2 flex flex-col gap-1.5">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted">Full Name *</label>
                                    <input type="text" value={formData.fullName} onChange={(e) => updateField("fullName")(e)} placeholder="Your full name" className={["h-14 rounded-xl bg-page border px-4 text-ink-2 placeholder-line outline-none transition-colors", errors.fullName ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")} />
                                    {errors.fullName && <span className="text-[10px] text-danger-ink">{errors.fullName}</span>}
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted">Email Address *</label>
                                    <input type="email" value={formData.email} onChange={handleEmailChange} readOnly={isAuthenticated} onBlur={() => { if (!isAuthenticated) fetchGuestAddresses(formData.email); }} placeholder="you@example.com" className={["h-14 rounded-xl bg-page border px-4 text-ink-2 placeholder-line outline-none transition-colors", errors.email ? "border-danger-ink" : "border-card focus:border-gold-ink", isAuthenticated ? "opacity-60 cursor-not-allowed" : ""].join(" ")} />
                                    {errors.email && <span className="text-[10px] text-danger-ink">{errors.email}</span>}
                                    {errors.emailHint && <span className="text-[10px] text-gold-ink">💡 {errors.emailHint}</span>}
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted">Phone Number *</label>
                                    <input type="tel" value={formData.phone} inputMode="tel" onChange={handlePhoneChange} onBlur={handlePhoneBlur} placeholder="07X XXX XXXX" className={["h-14 rounded-xl bg-page border px-4 text-ink-2 placeholder-line outline-none transition-colors", errors.phone ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")} />
                                    {errors.phone && <span className="text-[10px] text-danger-ink">{errors.phone}</span>}
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted">Alt. Phone <span className="normal-case font-normal text-line">(Optional)</span></label>
                                    <input type="tel" value={formData.alternativePhone} inputMode="tel" onChange={handleAlternativePhoneChange} onBlur={handleAlternativePhoneBlur} placeholder="07X XXX XXXX" className={["h-14 rounded-xl bg-page border px-4 text-ink-2 placeholder-line outline-none transition-colors", errors.alternativePhone ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")} />
                                    {errors.alternativePhone && <span className="text-[10px] text-danger-ink">{errors.alternativePhone}</span>}
                                  </div>
                                </div>
                              </div>
                            )}

                            {step.id === "address" && (
                              <div className="flex flex-col gap-6">
                                {savedAddresses.length > 0 && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                                    {savedAddresses.map((addr, i) => (
                                      <div key={i} onClick={() => { applySavedAddress(addr); setUseNewAddress(false); }} className={["p-4 rounded-xl border cursor-pointer transition-all", !useNewAddress ? "border-gold-ink bg-gold/5" : "border-card bg-page hover:border-line"].join(" ")}>
                                        <div className="text-xs font-bold text-ink-2 mb-1">{addr.label || "Saved Address"}</div>
                                        <div className="text-[10px] text-muted">{addr.street}, {addr.city}</div>
                                      </div>
                                    ))}
                                    <div onClick={() => setUseNewAddress(true)} className={["p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-center", useNewAddress ? "border-gold-ink text-gold-ink" : "border-card text-line hover:border-line"].join(" ")}>
                                      <span className="text-xs font-bold uppercase tracking-widest">+ New Address</span>
                                    </div>
                                  </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="md:col-span-2 flex flex-col gap-1.5">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted">Street Address *</label>
                                    <input type="text" value={formData.permStreet} onChange={updatePermField("permStreet")} placeholder="No. 12, Main Street" className={["h-14 rounded-xl bg-page border px-4 text-ink-2 placeholder-line outline-none transition-colors", formData.sameAsPermanent && errors.addressLine ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")} />
                                    {formData.sameAsPermanent && errors.addressLine && <span className="text-[10px] text-danger-ink">{errors.addressLine}</span>}
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted">City *</label>
                                    <input type="text" value={formData.permCity} onChange={updatePermField("permCity")} placeholder="Colombo" className={["h-14 rounded-xl bg-page border px-4 text-ink-2 placeholder-line outline-none transition-colors", formData.sameAsPermanent && errors.city ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")} />
                                    {formData.sameAsPermanent && errors.city && <span className="text-[10px] text-danger-ink">{errors.city}</span>}
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted">District *</label>
                                    <div className="relative">
                                      <select value={formData.permDistrict} onChange={updatePermField("permDistrict")} className={["w-full h-14 rounded-xl bg-page border px-4 text-ink-2 outline-none transition-colors appearance-none cursor-pointer pr-10", formData.sameAsPermanent && errors.district ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")}>
                                        <option value="">Select District</option>
                                        {SRI_LANKA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                                      </select>
                                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                                    </div>
                                    {formData.sameAsPermanent && errors.district && <span className="text-[10px] text-danger-ink">{errors.district}</span>}
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted">Postal Code *</label>
                                    <input type="text" value={formData.permPostalCode} onChange={updatePermField("permPostalCode")} placeholder="10100" className={["h-14 rounded-xl bg-page border px-4 text-ink-2 placeholder-line outline-none transition-colors", formData.sameAsPermanent && errors.postalCode ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")} />
                                    {formData.sameAsPermanent && errors.postalCode && <span className="text-[10px] text-danger-ink">{errors.postalCode}</span>}
                                  </div>
                                </div>

                                <label className="flex items-start gap-3 cursor-pointer select-none rounded-xl border border-card bg-page p-4 hover:border-line transition-colors mt-2">
                                  <input type="checkbox" checked={!!formData.sameAsPermanent} onChange={(e) => toggleSameAsPermanent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-gold cursor-pointer" />
                                  <span className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-ink-2">Delivery address is same as permanent address</span>
                                    <span className="text-[10px] text-muted">Untick to ship this order somewhere else.</span>
                                  </span>
                                </label>

                                {!formData.sameAsPermanent && (
                                  <div className="flex flex-col gap-4 rounded-xl border border-gold-ink/20 bg-gold/[0.02] p-4 md:p-5">
                                    <h3 className="text-sm font-bold text-ink-2">Alternative Delivery Address</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="md:col-span-2 flex flex-col gap-1.5">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted">Street Address *</label>
                                        <input type="text" value={formData.addressLine} onChange={(e) => updateField("addressLine")(e)} placeholder="No. 12, Main Street" className={["h-14 rounded-xl bg-page border px-4 text-ink-2 placeholder-line outline-none transition-colors", errors.addressLine ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")} />
                                        {errors.addressLine && <span className="text-[10px] text-danger-ink">{errors.addressLine}</span>}
                                      </div>
                                      <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted">City *</label>
                                        <input type="text" value={formData.city} onChange={(e) => updateField("city")(e)} placeholder="Colombo" className={["h-14 rounded-xl bg-page border px-4 text-ink-2 placeholder-line outline-none transition-colors", errors.city ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")} />
                                        {errors.city && <span className="text-[10px] text-danger-ink">{errors.city}</span>}
                                      </div>
                                      <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted">District *</label>
                                        <div className="relative">
                                          <select value={formData.district} onChange={(e) => updateField("district")(e)} className={["w-full h-14 rounded-xl bg-page border px-4 text-ink-2 outline-none transition-colors appearance-none cursor-pointer pr-10", errors.district ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")}>
                                            <option value="">Select District</option>
                                            {SRI_LANKA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                                          </select>
                                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                                        </div>
                                        {errors.district && <span className="text-[10px] text-danger-ink">{errors.district}</span>}
                                      </div>
                                      <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted">Postal Code *</label>
                                        <input type="text" value={formData.postalCode} onChange={(e) => updateField("postalCode")(e)} placeholder="10100" className={["h-14 rounded-xl bg-page border px-4 text-ink-2 placeholder-line outline-none transition-colors", errors.postalCode ? "border-danger-ink" : "border-card focus:border-gold-ink"].join(" ")} />
                                        {errors.postalCode && <span className="text-[10px] text-danger-ink">{errors.postalCode}</span>}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {step.id === "delivery" && (
                              <div className="flex flex-col gap-4">
                                {DELIVERY_METHODS.map((method) => {
                                  const Icon = method.icon;
                                  const isSelected = formData.deliveryMode === method.id;
                                  
                                  return (
                                    <label
                                      key={method.id}
                                      className={["relative flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border cursor-pointer transition-all", isSelected ? "border-gold-ink bg-gold/5" : "border-card bg-page hover:border-line"].join(" ")}
                                    >
                                      <div className="flex items-start gap-4">
                                        <div className={["mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border", isSelected ? "border-gold-ink" : "border-muted"].join(" ")}>
                                          {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-gold-ink" />}
                                        </div>
                                        <div className="flex flex-col">
                                          <div className="flex items-center gap-2">
                                            <Icon className={["h-4 w-4", isSelected ? "text-gold-ink" : "text-muted"].join(" ")} />
                                            <span className={["text-sm font-bold", isSelected ? "text-ink-2" : "text-muted"].join(" ")}>{method.label}</span>
                                          </div>
                                          <p className="mt-1 text-[11px] text-muted">{method.desc}</p>
                                          <p className="mt-2 text-xs font-bold text-gold-ink sm:hidden">
                                            {method.id === "pickup" ? "FREE" : method.id === "standard" && isFreeShippingQualify ? "FREE" : formatLKR(method.id === "standard" ? standardFee : method.price)}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="mt-4 sm:mt-0 sm:text-right ml-9 sm:ml-0 flex flex-col sm:items-end">
                                        <span className="hidden sm:block text-sm font-bold text-gold-ink">
                                          {method.id === "pickup" ? "FREE" : method.id === "standard" && isFreeShippingQualify ? "FREE" : formatLKR(method.id === "standard" ? standardFee : method.price)}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-widest text-muted mt-1">
                                          {isFastDistrict ? method.fastEta : method.eta}
                                        </span>
                                      </div>
                                      <input type="radio" name="deliveryMode" value={method.id} checked={isSelected} onChange={(e) => updateField("deliveryMode")(e)} className="hidden" />
                                    </label>
                                  );
                                })}
                              </div>
                            )}

                            {step.id === "payment" && (
                              <div className="flex flex-col gap-4">
                                {PAYMENT_METHODS.map((method) => {
                                  const Icon = method.icon;
                                  const isSelected = formData.paymentMethod === method.id;

                                  return (
                                    <div key={method.id} className="flex flex-col gap-0">
                                      <label className={["relative flex items-start gap-4 p-5 rounded-xl border cursor-pointer transition-all", isSelected ? "border-gold-ink bg-gold/5 rounded-b-none border-b-transparent" : "border-card bg-page hover:border-line"].join(" ")}>
                                        <div className={["mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border", isSelected ? "border-gold-ink" : "border-muted"].join(" ")}>
                                          {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-gold-ink" />}
                                        </div>
                                        <div className="flex flex-col flex-1">
                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className={["text-sm font-bold", isSelected ? "text-ink-2" : "text-muted"].join(" ")}>{method.label}</span>
                                            {method.badge && <span className="rounded bg-gold/10 px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold text-gold-ink">{method.badge}</span>}
                                          </div>
                                          <span className="mt-1 text-[11px] text-muted">{method.sublabel}</span>
                                        </div>
                                        <Icon className={["h-5 w-5 shrink-0", isSelected ? "text-gold-ink" : "text-muted"].join(" ")} />
                                        <input type="radio" name="paymentMethod" value={method.id} checked={isSelected} onChange={(e) => updateField("paymentMethod")(e)} className="hidden" />
                                      </label>
                                      
                                      {/* Expanded content for Manual Bank Transfer */}
                                      <AnimatePresence>
                                        {isSelected && method.id === "manual_bank_transfer" && (
                                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                            <div className="border border-t-0 border-gold-ink/30 bg-gold/[0.02] rounded-b-xl p-5 pt-2">
                                              <p className="text-[11px] text-muted mb-4">{method.description}</p>
                                              <div className="flex flex-col gap-2 p-4 bg-page rounded-lg border border-card">
                                                <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest text-muted">Bank</span><span className="text-xs font-bold text-ink-2">{displayBankDetails.bankName}</span></div>
                                                <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest text-muted">Branch</span><span className="text-xs font-bold text-ink-2">{displayBankDetails.branch}</span></div>
                                                <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest text-muted">Name</span><span className="text-xs font-bold text-ink-2">{displayBankDetails.accountName}</span></div>
                                                <div className="flex justify-between items-center">
                                                  <span className="text-[10px] uppercase tracking-widest text-muted">Acc No</span>
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-gold-ink font-mono">{displayBankDetails.accountNumber}</span>
                                                    <button type="button" onClick={() => copyToClipboard(displayBankDetails.accountNumber)} className="p-1 text-muted hover:text-gold-ink transition-colors"><Copy className="w-3 h-3" /></button>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}

                                <div className="mt-4 pt-4 border-t border-card flex flex-col gap-2">
                                  <label className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" checked={formData.termsAccepted} onChange={(e) => updateField("termsAccepted")(e)} className="mt-0.5 h-4 w-4 accent-gold" />
                                    <span className="text-[11px] text-muted leading-tight">
                                      I have read and agree to the <Link to="/legal/terms" className="text-gold-ink hover:underline" target="_blank">Terms & Conditions</Link>, <Link to="/legal/privacy" className="text-gold-ink hover:underline" target="_blank">Privacy Policy</Link>, and <Link to="/legal/shipping" className="text-gold-ink hover:underline" target="_blank">Shipping Policy</Link>.
                                    </span>
                                  </label>
                                  {errors.termsAccepted && <span className="text-[10px] text-danger-ink">{errors.termsAccepted}</span>}
                                </div>
                              </div>
                            )}

                            {step.id === "review" && (
                              <div className="flex flex-col gap-6">
                                <div className="rounded-xl border border-gold-ink/20 bg-gold/[0.02] p-5">
                                  <h3 className="text-xs font-bold uppercase tracking-widest text-gold-ink mb-2">Final Review</h3>
                                  <p className="text-sm text-muted mb-4">Please check your details in the order summary on the right (or bottom) before placing your order.</p>
                                  <div className="text-sm text-ink-2 flex justify-between border-b border-card pb-2">
                                    <span>Total to pay:</span>
                                    <span className="font-bold text-gold-ink">{formatLKR(finalTotal)}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Continue Button for each step */}
                            <button
                              type="button"
                              onClick={step.id === "review" ? handleSubmit : handleNextStep}
                              disabled={isSubmitting}
                              className="mt-2 h-14 w-full rounded-xl bg-gold text-black font-bold uppercase tracking-widest hover:bg-gold-ink transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {isSubmitting ? (
                                <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                              ) : step.id === "review" ? (
                                formData.paymentMethod === "card" ? <><CreditCard className="w-5 h-5"/> Pay Securely via PayHere</> : <><Check className="w-5 h-5"/> Confirm Order</>
                              ) : (
                                "Continue"
                              )}
                            </button>
                            
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT PANEL: STICKY ORDER SUMMARY */}
          <div className="w-full lg:w-[40%] max-w-[420px] ml-auto">
            <div className="sticky top-24 rounded-2xl border border-card bg-panel p-6 flex flex-col gap-6 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-ink-2 flex justify-between items-center">
                Order Summary
                <span className="text-[10px] text-muted normal-case">{itemCount} items</span>
              </h3>

              {/* Items List */}
              <div className="flex flex-col gap-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {checkoutItems.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="relative w-20 h-24 bg-page rounded-xl border border-card overflow-hidden flex-shrink-0">
                      <img src={getVariantImage(item.product, item.variant?.color)} alt={item.product?.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <span className="absolute top-1 right-1 bg-gold text-black w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black">{item.quantity}</span>
                    </div>
                    <div className="flex-1 flex flex-col py-1 min-w-0">
                      <h4 className="text-sm font-bold text-ink-2 line-clamp-2 leading-tight mb-1">{item.product?.name}</h4>
                      <div className="text-[10px] text-muted uppercase tracking-widest mb-auto">
                        {[item.variant?.size, item.variant?.color].filter(Boolean).join(" · ")}
                      </div>
                      <div className="flex items-end justify-between mt-2">
                        <div className="text-sm font-bold text-gold-ink">{formatLKR(item.unitPrice * item.quantity)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reward/Coupon */}
              <div className="border-t border-card pt-6">
                {!appliedCoupon ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-ink-2">Gift Card or Reward Code</span>
                      <button type="button" onClick={() => setCouponExpanded(!couponExpanded)} className="text-[10px] text-gold-ink hover:underline uppercase tracking-widest font-bold">
                        {couponExpanded ? "Cancel" : "Add"}
                      </button>
                    </div>
                    <AnimatePresence>
                      {couponExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex gap-2 overflow-hidden">
                          <input type="text" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Enter code" className="h-12 flex-1 rounded-xl bg-page border border-card px-4 text-sm text-ink-2 outline-none focus:border-gold-ink transition-colors uppercase placeholder:normal-case" />
                          <button type="button" onClick={() => applyCouponCode(couponInput)} disabled={couponApplying || !couponInput.trim()} className="h-12 px-6 rounded-xl bg-ink-2 text-page font-bold text-xs uppercase tracking-widest hover:bg-gold-ink hover:text-black transition-colors disabled:opacity-50">
                            Apply
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* Render suggested rewards */}
                    {rewardSuggestions.length > 0 && !couponExpanded && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {rewardSuggestions.map(r => (
                          <button key={r.code} type="button" onClick={() => applyCouponCode(r.code)} className="px-3 py-1.5 rounded border border-gold-ink/30 bg-gold/5 text-[10px] text-gold-ink font-bold hover:bg-gold/10 transition-colors">
                            Apply {r.code}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gold/10 border border-gold-ink/30">
                    <div className="flex items-center gap-3">
                      <Gift className="w-5 h-5 text-gold-ink" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gold-ink">{appliedCoupon.code}</span>
                        <span className="text-[10px] text-muted">{appliedCoupon.title}</span>
                      </div>
                    </div>
                    <button type="button" onClick={removeCoupon} className="text-muted hover:text-danger-ink transition-colors p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="border-t border-card pt-6 flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="text-ink-2 font-bold">{formatLKR(checkoutTotal)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm group">
                  <div className="flex items-center gap-1.5 text-muted">
                    <span>Delivery</span>
                    {activeZone && formData.deliveryMode !== "pickup" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-card group-hover:bg-line/40 transition-colors">{activeZone.name}</span>
                    )}
                  </div>
                  <span className="text-ink-2 font-bold">{shippingFee === 0 ? "FREE" : formatLKR(shippingFee)}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm text-green-400">
                    <span>Reward Discount</span>
                    <span className="font-bold">-{formatLKR(couponDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-end mt-4 pt-4 border-t border-gold-ink/20">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-ink-2">Total</span>
                    <span className="text-[10px] text-muted">Including taxes</span>
                  </div>
                  <span className="text-2xl font-bold text-gold-ink">{formatLKR(finalTotal)}</span>
                </div>
              </div>
              
              {/* Trust badges */}
              <div className="mt-2 flex flex-col gap-3 p-4 rounded-xl bg-page border border-card">
                 <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-gold-ink shrink-0" />
                    <span className="text-[10px] text-muted">Secure Encrypted Checkout</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <Truck className="w-4 h-4 text-gold-ink shrink-0" />
                    <span className="text-[10px] text-muted">Nationwide Delivery across SL</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gold-ink shrink-0" />
                    <span className="text-[10px] text-muted">24/7 Dedicated Support</span>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
