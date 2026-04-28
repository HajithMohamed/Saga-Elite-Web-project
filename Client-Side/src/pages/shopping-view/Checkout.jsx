import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  fetchCartAction,
  updateCartItemAction,
  removeFromCartAction,
} from "@/store/cart-slice";
import { createOrder } from "@/store/order-slice";
import { toast } from "@/hooks/use-toast";
import { Loader2, Minus, Plus, Trash2, CreditCard, Building2, AlertCircle, UploadCloud } from "lucide-react";

const API_BASE = `${import.meta.env.VITE_API_URL}/v1`;
const BUY_NOW_STORAGE_KEY = "saga_buy_now_checkout";

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

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    shippingAddress: "",
    contactNumber: "",
    paymentMethod: "manual",
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
  }, [cartStateItems, dispatch, location.state]);

  useEffect(() => {
    if (!hasInitializedSource || isBuyNow) return;

    setCheckoutItems(items);
    setCheckoutTotal(totalPrice);
  }, [hasInitializedSource, isBuyNow, items, totalPrice]);

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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
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

  // ---------------- ORDER SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!checkoutItems.length) {
      setFormError("Your cart is empty.");
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

    if (
      formData.paymentMethod === "manual" &&
      !receiptFile
    ) {
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
    if (!["payhere", "gpay", "manual", "card", "lankapay", "cash"].includes(formData.paymentMethod)) {
      setFormError("Please select a valid payment method.");
      return;
    }

    setIsUploading(true);

    try {
      let uploadedUrl = "";
      if (formData.paymentMethod === "manual") {
        uploadedUrl = await uploadReceipt();
        if (!uploadedUrl) {
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
          quantity: item.quantity,
        })),
        checkoutMode: isBuyNow ? "buyNow" : "cart",
        shippingAddress: formData.shippingAddress,
        contactNumber: formData.contactNumber,
        paymentMethod: formData.paymentMethod,
        paymentProofUrl:
          formData.paymentMethod === "manual"
            ? uploadedUrl
            : "",
        notes: formData.notes,
        guestEmail: !isAuthenticated ? formData.guestEmail : undefined,
      };

      const resultAction = await dispatch(createOrder(payload)).unwrap();
      if (!isBuyNow) {
        dispatch(fetchCartAction());
      }

      toast({
        title: "Order placed",
        description: "Your order was successfully submitted.",
        variant: "success",
      });

      persistBuyNowItem(null);

      navigate("/shopping/checkout-success", { 
        state: { 
          orderId: resultAction?.orderId || resultAction?._id || "TEM-" + Math.floor(Math.random() * 100000),
          totalAmount: checkoutTotal || checkoutTotalAmount || totalAmount,
          referenceNumber: resultAction?.referenceNumber,
          paymentMethod: formData.paymentMethod
        } 
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
  if ((!hasInitializedSource || isLoading) && !checkoutItems.length) {
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
            
            {/* Guest Email (only for non-authenticated users) */}
            {!isAuthenticated && (
              <section className="space-y-8">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">00</span>
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
                <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">01</span>
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
                <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">02</span>
                <h2 className="text-xl font-bold tracking-tight">Payment Method</h2>
              </div>
              
              {/* Payment Choice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: "manual", label: "Bank Transfer", icon: <Building2 className="w-6 h-6" /> },
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

                {formData.paymentMethod === "manual" && (
                  <div className="space-y-6">
                    <div className="bg-[#111] border border-gray-800 p-5 rounded-lg flex flex-col sm:flex-row justify-between gap-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 bg-[#D4AF37]/10 w-32 h-32 blur-3xl rounded-full"></div>
                       <div className="space-y-3 flex-1 relative z-10">
                        <h4 className="font-bold text-[#D4AF37] text-lg">Bank Information</h4>
                        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                          <span className="text-gray-400">Bank:</span>
                          <span className="font-medium">Commercial Bank</span>
                          
                          <span className="text-gray-400">Account Name:</span>
                          <span className="font-medium">Saga Elite Pvt Ltd</span>
                          
                          <span className="text-gray-400">Account No:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-black px-2 py-1 border border-gray-800 rounded">123456789</span>
                            <button 
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText("123456789");
                                toast({ title: "Copied!", description: "Account number copied to clipboard." });
                              }}
                              className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black px-2 py-1 rounded transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] ml-1">Upload Receipt</label>
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
                    Complete Purchase <span className="text-lg">→</span>
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
                      {item.variant.size} • {item.variant.color} • Qty: {item.quantity}
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
                   Complete Purchase <span className="text-xl">→</span>
                 </>
               )}
            </button>
            <p className="text-[10px] text-center text-gray-500 mt-6 uppercase tracking-widest leading-relaxed">
              By completing your purchase you agree to our <br/> Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
