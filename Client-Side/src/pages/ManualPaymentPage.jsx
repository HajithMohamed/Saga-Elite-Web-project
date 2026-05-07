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
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  Lock,
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
import { cn } from "@/lib/utils";

const CHECKOUT_STEPS = [
  { id: 1, label: "Cart" },
  { id: 2, label: "Delivery" },
  { id: 3, label: "Payment" },
  { id: 4, label: "Complete" },
];

const PageHeader = () => (
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
);

const Stepper = ({ currentStep = 3 }) => (
  <nav aria-label="Checkout progress" className="mb-12 mt-2">
    <ol className="flex items-center justify-between gap-2 sm:gap-4">
      {CHECKOUT_STEPS.map((step, index) => {
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
            {index < CHECKOUT_STEPS.length - 1 && (
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
);

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
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <PageHeader />
        <div className="flex min-h-[70vh] items-center justify-center px-6">
          <div className="max-w-xl rounded-[2rem] border border-[#1c1b1b] bg-[#0d0d0d] p-8 text-center">
            <p className="se-label text-[10px] tracking-[0.32em] text-[#f2ca50]">
              Manual Payment
            </p>
            <h1 className="se-serif mt-4 text-3xl text-[#e5e2e1]">
              No order context found
            </h1>
            <p className="se-body mt-3 text-sm leading-6 text-[#99907c]">
              Return to your orders or checkout flow so we can generate the correct
              bank-transfer reference.
            </p>
            <Link
              to="/shopping/orders"
              className="se-label mt-6 inline-flex items-center gap-2 rounded-full bg-[#f2ca50] px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-[#0a0a0a] transition hover:bg-[#ffe088]"
            >
              Go to orders <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if ((isGenerating || isFetching) && !currentPayment && !activeReferenceNumber) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <PageHeader />
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#f2ca50]" />
            <p className="se-label text-[10px] uppercase tracking-[0.32em] text-[#f2ca50]">
              Preparing payment reference
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <PageHeader />
        <div className="mx-auto max-w-[1280px] px-4 pb-32 pt-8 md:px-8">
          <Stepper currentStep={4} />
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-emerald-500/20 bg-[#0d0d0d] p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="se-serif mt-5 text-3xl text-[#e5e2e1]">
              Payment verified
            </h1>
            <p className="se-body mt-3 text-sm leading-6 text-[#99907c]">
              Your bank transfer has been verified. You can now track the order
              and continue with the delivery journey.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to={`/shopping/order-tracking?orderId=${activeOrderId}`}
                className="se-label inline-flex items-center justify-center gap-2 rounded-full bg-[#f2ca50] px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-[#0a0a0a] transition hover:bg-[#ffe088]"
              >
                Track order <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/shopping/orders"
                className="se-label inline-flex items-center justify-center gap-2 rounded-full border border-[#4d4635]/40 px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-[#e5e2e1] transition hover:border-[#f2ca50]/40 hover:text-[#f2ca50]"
              >
                Back to orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <PageHeader />
      <div className="mx-auto max-w-[1280px] px-4 pb-32 pt-8 md:px-8">
        <Stepper currentStep={3} />

        {error ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="mb-8 rounded-[2rem] border border-[#4d4635]/40 bg-[#131313] py-8 text-center">
          <div className="se-label mb-2 text-[10px] uppercase tracking-[0.32em] text-[#99907c]">
            Your Payment Reference
          </div>
          <div className="se-serif text-4xl font-black tracking-widest text-[#f2ca50] drop-shadow-md md:text-6xl">
            {activeReferenceNumber || "-"}
          </div>
          <p className="se-body mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#d0c5af]">
            Write this exact code in the bank transfer remarks or on your ATM
            deposit slip. Without it, we cannot match your payment.
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
            <div className="rounded-[2rem] border border-[#1c1b1b] bg-[#0d0d0d] p-6">
              <div className="se-label flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#f2ca50]">
                <Clock3 className="h-4 w-4" />
                Current status
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#4d4635]/40 bg-[#0a0a0a] p-4">
                  <p className="se-label text-[9px] uppercase tracking-[0.28em] text-[#574500]">
                    Status
                  </p>
                  <p className="se-body mt-2 text-sm font-semibold text-[#e5e2e1]">
                    {paymentStatus}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#4d4635]/40 bg-[#0a0a0a] p-4">
                  <p className="se-label text-[9px] uppercase tracking-[0.28em] text-[#574500]">
                    Amount
                  </p>
                  <p className="se-instrument mt-2 text-sm font-semibold text-[#e5e2e1]">
                    LKR{" "}
                    {Number(activeAmount || 0).toLocaleString("en-LK", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#4d4635]/40 bg-[#0a0a0a] p-4">
                  <p className="se-label text-[9px] uppercase tracking-[0.28em] text-[#574500]">
                    Reference
                  </p>
                  <p className="se-instrument mt-2 font-mono text-sm tracking-[0.2em] text-[#f2ca50]">
                    {activeReferenceNumber || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#4d4635]/40 bg-[#0a0a0a] p-4 sm:col-span-3">
                  <p className="se-label text-[9px] uppercase tracking-[0.28em] text-[#574500]">
                    Payment link
                  </p>
                  <p className="mt-2 break-all font-mono text-xs text-[#99907c]">
                    {activePaymentSlug
                      ? `/shopping/manual-payment/${activePaymentSlug}`
                      : "-"}
                  </p>
                </div>
              </div>

              {paymentStatus === "rejected" || currentPayment?.rejectionReason ? (
                <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
                  <p className="se-label text-[10px] font-semibold uppercase tracking-[0.28em] text-rose-200">
                    Proof rejected
                  </p>
                  <p className="se-body mt-2 leading-6">
                    {currentPayment?.rejectionReason ||
                      "The uploaded proof was rejected by the admin team. Please submit a clearer receipt."}
                  </p>
                </div>
              ) : null}

              {isExpired ? (
                <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                  <div className="se-label flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200">
                    <ShieldAlert className="h-4 w-4" />
                    Reference expired
                  </div>
                  <p className="se-body mt-2 leading-6 text-amber-50/90">
                    This transfer window has expired. Generate a fresh reference
                    to continue with the same order.
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateAgain}
                    className="se-label mt-4 inline-flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-black transition hover:bg-amber-200"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Regenerate reference
                  </button>
                </div>
              ) : null}

              {paymentStatus === 'pending_payment' && expiresAtTime && (expiresAtTime - Date.now() < 3 * 60 * 60 * 1000) && !currentPayment?.extensionGranted ? (
                <button
                  onClick={handleRequestExtension}
                  className="se-label mt-4 w-full border border-[#4d4635] px-4 py-2 text-[10px] tracking-[0.26em] text-[#d0c5af] transition-colors hover:border-[#f2ca50] hover:text-[#f2ca50]"
                >
                  Need more time? Request 12-hour extension
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            {isExpired ? (
              <div className="rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-6 text-sm text-amber-100">
                <p className="se-label text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200">
                  Proof window closed
                </p>
                <p className="se-body mt-2 leading-6">
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

            <div className="rounded-[2rem] border border-[#1c1b1b] bg-[#0d0d0d] p-6">
              <h2 className="se-serif text-xl text-[#e5e2e1]">Need help?</h2>
              <p className="se-body mt-3 text-sm leading-6 text-[#99907c]">
                Send your proof on WhatsApp to{" "}
                <span className="text-[#e5e2e1]">
                  {bankDetails.supportWhatsapp || "+94 77 070 4274"}
                </span>{" "}
                if you need help matching the transfer. If your proof was rejected,
                upload a clearer copy using the same reference.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={`/shopping/order-tracking?orderId=${activeOrderId}`}
                  className="se-label inline-flex items-center justify-center gap-2 rounded-full border border-[#4d4635]/40 px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-[#e5e2e1] transition hover:border-[#f2ca50]/40 hover:text-[#f2ca50]"
                >
                  View tracking <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/shopping/orders"
                  className="se-label inline-flex items-center justify-center gap-2 rounded-full bg-[#131313] px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-[#e5e2e1] transition hover:bg-[#1c1b1b]"
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
