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
import VariantSelectors, {
  getColorsForSize,
  getProductSizes,
  getVariantBySelection,
} from "@/components/shopping-components/VariantSelectors";
import { Loader2, Minus, Plus, Trash2, CreditCard, Building2, AlertCircle, UploadCloud } from "lucide-react";
import { compressImageFile } from "@/lib/image-compression";

const API_BASE = `${import.meta.env.VITE_API_URL}/v1`;
const BUY_NOW_STORAGE_KEY = "saga_buy_now_checkout";
const MANUAL_BANK_DETAILS = {
  bankName: "Sampath Bank",
  branch: "Hatton",
  accountName: "N.Gayathree",
  accountNumber: "108052612262",
  whatsapp: "+94 77 070 4274",
  deadline: "Pay within 24 hours to confirm your order.",
};

const buildManualPaymentPath = (paymentSlug) =>
  paymentSlug
    ? `/shopping/manual-payment/${encodeURIComponent(paymentSlug)}`
    : "/shopping/manual-payment";

const getErrorMessage = (error, fallback) =>
  typeof error === "string" ? error : error?.message || fallback;

const getDiscountedUnitPrice = (product = {}, variant = {}) => {
  const basePrice =
    Number(product?.basePrice || 0) + Number(variant?.priceAdjustment || 0);

  return Math.round(
    basePrice * (1 - Number(product?.discountPercent || 0) / 100)
  );
};

