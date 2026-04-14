import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  fetchCartAction,
  updateCartItemAction,
  removeFromCartAction,
} from "@/store/cart-slice";
import { createOrder } from "@/store/order-slice";
import { toast } from "@/hooks/use-toast";
import { Loader2, Minus, Plus, Trash2, CreditCard, Building2, AlertCircle, UploadCloud } from "lucide-react";

const API_BASE = `${import.meta.env.VITE_API_URL}/v1`;

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items = [], totalPrice = 0, isLoading } =
    useSelector((state) => state.cart.cart);

  const [formData, setFormData] = useState({
    shippingAddress: "",
    contactNumber: "",
    paymentMethod: "online",
    notes: "",
  });

  const [selectedGateway, setSelectedGateway] = useState("payhere");
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState(null);
  const fileInputRef = useRef(null);

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
      throw new Error(err.response?.data?.message || "Failed to upload receipt");
    }
  };

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
      !receiptFile
    ) {
      setFormError("Please upload a receipt for manual payment.");
      return;
    }

    setFormError(null);
    setIsUploading(true);

    try {
      let uploadedUrl = "";
      if (formData.paymentMethod === "receipt") {
        uploadedUrl = await uploadReceipt();
      }

      // Simulate online gateway processing if needed
      if (formData.paymentMethod === "online") {
        toast({
          title: `Processing via ${selectedGateway.toUpperCase()}`,
          description: "Redirecting to gateway environment...",
        });
        await new Promise(resolve => setTimeout(resolve, 1500)); // simulated latency
      }

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
            ? uploadedUrl
            : "",
        notes: formData.notes,
      };

      await dispatch(createOrder(payload)).unwrap();
      dispatch(fetchCartAction());

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
      setFormError(err?.message || "Checkout failed");
    } finally {
      setIsUploading(false);
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
          className="bg-[#0a0a0a] p-6 lg:p-8 rounded-3xl border border-[#D4AF37]/20 shadow-2xl flex flex-col gap-6"
        >
          <div>
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-6">Order Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Shipping Address</label>
                <input
                  name="shippingAddress"
                  value={formData.shippingAddress}
                  onChange={handleChange}
                  placeholder="123 Example Street, City, Country"
                  className="w-full p-3 bg-black/40 border border-gray-800 rounded-xl focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Contact Number</label>
                <input
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  placeholder="+94 77 123 4567"
                  className="w-full p-3 bg-black/40 border border-gray-800 rounded-xl focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Payment Method</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Online Payment Card */}
              <div 
                onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'online' }))}
                className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${
                  formData.paymentMethod === 'online' 
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10' 
                    : 'border-gray-800 bg-black/40 hover:bg-gray-900'
                }`}
              >
                <CreditCard className={`w-8 h-8 ${formData.paymentMethod === 'online' ? 'text-[#D4AF37]' : 'text-gray-400'}`} />
                <span className={`font-medium ${formData.paymentMethod === 'online' ? 'text-[#D4AF37]' : 'text-gray-300'}`}>Online Payment</span>
                <span className="text-xs text-gray-500 text-center">PayHere / Google Pay<br/>Instantly confirmed</span>
              </div>

              {/* Manual Payment Card */}
              <div 
                onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'receipt' }))}
                className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${
                  formData.paymentMethod === 'receipt' 
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10' 
                    : 'border-gray-800 bg-black/40 hover:bg-gray-900'
                }`}
              >
                <Building2 className={`w-8 h-8 ${formData.paymentMethod === 'receipt' ? 'text-[#D4AF37]' : 'text-gray-400'}`} />
                <span className={`font-medium ${formData.paymentMethod === 'receipt' ? 'text-[#D4AF37]' : 'text-gray-300'}`}>Manual Transfer</span>
                <span className="text-xs text-gray-500 text-center">Bank Transfer / Dep<br/>WhatsApp proof required</span>
              </div>
            </div>

            {/* payment sub options here */}
            {formData.paymentMethod === "online" && (
              <div className="mt-4 p-4 bg-black/40 border border-[#D4AF37]/30 rounded-2xl space-y-3 animation-fade-in">
                <p className="font-semibold text-[#D4AF37] mb-1">Select Gateway:</p>
                <div className="flex flex-col gap-3">
                  <label className={`cursor-pointer flex items-center justify-between p-3 border rounded-xl transition-all ${selectedGateway === 'payhere' ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-800 bg-black'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="gateway" checked={selectedGateway === 'payhere'} onChange={() => setSelectedGateway('payhere')} className="accent-[#D4AF37]" />
                      <span className="font-medium text-white">PayHere</span>
                    </div>
                    <img src="https://static.payhere.lk/images/payhere_short_logo_white.png" alt="PayHere" className="h-6" />
                  </label>
                  
                  <label className={`cursor-pointer flex items-center justify-between p-3 border rounded-xl transition-all ${selectedGateway === 'gpay' ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-800 bg-black'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="gateway" checked={selectedGateway === 'gpay'} onChange={() => setSelectedGateway('gpay')} className="accent-[#D4AF37]" />
                      <span className="font-medium text-white">Google Pay</span>
                    </div>
                    {/* fallback to icon if no standard gpay logo is handy */}
                    <span className="text-xl">💳</span>
                  </label>

                  <label className={`cursor-pointer flex items-center justify-between p-3 border rounded-xl transition-all ${selectedGateway === 'card' ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-800 bg-black'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="gateway" checked={selectedGateway === 'card'} onChange={() => setSelectedGateway('card')} className="accent-[#D4AF37]" />
                      <span className="font-medium text-white">Credit / Debit Card</span>
                    </div>
                    <div className="flex gap-2">
                       <span className="text-[#D4AF37]/80 text-xl font-bold italic">VISA</span>
                       <span className="text-red-500/80 text-xl font-bold italic">MC</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {formData.paymentMethod === "receipt" && (
              <div className="mt-4 p-4 bg-black/40 border border-[#D4AF37]/30 rounded-2xl space-y-4">
                <div className="text-sm text-gray-300">
                  <p className="font-semibold text-[#D4AF37] mb-2">Bank Details:</p>
                  <p>Bank: <span className="text-white">Commercial Bank</span></p>
                  <p>Account Name: <span className="text-white">Saga Elite</span></p>
                  <p>Account No: <span className="text-white font-mono">1234567890</span></p>
                  <p>Branch: <span className="text-white">Colombo 01</span></p>
                  <p className="mt-3 text-xs text-gray-400 p-2 bg-[#D4AF37]/10 rounded-lg">Please complete the transfer and provide the reference number or upload your payment proof to our WhatsApp.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Upload Payment Receipt</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex-col cursor-pointer border-2 border-dashed border-gray-700 hover:border-[#D4AF37] bg-black/40 p-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                    />
                    {receiptPreview ? (
                      <div className="relative">
                       {receiptFile?.type?.includes("image") ? (
                         <img src={receiptPreview} alt="Receipt preview" className="h-32 object-contain rounded-md" />
                       ) : (
                         <div className="h-32 flex flex-col items-center justify-center p-4 bg-gray-800 rounded-md">
                           <span className="text-white font-bold">{receiptFile?.name}</span>
                         </div>
                       )}
                       <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-md">
                         <span className="text-white font-bold text-sm bg-black px-2 py-1 rounded">Change</span>
                       </div>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-gray-500" />
                        <span className="text-gray-400 font-medium">Click to upload deposit slip / screenshot</span>
                        <span className="text-xs text-gray-500">Max 5MB (JPG, PNG, PDF)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-400 mb-1">Additional Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Special instructions for delivery (optional)"
              rows={2}
              className="w-full p-3 bg-black/40 border border-gray-800 rounded-xl focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
            />
          </div>

          {formError && (
            <div className="p-3 bg-red-950/30 border border-red-900 flex items-center gap-3 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-red-400 text-sm">{formError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading}
            className="w-full bg-[#D4AF37] hover:bg-yellow-500 text-black font-bold text-lg py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] mt-2 flex items-center justify-center gap-2"
          >
            {isUploading ? <Loader2 className="animate-spin w-5 h-5" /> : null}
            {isUploading ? "Processing..." : `Complete Order (LKR ${totalPrice || totalAmount})`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;