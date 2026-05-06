import React, { useEffect, useMemo, useRef } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { motion } from "framer-motion";

import { toast } from "@/hooks/use-toast";
import {
  fetchMyManualPaymentStatus,
  generateManualPaymentReference,
  storeManualPaymentContext,
  submitManualPaymentProof,
} from "@/store/manualPaymentSlice";
import { uploadManualPaymentProof } from "@/api/manualPaymentAPI";
import ManualPaymentInstructions from "@/components/Payment/ManualPaymentInstructions";
import ProofSubmission from "@/components/Payment/ProofSubmission";

const ManualPaymentPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { paymentSlug = "" } = useParams();
  const [searchParams] = useSearchParams();
  const contextRef = useRef(null);

  const {
    currentPayment,
    paymentContext,
    lastGeneratedReference,
    isGenerating,
    isSubmitting,
    isFetching,
    error,
  } = useSelector((state) => state.manualPayment);

  const orderIdParam = searchParams.get("orderId");
  const amountParam = searchParams.get("amount");
  const referenceParam = searchParams.get("referenceNumber");
  const slugParam = searchParams.get("slug");

  const resolvedOrderId =
    location.state?.orderId ||
    orderIdParam ||
    currentPayment?.orderId?._id ||
    currentPayment?.orderId ||
    paymentContext?.orderId ||
    "";
  const resolvedAmount = Number(
    location.state?.amount ||
      amountParam ||
      currentPayment?.amount ||
      paymentContext?.amount ||
      0
  );
  const storedPlainRefFallback = useMemo(() => {
    if (typeof window === "undefined") return "";
    try {
      const raw = window.localStorage.getItem("saga_manual_payment_ref");
      if (!raw) return "";
      const trimmed = raw.trim();
      if (trimmed.startsWith("{")) {
        const parsed = JSON.parse(trimmed);
        return (
          parsed.referenceNumber ||
          parsed.reference ||
          parsed.ref ||
          ""
        );
      }
      return trimmed;
    } catch {
      return "";
    }
  }, [paymentContext?.referenceNumber, lastGeneratedReference]);

  const resolvedReferenceNumber =
    paymentSlug ||
    location.state?.referenceNumber ||
    referenceParam ||
    slugParam ||
    currentPayment?.slug ||
    currentPayment?.referenceNumber ||
    paymentContext?.slug ||
    paymentContext?.referenceNumber ||
    lastGeneratedReference ||
    storedPlainRefFallback ||
    "";

  useEffect(() => {
    if (!resolvedOrderId && !resolvedReferenceNumber) {
      return;
    }

    const nextContext = {
      orderId: resolvedOrderId || null,
      amount: resolvedAmount || null,
      slug: currentPayment?.slug || paymentSlug || slugParam || null,
      referenceNumber: resolvedReferenceNumber || null,
    };

    const prevContext = contextRef.current;
    const hasChanged =
      !prevContext ||
      prevContext.orderId !== nextContext.orderId ||
      prevContext.amount !== nextContext.amount ||
      prevContext.slug !== nextContext.slug ||
      prevContext.referenceNumber !== nextContext.referenceNumber;

    if (!hasChanged) {
      return;
    }

    contextRef.current = nextContext;
    dispatch(storeManualPaymentContext(nextContext));
  }, [
    currentPayment?.slug,
    dispatch,
    paymentSlug,
    resolvedAmount,
    resolvedOrderId,
    resolvedReferenceNumber,
    slugParam,
  ]);

  useEffect(() => {
    if (resolvedReferenceNumber) {
      dispatch(fetchMyManualPaymentStatus(resolvedReferenceNumber));
      return;
    }

    if (resolvedOrderId) {
      dispatch(
        generateManualPaymentReference({
          orderId: resolvedOrderId,
          amount: resolvedAmount || undefined,
        })
      );
    }
  }, [dispatch, resolvedAmount, resolvedOrderId, resolvedReferenceNumber]);

  useEffect(() => {
    const activeSlug = currentPayment?.slug;
    if (!activeSlug || paymentSlug === activeSlug) {
      return;
    }

    navigate(`/shopping/manual-payment/${activeSlug}`, {
      replace: true,
      state: {
        orderId:
          currentPayment?.orderId?._id ||
          currentPayment?.orderId ||
          resolvedOrderId ||
          null,
        amount: currentPayment?.amount || resolvedAmount || null,
        referenceNumber: currentPayment?.referenceNumber || resolvedReferenceNumber || null,
        slug: activeSlug,
      },
    });
  }, [
    currentPayment?.amount,
    currentPayment?.orderId,
    currentPayment?.referenceNumber,
    currentPayment?.slug,
    navigate,
    paymentSlug,
    resolvedAmount,
    resolvedOrderId,
    resolvedReferenceNumber,
  ]);

  const handleCopyReference = (copyError) => {
    if (copyError) {
      toast({
        title: "Copy failed",
        description: "Could not copy the reference number.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Copied",
      description: "Reference number copied to clipboard.",
      variant: "success",
    });
  };

  const handleSubmitProof = async (file) => {
    if (!currentPayment?.referenceNumber) {
      throw new Error("Payment reference is not ready yet.");
    }

    const proofUrl = await uploadManualPaymentProof(file);
    if (!proofUrl) {
      throw new Error("Proof upload failed.");
    }

    await dispatch(
      submitManualPaymentProof({
        referenceNumber: currentPayment.referenceNumber,
        proofUrl,
      })
    ).unwrap();

    toast({
      title: "Proof submitted",
      description: "Your payment proof is now awaiting manual verification.",
      variant: "success",
    });
  };

  const handleGenerateAgain = async () => {
    if (!resolvedOrderId) return;

    try {
      const generatedPayment = await dispatch(
        generateManualPaymentReference({
          orderId: resolvedOrderId,
          amount: resolvedAmount || undefined,
        })
      ).unwrap();

      dispatch(
        storeManualPaymentContext({
          orderId:
            generatedPayment?.orderId ||
            generatedPayment?.data?.orderId ||
            resolvedOrderId,
          amount:
            generatedPayment?.amount ||
            generatedPayment?.data?.amount ||
            resolvedAmount,
          slug:
            generatedPayment?.slug ||
            generatedPayment?.data?.slug ||
            generatedPayment?.data?.manualPayment?.slug ||
            null,
          referenceNumber:
            generatedPayment?.referenceNumber ||
            generatedPayment?.data?.referenceNumber ||
            generatedPayment?.data?.manualPayment?.referenceNumber ||
            null,
        })
      );

      toast({
        title: "Reference regenerated",
        description: "A fresh payment reference is now available.",
        variant: "success",
      });
    } catch (generationError) {
      toast({
        title: "Unable to regenerate",
        description: generationError || "Could not generate a new reference.",
        variant: "destructive",
      });
    }
  };

  const handleRequestExtension = async () => {
    if (!activePaymentSlug) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/v1/manual-payments/${activePaymentSlug}/request-extension`,
        { method: "POST" }
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Extension granted",
          description: "Your payment deadline has been extended by 12 hours.",
          variant: "success",
        });
        dispatch(fetchMyManualPaymentStatus(activePaymentSlug));
      } else {
        throw new Error(data.message || "Failed to request extension");
      }
    } catch (extensionError) {
      toast({
        title: "Unable to request extension",
        description: extensionError?.message || "Could not request extension.",
        variant: "destructive",
      });
    }
  };

  const bankDetails = currentPayment?.bankDetails || {
    bankName: "Sampath Bank",
    branch: "Hatton",
    accountName: "N.Gayathree",
    accountNumber: "108052612262",
    supportWhatsapp: "+94 77 070 4274",
  };
  const paymentStatus = currentPayment?.status || "pending_payment";
  const activePaymentSlug =
    currentPayment?.slug || paymentContext?.slug || paymentSlug || "";
  const activeReferenceNumber =
    currentPayment?.referenceNumber || resolvedReferenceNumber;
  const activeOrderId =
    currentPayment?.orderId?._id || currentPayment?.orderId || resolvedOrderId;
  const activeAmount = currentPayment?.amount || resolvedAmount;
  const expiresAtTime = currentPayment?.expiresAt
    ? new Date(currentPayment.expiresAt).getTime()
    : null;
  const isExpired =
    paymentStatus === "expired" ||
    (expiresAtTime
      ? expiresAtTime <= Date.now() && paymentStatus === "pending_payment"
      : false);
  const isVerified = paymentStatus === "verified";

  if (
    !resolvedOrderId &&
    !resolvedReferenceNumber &&
    !currentPayment?.referenceNumber &&
    !lastGeneratedReference
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
        <div className="max-w-xl rounded-[28px] border border-white/10 bg-[#0b0b0b] p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#D4AF37]">
            Manual Payment
          </p>
          <h1 className="mt-4 text-3xl font-black">No order context found</h1>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            Return to your orders or checkout flow so we can generate the correct
            bank-transfer reference.
          </p>
          <Link
            to="/shopping/orders"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-black"
          >
            Go to orders <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if ((isGenerating || isFetching) && !currentPayment && !activeReferenceNumber) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" />
          <p className="text-xs uppercase tracking-[0.32em] text-[#D4AF37]">
            Preparing payment reference
          </p>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen bg-[#050505] px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-[30px] border border-emerald-500/20 bg-[#0a0a0a] p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-3xl font-black">Payment verified</h1>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            Your bank transfer has been verified. You can now track the order and
            continue with the delivery journey.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to={`/shopping/order-tracking?orderId=${activeOrderId}`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-black"
            >
              Track order <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/shopping/orders"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white"
            >
              Back to orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10">
        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="text-center py-8 border border-[#4d4635] bg-[#131313] mb-8 rounded-2xl">
          <div className="se-label text-[10px] tracking-[0.32em] text-[#99907c] mb-2 uppercase font-bold">
            YOUR PAYMENT REFERENCE
          </div>
          <div className="se-serif text-[#f2ca50] text-4xl md:text-6xl tracking-widest font-black drop-shadow-md">
            {activeReferenceNumber || "-"}
          </div>
          <p className="se-body text-[#d0c5af] text-sm mt-3 max-w-sm mx-auto leading-relaxed">
            Write this exact code in the bank transfer remarks or on your ATM deposit slip.
            Without it, we cannot match your payment.
          </p>
        </div>

        <ManualPaymentInstructions
          bankDetails={bankDetails}
          referenceNumber={activeReferenceNumber}
          amount={activeAmount}
          expiresAt={currentPayment?.expiresAt}
          status={paymentStatus}
          onCopyReference={handleCopyReference}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]"
        >
          <div className="space-y-6">
            <div className="rounded-[26px] border border-border bg-surface-container-low p-6 dark:border-white/10 dark:bg-[#0b0b0b]">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#D4AF37]">
                <Clock3 className="h-4 w-4" />
                Current status
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">
                    Status
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {paymentStatus}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">
                    Amount
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    LKR{" "}
                    {Number(activeAmount || 0).toLocaleString("en-LK", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">
                    Reference
                  </p>
                  <p className="mt-2 font-mono text-sm tracking-[0.2em] text-[#D4AF37]">
                    {activeReferenceNumber || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:col-span-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">
                    Payment link
                  </p>
                  <p className="mt-2 break-all font-mono text-xs text-gray-300">
                    {activePaymentSlug
                      ? `/shopping/manual-payment/${activePaymentSlug}`
                      : "-"}
                  </p>
                </div>
              </div>

              {paymentStatus === "rejected" || currentPayment?.rejectionReason ? (
                <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
                  <p className="font-semibold text-rose-200">Proof rejected</p>
                  <p className="mt-2 leading-6">
                    {currentPayment?.rejectionReason ||
                      "The uploaded proof was rejected by the admin team. Please submit a clearer receipt."}
                  </p>
                </div>
              ) : null}

              {isExpired ? (
                <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                  <div className="flex items-center gap-2 font-semibold text-amber-200">
                    <ShieldAlert className="h-4 w-4" />
                    Reference expired
                  </div>
                  <p className="mt-2 leading-6 text-amber-50/90">
                    This transfer window has expired. Generate a fresh reference
                    to continue with the same order.
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateAgain}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-black transition hover:bg-amber-200"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Regenerate reference
                  </button>
                </div>
              ) : null}

              {paymentStatus === 'pending_payment' && expiresAtTime && (expiresAtTime - Date.now() < 3 * 60 * 60 * 1000) && !currentPayment?.extensionGranted ? (
                <button onClick={handleRequestExtension}
                        className="se-label text-[10px] tracking-[0.26em] text-[#d0c5af] 
                                   border border-[#4d4635] px-4 py-2 hover:border-[#f2ca50] 
                                   hover:text-[#f2ca50] transition-colors mt-4 w-full">
                  Need more time? Request 12-hour extension
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            {isExpired ? (
              <div className="rounded-[26px] border border-amber-500/20 bg-amber-500/10 p-6 text-sm text-amber-100">
                <p className="font-semibold text-amber-200">Proof window closed</p>
                <p className="mt-2 leading-6">
                  This transfer reference has expired. Regenerate a new reference
                  to submit a valid receipt.
                </p>
              </div>
            ) : (
              <ProofSubmission
                isSubmitting={isSubmitting}
                onSubmitProof={handleSubmitProof}
                title="Upload proof of transfer"
                description="Choose the bank receipt image or PDF that matches the reference shown above."
              />
            )}

            <div className="rounded-[26px] border border-white/10 bg-[#0b0b0b] p-6">
              <h2 className="text-lg font-bold text-white">Need help?</h2>
              <p className="mt-3 text-sm leading-6 text-gray-400">
                Send your proof on WhatsApp to {bankDetails.supportWhatsapp || "+94 77 070 4274"} if
                you need help matching the transfer. If your proof was rejected,
                upload a clearer copy using the same reference.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={`/shopping/order-tracking?orderId=${activeOrderId}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
                >
                  View tracking <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/shopping/orders"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
                >
                  Orders list
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ManualPaymentPage;