const normalizeBuyNowItem = (item) => {
  if (!item?.product || !item?.variant) {
    return null;
  }

  const variant = normalizeCheckoutVariant(item.variant);
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const unitPrice = getDiscountedUnitPrice(item.product, variant);

  return {
    id: `buynow-${item.product.id || item.product._id}-${variant.sku}`,
    product: item.product,
    variant,
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

const getVariantId = (variant = {}) => variant?.id || variant?._id || "";

const normalizeCheckoutVariant = (variant = {}) => ({
  id: getVariantId(variant),
  sku: variant?.sku || "",
  size: variant?.size || "",
  color: variant?.color || "",
  stock: Number(variant?.stock ?? 0),
  priceAdjustment: Number(variant?.priceAdjustment || 0),
});

const buildCheckoutItem = (item, variantOverride) => {
  const variant = normalizeCheckoutVariant(variantOverride || item?.variant);
  const quantity = Math.max(1, Number(item?.quantity) || 1);
  const unitPrice = getDiscountedUnitPrice(item?.product, variant);

  return {
    ...item,
    variant,
    quantity,
    unitPrice,
    subTotal: unitPrice * quantity,
  };
};

const buildBuyNowPersistencePayload = (item) => {
  if (!item?.product || !item?.variant?.sku) {
    return null;
  }

  return {
    product: item.product,
    variant: item.variant,
    quantity: item.quantity,
  };
};

const getCheckoutItemErrors = (item) => {
  const errors = {};
  const sizes = getProductSizes(item?.product);
  const colors = getColorsForSize(item?.product, item?.variant?.size);

  if (sizes.length > 0 && !item?.variant?.size) {
    errors.size = "Please choose a size.";
  }

  if (colors.length > 0 && !item?.variant?.color) {
    errors.color = "Please choose a color.";
  }

  if ((sizes.length > 0 || colors.length > 0) && !item?.variant?.sku) {
    errors.color = errors.color || "Please choose an available variant.";
  }

  return errors;
};

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { items, totalPrice, isLoading: cartIsLoading } = useSelector(
    (state) => state.cart.cart
  );

  const [formData, setFormData] = useState({
    shippingAddress: "",
    contactNumber: "",
    paymentMethod: "manual_bank_transfer",
    notes: "",
    guestEmail: "",
  });

  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });

  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState(null);
  const fileInputRef = useRef(null);

  const [checkoutItems, setCheckoutItems] = useState([]);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [isBuyNow, setIsBuyNow] = useState(false);
  const [hasInitializedSource, setHasInitializedSource] = useState(false);
  
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [guestCheckInfo, setGuestCheckInfo] = useState(null);
  const [isProcessingSelection, setIsProcessingSelection] = useState(false);
  const [variantErrorsByItem, setVariantErrorsByItem] = useState({});
  const [variantUpdateItemId, setVariantUpdateItemId] = useState(null);

  const locationState = useMemo(() => location.state || {}, [location.key]);
  const cartStateItems = useMemo(
    () => (Array.isArray(locationState.cartItems) ? locationState.cartItems : null),
    [locationState],
  );
  const routedBuyNowItem = useMemo(
    () => normalizeBuyNowItem(locationState.buyNowItem),
    [locationState],
  );

  useEffect(() => {
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
        location.state.cartTotal ||
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
  }, [cartStateItems, dispatch, routedBuyNowItem]);

  useEffect(() => {
    if (!hasInitializedSource || isBuyNow) return;

    setCheckoutItems(items);
    setCheckoutTotal(totalPrice);
  }, [hasInitializedSource, isBuyNow, items, totalPrice]);

  useEffect(() => {
    setCheckoutTotal(
      checkoutItems.reduce(
        (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
        0
      )
    );

    if (isBuyNow) {
      persistBuyNowItem(buildBuyNowPersistencePayload(checkoutItems[0]));
    }
  }, [checkoutItems, isBuyNow]);

  // ---------------- CART ACTIONS ----------------
  const handleQuantityChange = async (item, quantity) => {
    if (isBuyNow) return;
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
        description: getErrorMessage(err, "Unable to update quantity."),
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (itemId) => {
    if (isBuyNow) return;
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
        description: getErrorMessage(err, "Unable to remove item."),
        variant: "destructive",
      });
    }
  };

  const updateCheckoutItemLocally = (itemId, updater) => {
    setCheckoutItems((currentItems) =>
      currentItems.map((entry) => {
        if (entry.id !== itemId) {
          return entry;
        }

        const nextItem = updater(entry);
        return buildCheckoutItem(nextItem, nextItem.variant);
      })
    );
  };

  const validateCheckoutItems = (itemsToValidate = checkoutItems) => {
    const nextErrors = {};

    itemsToValidate.forEach((item) => {
      const itemErrors = getCheckoutItemErrors(item);
      if (Object.keys(itemErrors).length > 0) {
        nextErrors[item.id] = itemErrors;
      }
    });

    setVariantErrorsByItem(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const syncCartVariant = async (item, nextVariant) => {
    if (isBuyNow || !nextVariant?.sku) {
      return;
    }

    setVariantUpdateItemId(item.id);

    try {
      await dispatch(
        updateCartItemAction({
          itemId: item.id,
          quantity: item.quantity,
          variantId: getVariantId(nextVariant),
        })
      ).unwrap();
    } catch (err) {
      toast({
        title: "Variant update failed",
        description: getErrorMessage(err, "Unable to update size or color."),
        variant: "destructive",
      });

      updateCheckoutItemLocally(item.id, () => buildCheckoutItem(item, item.variant));
    } finally {
      setVariantUpdateItemId(null);
    }
  };

  const applyVariantSelection = async (item, nextSize, nextColor) => {
    const resolvedVariant = nextSize && nextColor
      ? getVariantBySelection(item.product, nextSize, nextColor)
      : null;

    updateCheckoutItemLocally(item.id, (currentItem) => ({
      ...currentItem,
      variant: resolvedVariant
        ? normalizeCheckoutVariant(resolvedVariant)
        : {
            sku: "",
            size: nextSize || "",
            color: nextColor || "",
            stock: 0,
            priceAdjustment: 0,
            id: "",
          },
    }));

    setVariantErrorsByItem((current) => ({
      ...current,
      [item.id]: {},
    }));
    setFormError(null);

    if (resolvedVariant) {
      await syncCartVariant(item, normalizeCheckoutVariant(resolvedVariant));
    }
  };

  const handleSizeSelection = async (item, size) => {
    const nextColors = getColorsForSize(item.product, size);
    const preservedColor = nextColors.includes(item.variant?.color)
      ? item.variant.color
      : "";
    const nextColor =
      preservedColor || (nextColors.length === 1 ? nextColors[0] : "");

    await applyVariantSelection(item, size, nextColor);
  };

  const handleColorSelection = async (item, color) => {
    await applyVariantSelection(item, item.variant?.size, color);
  };

  // ---------------- FORM HANDLING ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCardChange = (e) => {
    let { name, value } = e.target;
    
    // Auto-format card number with spaces every 4 digits
    if (name === "cardNumber") {
      value = value.replace(/\D/g, '').substring(0, 16);
      value = value.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    }
    
    // Auto-format expiry date MM/YY
    if (name === "expiryDate") {
      value = value.replace(/\D/g, '').substring(0, 4);
      if (value.length >= 3) {
        value = `${value.substring(0, 2)}/${value.substring(2, 4)}`;
      }
    }
    
    if (name === "cvv") {
      value = value.replace(/\D/g, '').substring(0, 4);
    }

    setCardDetails((prev) => ({ ...prev, [name]: value }));
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const checkoutTotalAmount = checkoutItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const submitButtonLabel =
    formData.paymentMethod === "manual_bank_transfer"
      ? "Place Order & Get Reference"
      : "Complete Purchase";

  const handleFileChange = async (e) => {
    const originalFile = e.target.files?.[0];
    const file = await compressImageFile(originalFile);
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError("File size must be less than 5MB");
        return;
      }
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
      setFormError(null);
    }
  };

  const uploadReceipt = async () => {
    if (!receiptFile) return "";
    const fd = new FormData();
    fd.append("receipt", receiptFile);
    try {
      const res = await axios.post(`${API_BASE}/image/upload-receipt`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      return res.data?.data?.url || "";
    } catch (err) {
      throw new Error(getErrorMessage(err?.response?.data, "Failed to upload receipt"));
    }
  };

  const handleGuestChoice = async (choice) => {
    setIsProcessingSelection(true);
    setShowGuestDialog(false);
    
    if (choice === 'register') {
      try {
        await dispatch(registerGuestAction(formData.guestEmail)).unwrap();
        toast({
          title: "Account Created",
          description: "Temporary password sent to your email. You are now logged in.",
          variant: "success"
        });
        // After registration, proceed as authenticated user
        await proceedWithOrder();
      } catch (err) {
        toast({
          title: "Registration failed",
          description: getErrorMessage(err, "Could not create account."),
          variant: "destructive"
        });
        setIsProcessingSelection(false);
      }
    } else {
      // Proceed as one-time guest
      await proceedWithOrder();
    }
  };

  // ---------------- ORDER SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!checkoutItems.length) {
      setFormError("Your cart is empty.");
      return;
    }

    if (!validateCheckoutItems()) {
      setFormError("Please choose a valid size and color for each item.");
      return;
    }

    if (!isAuthenticated && !formData.guestEmail) {
      setFormError("Email address is required for guest checkout.");
      return;
    }

    if (!formData.shippingAddress || !formData.contactNumber) {
      setFormError("Shipping address and contact number are required.");
      return;
    }

    if (formData.paymentMethod === "manual" && !receiptFile) {
      setFormError("Please upload a receipt for manual payment.");
      return;
    }

    if (formData.paymentMethod === "card") {
      const { cardNumber, expiryDate, cvv, cardholderName } = cardDetails;
      if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
        setFormError("All card details are required.");
        return;
      }
      const rawCardNum = cardNumber.replace(/\s+/g, "");
      if (!/^\d{16}$/.test(rawCardNum)) {
        setFormError("Invalid card number. It must be 16 digits.");
        return;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
        setFormError("Invalid expiry date format. Use MM/YY.");
        return;
      }
      const [expMonth, expYear] = expiryDate.split("/");
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = parseInt(now.getFullYear().toString().slice(-2), 10);
      const expM = parseInt(expMonth, 10);
      const expY = parseInt(expYear, 10);
      if (expY < currentYear || (expY === currentYear && expM < currentMonth)) {
        setFormError("Card has expired.");
        return;
      }
      if (!/^\d{3,4}$/.test(cvv)) {
        setFormError("Invalid CVV format.");
        return;
      }
    }

    setFormError(null);

    // Client-side validation
    if (!checkoutItems || checkoutItems.length === 0) {
      setFormError("Your cart is empty. Please add items before checkout.");
      return;
    }
    if (!formData.shippingAddress.trim()) {
      setFormError("Shipping address is required.");
      return;
    }
    if (!formData.contactNumber.trim()) {
      setFormError("Contact number is required.");
      return;
    }
    if (!["payhere", "gpay", "manual", "manual_bank_transfer", "card", "lankapay", "cash"].includes(formData.paymentMethod)) {
      setFormError("Please select a valid payment method.");
      return;
    }

    setIsUploading(true);

    // If not authenticated, check guest status
    if (!isAuthenticated) {
      try {
        const guestRes = await dispatch(checkGuestAction(formData.guestEmail)).unwrap();
        if (guestRes.data.existsAsUser) {
          toast({
            title: "Account exists",
            description: "An account with this email already exists. Please log in.",
            variant: "destructive",
          });
          navigate("/auth/login", { state: { email: formData.guestEmail } });
          setIsUploading(false);
          return;
        }

        // Show dialog asking to register OR proceed as guest
        setGuestCheckInfo(guestRes.data);
        setShowGuestDialog(true);
        setIsUploading(false);
        return;
      } catch (err) {
        console.error("Guest check failed", err);
      }
    }

    await proceedWithOrder();
  };

  const proceedWithOrder = async () => {
    setIsUploading(true);
    try {
      if (!validateCheckoutItems()) {
        setFormError("Please choose a valid size and color for each item.");
        return;
      }

      let uploadedUrl = "";
      if (["manual", "manual_bank_transfer"].includes(formData.paymentMethod)) {
        uploadedUrl = await uploadReceipt();
        if (formData.paymentMethod === "manual" && !uploadedUrl) {
          setFormError("Receipt upload failed. Please try again.");
          return;
        }
      }

      // Simulate online gateway processing if needed
      if (["payhere", "gpay", "card", "lankapay"].includes(formData.paymentMethod)) {
        toast({
          title: `Processing via ${formData.paymentMethod.toUpperCase()}`,
          description: "Redirecting to gateway environment...",
        });
        await new Promise(resolve => setTimeout(resolve, 1500)); // simulated latency
      }

      const payload = {
        items: checkoutItems.map((item) => ({
          productId: item.product.id || item.product._id,
          variantSku: item.variant.sku,
          size: item.variant.size,
          color: item.variant.color,
          quantity: item.quantity,
        })),
        checkoutMode: isBuyNow ? "buyNow" : "cart",
        shippingAddress: formData.shippingAddress,
        contactNumber: formData.contactNumber,
        paymentMethod: formData.paymentMethod,
        paymentProofUrl:
          ["manual", "manual_bank_transfer"].includes(formData.paymentMethod)
            ? uploadedUrl
            : "",
        notes: formData.notes,
        guestEmail: !isAuthenticated ? formData.guestEmail : undefined,
      };

      const resultAction = await dispatch(createOrder(payload)).unwrap();
      const createdOrder = resultAction?.data || {};
      const createdOrderId = resultAction?.orderId || createdOrder._id || `TEM-${Math.floor(Math.random() * 100000)}`;
      const resolvedTotal = createdOrder.totalAmount || checkoutTotal || checkoutTotalAmount || totalAmount;
      if (!isBuyNow) {
        dispatch(fetchCartAction());
      }

      toast({
        title: "Order placed",
        description: "Your order was successfully submitted.",
        variant: "success",
      });

      persistBuyNowItem(null);

      if (formData.paymentMethod === "manual_bank_transfer") {
        const paymentReferenceResponse = await dispatch(
          generateManualPaymentReference({
            orderId: createdOrderId,
            amount: resolvedTotal,
          })
        ).unwrap();

        const manualPaymentData = paymentReferenceResponse?.data || {};
        const manualReference =
          paymentReferenceResponse?.referenceNumber ||
          manualPaymentData.referenceNumber ||
          manualPaymentData.manualPayment?.referenceNumber ||
          createdOrder.referenceNumber;
        const manualAmount =
          paymentReferenceResponse?.amount ||
          manualPaymentData.amount ||
          resolvedTotal;
        const manualOrderId =
          paymentReferenceResponse?.orderId ||
          manualPaymentData.orderId ||
          createdOrderId;

        dispatch(
          storeManualPaymentContext({
            orderId: manualOrderId,
            amount: manualAmount,
            slug:
              paymentReferenceResponse?.slug ||
              manualPaymentData.slug ||
              manualPaymentData.manualPayment?.slug ||
              null,
            referenceNumber: manualReference,
          })
        );

        navigate(
          buildManualPaymentPath(
            paymentReferenceResponse?.slug ||
              manualPaymentData.slug ||
              manualPaymentData.manualPayment?.slug
          ),
          {
            state: {
              orderId: manualOrderId,
              amount: manualAmount,
              slug:
                paymentReferenceResponse?.slug ||
                manualPaymentData.slug ||
                manualPaymentData.manualPayment?.slug ||
                null,
              referenceNumber: manualReference,
            },
          },
        );
        return;
      }

      navigate("/shopping/checkout-success", {
        state: {
          orderId: createdOrderId,
          totalAmount: resolvedTotal,
          referenceNumber: createdOrder.referenceNumber,
          paymentMethod: formData.paymentMethod,
        },
      });
    } catch (err) {
      toast({
        title: "Checkout failed",
        description: getErrorMessage(err, "Try again later."),
        variant: "destructive",
      });
      setFormError(getErrorMessage(err, "Checkout failed"));
    } finally {
      setIsUploading(false);
    }
  };

  // ---------------- LOADING ----------------
  if ((!hasInitializedSource || cartIsLoading) && !checkoutItems.length) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  // ---------------- EMPTY CART ----------------
  if (!checkoutItems.length) {
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
    <div className="min-h-screen bg-[#060606] text-white py-12 md:py-20 font-sans">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12 grid lg:grid-cols-[3fr_2fr] gap-16 items-start">

        {/* LEFT: FORM (Shipping & Payment) */}
        <div className="space-y-12 lg:space-y-16">
          <section>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-[#D4AF37]">Checkout</h1>
            <p className="text-gray-400">Review your items and complete your architectural acquisition.</p>
          </section>

          <form onSubmit={handleSubmit} className="space-y-12">
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">00</span>
                <h2 className="text-xl font-bold tracking-tight">Review Items</h2>
              </div>

              <div className="space-y-5">
                {checkoutItems.map((item) => {
                  const itemErrors = variantErrorsByItem[item.id] || {};
                  const isVariantUpdating = variantUpdateItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="rounded-[28px] border border-white/10 bg-[#0c0c0c] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.35)]"
                    >
                      <div className="flex flex-col gap-5 md:flex-row">
                        <div className="h-32 w-full overflow-hidden rounded-[24px] border border-white/10 bg-black/30 md:h-36 md:w-28 md:flex-shrink-0">
                          <img
                            src={item.product.image || item.product.images?.[0]?.url || "/LOGO.png"}
                            className="h-full w-full object-cover"
                            alt={item.product.name}
                          />
                        </div>

                        <div className="flex-1 space-y-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-lg font-semibold tracking-tight">{item.product.name}</p>
                              <p className="mt-1 text-xs uppercase tracking-[0.22em] text-gray-500">
                                Unit LKR {item.unitPrice}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f1d27a]">
                                Qty {item.quantity}
                              </span>
                              {!isBuyNow ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemove(item.id)}
                                  disabled={isVariantUpdating || isUploading}
                                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-red-300 transition-colors hover:bg-red-500/15"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove
                                </button>
                              ) : null}
                            </div>
                          </div>

                          <VariantSelectors
                            product={item.product}
                            selectedSize={item.variant?.size}
                            selectedColor={item.variant?.color}
                            onSizeChange={(size) => handleSizeSelection(item, size)}
                            onColorChange={(color) => handleColorSelection(item, color)}
                            errors={itemErrors}
                            disabled={isVariantUpdating || isUploading}
                          />

                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            {!isBuyNow ? (
                              <div className="inline-flex items-center rounded-full border border-white/10 bg-black/30 p-1">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                  disabled={item.quantity <= 1 || isVariantUpdating || isUploading}
                                  className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="flex h-11 min-w-12 items-center justify-center text-sm font-semibold">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                  disabled={item.quantity >= (item.variant?.stock || 1) || isVariantUpdating || isUploading}
                                  className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">
                                Buy now quantity: {item.quantity}
                              </p>
                            )}

                            <div className="text-right">
                              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                                Variant stock
                              </p>
                              <p className="text-sm font-semibold text-white">
                                {item.variant?.stock ?? 0} available
                              </p>
                              {isVariantUpdating ? (
                                <p className="mt-1 text-xs text-[#D4AF37]">Updating selection...</p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            
            {/* Guest Email (only for non-authenticated users) */}
            {!isAuthenticated && (
              <section className="space-y-8">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">01</span>
                  <h2 className="text-xl font-bold tracking-tight">Contact Information</h2>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                  <input
                    type="email"
                    name="guestEmail"
                    value={formData.guestEmail}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    className="bg-[#111] border-0 border-b border-gray-800 p-4 focus:ring-0 focus:border-[#D4AF37] focus:bg-[#1a1a1a] transition-all duration-300 text-white placeholder:text-gray-600 rounded-t-sm"
                    required
                  />
                  <p className="text-xs text-gray-500">We'll send your order confirmation and tracking details to this email.</p>
                </div>
              </section>
            )}
            
            {/* 01 Shipping Destination */}
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">02</span>
                <h2 className="text-xl font-bold tracking-tight">Shipping Destination</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Complete Address</label>
                  <input
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    placeholder="124 Architecture Boulevard, Metropolis, NY 10001"
                    className="bg-[#111] border-0 border-b border-gray-800 p-4 focus:ring-0 focus:border-[#D4AF37] focus:bg-[#1a1a1a] transition-all duration-300 text-white placeholder:text-gray-600 rounded-t-sm"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Contact Number</label>
                  <input
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="+94 77 123 4567"
                    className="bg-[#111] border-0 border-b border-gray-800 p-4 focus:ring-0 focus:border-[#D4AF37] focus:bg-[#1a1a1a] transition-all duration-300 text-white placeholder:text-gray-600 rounded-t-sm"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Notes (Optional)</label>
                  <input
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Delivery instructions..."
                    className="bg-[#111] border-0 border-b border-gray-800 p-4 focus:ring-0 focus:border-[#D4AF37] focus:bg-[#1a1a1a] transition-all duration-300 text-white placeholder:text-gray-600 rounded-t-sm"
                  />
                </div>
              </div>
            </section>

            {/* 02 Payment Method */}
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">03</span>
                <h2 className="text-xl font-bold tracking-tight">Payment Method</h2>
              </div>
              
              {/* Payment Choice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: "manual_bank_transfer", label: "Bank Transfer", icon: <Building2 className="w-6 h-6" /> },
                  { id: "card", label: "Card Payment", icon: <CreditCard className="w-6 h-6" /> }
                ].map(method => (
                  <div 
                    key={method.id}
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.id }))}
                    className={`p-6 border-2 rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                      formData.paymentMethod === method.id 
                        ? 'border-[#D4AF37] bg-[#0a0a0a] shadow-[0_0_20px_rgba(212,175,55,0.1)]' 
                        : 'border-transparent bg-[#111] opacity-60 hover:opacity-100 hover:bg-[#151515]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={formData.paymentMethod === method.id ? 'text-[#D4AF37]' : 'text-gray-400'}>
                        {method.icon}
                      </span>
                      <span className="font-bold">{method.label}</span>
                    </div>
                    {formData.paymentMethod === method.id ? (
                      <div className="w-4 h-4 rounded-full border-4 border-[#D4AF37]"></div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-600"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Dynamic Payment Fields */}
              <div className="bg-[#0a0a0a] rounded-xl p-8 space-y-8 border border-[#222] shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
                {formData.paymentMethod === "card" && (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Cardholder Name</label>
                      <input
                        name="cardholderName"
                        value={cardDetails.cardholderName}
                        onChange={(e) => setCardDetails(prev => ({ ...prev, cardholderName: e.target.value }))}
                        placeholder="John Doe"
                        className="bg-[#111] border-0 border-b border-gray-800 p-4 focus:ring-0 focus:border-[#D4AF37] focus:bg-[#1a1a1a] transition-all duration-300 text-white placeholder:text-gray-600 rounded-t-sm"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Card Number</label>
                      <div className="relative">
                        <input
                          name="cardNumber"
                          value={cardDetails.cardNumber}
                          onChange={handleCardChange}
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          className="w-full bg-[#111] border-0 border-b border-gray-800 p-4 pr-12 focus:ring-0 focus:border-[#D4AF37] focus:bg-[#1a1a1a] transition-all duration-300 text-white placeholder:text-gray-600 rounded-t-sm tracking-[0.2em]"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                          <CreditCard className="text-gray-500 w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Expiry Date</label>
                        <input
                          name="expiryDate"
                          value={cardDetails.expiryDate}
                          onChange={handleCardChange}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="bg-[#111] border-0 border-b border-gray-800 p-4 focus:ring-0 focus:border-[#D4AF37] focus:bg-[#1a1a1a] transition-all duration-300 text-white placeholder:text-gray-600 rounded-t-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">CVC</label>
                        <input
                          name="cvv"
                          value={cardDetails.cvv}
                          onChange={handleCardChange}
                          placeholder="123"
                          maxLength={4}
                          className="bg-[#111] border-0 border-b border-gray-800 p-4 focus:ring-0 focus:border-[#D4AF37] focus:bg-[#1a1a1a] transition-all duration-300 text-white placeholder:text-gray-600 rounded-t-sm"
                        />
                      </div>
                    </div>
                  </>
                )}

                {formData.paymentMethod === "manual_bank_transfer" && (
                  <div className="space-y-6">
                    <div className="bg-[#111] border border-gray-800 p-5 rounded-lg flex flex-col sm:flex-row justify-between gap-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 bg-[#D4AF37]/10 w-32 h-32 blur-3xl rounded-full"></div>
                       <div className="space-y-3 flex-1 relative z-10">
                        <h4 className="font-bold text-[#D4AF37] text-lg">Bank Information</h4>
                        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                          <span className="text-gray-400">Bank:</span>
                          <span className="font-medium">{MANUAL_BANK_DETAILS.bankName}</span>
                          
                          <span className="text-gray-400">Branch:</span>
                          <span className="font-medium">{MANUAL_BANK_DETAILS.branch}</span>
                          
                          <span className="text-gray-400">Account Name:</span>
                          <span className="font-medium">{MANUAL_BANK_DETAILS.accountName}</span>
                          
                          <span className="text-gray-400">Account No:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-black px-2 py-1 border border-gray-800 rounded">
                              {MANUAL_BANK_DETAILS.accountNumber}
                            </span>
                            <button 
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(MANUAL_BANK_DETAILS.accountNumber);
                                toast({ title: "Copied!", description: "Account number copied to clipboard." });
                              }}
                              className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black px-2 py-1 rounded transition-colors"
                            >
                              Copy
                            </button>
                          </div>

                          <span className="text-gray-400">WhatsApp:</span>
                          <span className="font-medium">{MANUAL_BANK_DETAILS.whatsapp}</span>
                        </div>
                        <div className="rounded-xl border border-[#D4AF37]/15 bg-[#D4AF37]/5 px-4 py-3 text-sm text-gray-300">
                          <p className="font-semibold text-[#D4AF37]">
                            You must place the order first to get your payment reference.
                          </p>
                          <p className="mt-1">
                            Step 1: place the order. Step 2: we show your unique reference. Step 3: make the bank transfer using that reference in the memo.
                          </p>
                          <p className="mt-2 text-amber-200">{MANUAL_BANK_DETAILS.deadline}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] ml-1">Upload Receipt (Optional)</label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[#D4AF37]', 'bg-[#1a1a1a]'); }}
                        onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-[#D4AF37]', 'bg-[#1a1a1a]'); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('border-[#D4AF37]', 'bg-[#1a1a1a]');
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleFileChange({ target: { files: [file] } });
                        }}
                        className="w-full bg-[#111] border border-dashed border-gray-700 hover:border-[#D4AF37] p-8 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer rounded-lg relative overflow-hidden group"
                      >
                         <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/jpeg,image/png,application/pdf"
                          onChange={handleFileChange}
                        />
                        {receiptPreview ? (
                           <div className="flex flex-col items-center z-10 relative">
                             {receiptFile?.type?.includes("image") ? (
                               <img src={receiptPreview} className="max-h-40 rounded border border-gray-700 shadow-md" alt="Receipt preview" />
                             ) : (
                                <div className="h-24 w-full px-8 flex items-center justify-center bg-black border border-gray-800 rounded">
                                  <UploadCloud className="w-8 h-8 text-[#D4AF37] mr-3" />
                                  <span className="text-sm truncate w-32">{receiptFile?.name}</span>
                                </div>
                             )}
                             <p className="text-xs text-[#D4AF37] mt-3 bg-black/80 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Change File</p>
                           </div>
                        ) : (
                          <>
                            <UploadCloud className="w-8 h-8 text-[#D4AF37]/70 group-hover:text-[#D4AF37] transition-colors" />
                            <div className="text-center text-sm text-gray-400">
                              <span className="font-semibold text-white block">Click to upload</span> or drag and drop
                              <p className="text-xs mt-1">JPG, PNG or PDF (Max 5MB)</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Error Message */}
            {formError && (
              <div className="p-4 bg-red-950/20 border border-red-900 border-l-4 border-l-red-500 flex items-center gap-3 rounded-r-lg">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-red-400 text-sm font-medium">{formError}</p>
              </div>
            )}

            {/* Submit Action for Mobile */}
            <div className="lg:hidden block pt-6">
              <button
                type="submit"
                disabled={isUploading}
                className="w-full bg-[#D4AF37] hover:bg-yellow-500 text-black py-4 rounded-lg font-extrabold tracking-tight text-lg transition-all flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(212,175,55,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? <Loader2 className="animate-spin w-6 h-6" /> : (
                  <>
                    {submitButtonLabel} <span className="text-lg">→</span>
                  </>
                )}
              </button>
            </div>
            
          </form>
        </div>

        {/* RIGHT: ORDER SUMMARY (Sticky Sidebar) */}
        <div className="w-full lg:sticky lg:top-32 hidden lg:block">
          <div className="bg-[#0a0a0a] rounded-xl p-8 border border-[#222] shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
            <h3 className="text-xl font-bold tracking-tight mb-8">Order Summary</h3>
            
            {/* Cart Items */}
            <div className="space-y-6 mb-10 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {checkoutItems.map((item) => (
                <div key={item.id} className="flex gap-4 items-center">
                  <div className="w-20 h-24 bg-[#111] rounded-lg overflow-hidden flex-shrink-0 border border-gray-800">
                    <img
                      src={item.product.image || item.product.images?.[0]?.url || "/LOGO.png"}
                      className="w-full h-full object-cover"
                      alt={item.product.name}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-bold text-sm leading-tight line-clamp-1">{item.product.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                      Qty: {item.quantity}
                    </p>
                    <p className="font-bold text-base mt-2 text-[#D4AF37]">LKR {item.unitPrice * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-4 pt-8 border-t border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="font-bold">LKR {checkoutTotal || checkoutTotalAmount || totalAmount}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Shipping</span>
                <span className="text-[#D4AF37] font-bold uppercase text-[10px] tracking-widest">Calculated per delivery</span>
              </div>
              
              <div className="flex justify-between items-center pt-6 border-t border-gray-800">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-extrabold tracking-tighter text-[#D4AF37]">LKR {checkoutTotal || checkoutTotalAmount || totalAmount}</span>
              </div>
            </div>

            {/* CTA */}
            <button
               onClick={(e) => {
                 // Trigger the form submit programmatically for the sticky button
                 e.preventDefault();
                 handleSubmit(e);
               }}
               disabled={isUploading}
               className="w-full mt-10 bg-[#D4AF37] hover:bg-yellow-500 text-black py-4 rounded-lg font-extrabold tracking-tight text-lg transition-all flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(212,175,55,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
               {isUploading ? <Loader2 className="animate-spin w-6 h-6" /> : (
                 <>
                   {submitButtonLabel} <span className="text-xl">→</span>
                 </>
               )}
            </button>
            <p className="text-[10px] text-center text-gray-500 mt-6 uppercase tracking-widest leading-relaxed">
              By completing your purchase you agree to our <br/> Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

      </div>

      {/* Guest Checkout Dialog */}
      {showGuestDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#111] border border-gray-800 p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-[#D4AF37]">
                {guestCheckInfo?.existsAsGuest ? "Welcome Back!" : "Personalize Your Experience"}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {guestCheckInfo?.existsAsGuest 
                  ? "We noticed you've shopped with us before. Would you like to create an account to track your orders and enjoy a faster checkout next time?"
                  : "Would you like to register with us for a better experience, or proceed with a one-time guest purchase?"}
              </p>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => handleGuestChoice('register')}
                disabled={isProcessingSelection}
                className="w-full bg-[#D4AF37] hover:bg-yellow-500 text-black py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                {isProcessingSelection ? <Loader2 className="animate-spin w-5 h-5" /> : "Register & Continue"}
              </button>
              
              <button
                onClick={() => handleGuestChoice('guest')}
                disabled={isProcessingSelection}
                className="w-full bg-transparent border border-gray-700 hover:border-gray-500 text-white py-4 rounded-xl font-bold transition-all"
              >
                Continue as Guest
              </button>
            </div>
            
            <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest">
              Registration generates a temporary password sent to your email.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
