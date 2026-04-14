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
    paymentMethod: "payhere",
    notes: "",
  });

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
      formData.paymentMethod === "manual" &&
      !receiptFile
    ) {
      setFormError("Please upload a receipt for manual payment.");
      return;
    }

    setFormError(null);
    setIsUploading(true);

    try {
      let uploadedUrl = "";
      if (formData.paymentMethod === "manual") {
        uploadedUrl = await uploadReceipt();
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
        items: items.map((item) => ({
          productId: item.productId,
          variantSku: item.variantSku,
          quantity: item.quantity,
        })),
        shippingAddress: formData.shippingAddress,
        contactNumber: formData.contactNumber,
        paymentMethod: formData.paymentMethod,
        paymentProofUrl:
          formData.paymentMethod === "manual"
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: "payhere", label: "PayHere", desc: "Fast & Secure", icon: <CreditCard className="w-6 h-6" /> },
                { id: "gpay", label: "Google Pay", desc: "Quick Checkout", icon: <span className="text-xl">💳</span> },
                { id: "card", label: "Card Payment", desc: "Visa/Mastercard", icon: <CreditCard className="w-6 h-6" /> },
                { id: "lankapay", label: "LankaPay", desc: "Government Pay", icon: <Building2 className="w-6 h-6" /> },
                { id: "manual", label: "Bank Transfer", desc: "Manual Payment", icon: <Building2 className="w-6 h-6" /> },
                { id: "cash", label: "Cash Deposit", desc: "Offline Method", icon: <CreditCard className="w-6 h-6" /> }
              ].map(method => (
                <div 
                  key={method.id}
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.id }))}
                  className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${
                    formData.paymentMethod === method.id 
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 ring-1 ring-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                      : 'border-gray-800 bg-black/40 hover:bg-gray-900 group'
                  }`}
                >
                  <div className={`${formData.paymentMethod === method.id ? 'text-[#D4AF37]' : 'text-gray-400 group-hover:text-gray-300'}`}>
                    {method.icon}
                  </div>
                  <span className={`font-medium text-center ${formData.paymentMethod === method.id ? 'text-[#D4AF37]' : 'text-gray-300 group-hover:text-white'}`}>
                    {method.label}
                  </span>
                  <span className="text-xs text-gray-500 text-center">{method.desc}</span>
                </div>
              ))}
            </div>

            {formData.paymentMethod === "manual" && (
              <div className="mt-6 p-6 bg-black/40 border border-[#D4AF37]/30 rounded-3xl space-y-6">
                <div className="bg-[#111] border border-gray-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="space-y-3 flex-1 w-full">
                    <h4 className="font-bold text-[#D4AF37] text-lg mb-2">Bank Details</h4>
                    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                      <span className="text-gray-400">Bank:</span>
                      <span className="text-white font-medium">Commercial Bank</span>
                      
                      <span className="text-gray-400">Account Name:</span>
                      <span className="text-white font-medium">Saga Elite Pvt Ltd</span>
                      
                      <span className="text-gray-400">Account No:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono text-base tracking-wider bg-black/50 px-2 py-1 rounded">123456789</span>
                        <button 
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText("123456789");
                            toast({ title: "Copied!", description: "Account number copied to clipboard." });
                          }}
                          className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black px-3 py-1 rounded-md transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      
                      <span className="text-gray-400">Branch:</span>
                      <span className="text-white font-medium">Colombo</span>
                    </div>
                  </div>
                  <div className="w-32 h-32 bg-white rounded-xl p-2 flex items-center justify-center flex-shrink-0">
                    {/* Placeholder for actual QR code image */}
                    <div className="w-full h-full border-4 border-dashed border-gray-300 flex items-center justify-center text-center text-xs text-gray-500 font-bold bg-gray-50">
                      QR CODE
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Upload Payment Proof</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[#D4AF37]'); }}
                    onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-[#D4AF37]'); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-[#D4AF37]');
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileChange({ target: { files: [file] } });
                    }}
                    className="w-full flex-col cursor-pointer border-2 border-dashed border-gray-700 hover:border-[#D4AF37] bg-black/40 p-8 rounded-2xl flex items-center justify-center gap-4 transition-all duration-300 relative group overflow-hidden"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={handleFileChange}
                    />
                    {receiptPreview ? (
                      <div className="w-full relative flex justify-center">
                       {receiptFile?.type?.includes("image") ? (
                         <img src={receiptPreview} alt="Receipt preview" className="max-h-48 object-contain rounded-xl shadow-lg border border-gray-800" />
                       ) : (
                         <div className="h-32 w-full max-w-sm flex flex-col items-center justify-center p-6 bg-[#111] rounded-xl border border-gray-800">
                           <UploadCloud className="w-10 h-10 text-[#D4AF37] mb-2" />
                           <span className="text-white font-medium text-center truncate w-full px-4">{receiptFile?.name}</span>
                         </div>
                       )}
                       <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                         <span className="text-white font-medium bg-black/80 px-4 py-2 rounded-full backdrop-blur-sm border border-gray-700 hover:border-[#D4AF37] transition-colors">Change File</span>
                       </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-[#D4AF37]/10 p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
                          <UploadCloud className="w-10 h-10 text-[#D4AF37]" />
                        </div>
                        <div className="text-center space-y-1">
                          <h5 className="text-white font-medium text-lg lg:text-xl">Drag & Drop or Click to Upload</h5>
                          <p className="text-gray-400 text-sm">Accepts JPG, PNG, PDF (Max 5MB)</p>
                        </div>
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