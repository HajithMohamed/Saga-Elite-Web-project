import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Loader2,
  Mail,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { toast } from "@/hooks/use-toast";
import {
  fetchMyManualPaymentStatus,
  generateManualPaymentReference,
  sendManualPaymentLink,
  setManualPaymentEmail,
  storeManualPaymentContext,
  submitManualPaymentReceipt,
} from "@/store/manualPaymentSlice";
import { requestManualPaymentExtension } from "@/api/manualPaymentAPI";

import ProofSubmission from "@/components/Payment/ProofSubmission";
import PaymentVerificationHero from "@/components/Payment/PaymentVerificationHero";
import PaymentStepper from "@/components/Payment/PaymentStepper";
import PaymentInstructionSteps from "@/components/Payment/ManualPaymentInstructions";
import BankDetailsCard from "@/components/Payment/BankDetailsCard";
import PaymentSummaryCard from "@/components/Payment/PaymentSummaryCard";
import VerificationTimeline from "@/components/Payment/VerificationTimeline";
import PaymentFAQ from "@/components/Payment/PaymentFAQ";
import ContactSupportSection from "@/components/Payment/ContactSupportSection";
import { cn } from "@/lib/utils";

const MOTION_EASE = [0.16, 1, 0.3, 1];

const PremiumLoader = () => {
  const [stage, setStage] = useState(0);
  const stages = [
    "Preparing secure reference...",
    "Verifying atelier inventory...",
    "Connecting banking channel..."
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 1500);
    const timer2 = setTimeout(() => setStage(2), 3000);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      <div className="relative mb-8 flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-white/5 border-t-[#f2ca50]" />
        <div className="h-2 w-2 rounded-full bg-[#f2ca50] shadow-[0_0_15px_rgba(242,202,80,0.8)]" />
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={stage}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.5 }}
          className="se-label text-[10px] uppercase tracking-[0.32em] text-[#f2ca50]"
        >
          {stages[stage]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

const CinematicSuccess = ({ orderId }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1 }}
    className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-6 text-center"
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(242,202,80,0.1)_0%,transparent_50%)]" />
    
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: MOTION_EASE, delay: 0.2 }}
      className="relative z-10 mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-[#f2ca50]/20 to-[#ffe088]/5 shadow-[0_0_60px_rgba(242,202,80,0.2)] border border-[#f2ca50]/30"
    >
      <Check className="h-10 w-10 text-[#f2ca50]" strokeWidth={2.5} />
    </motion.div>

    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: MOTION_EASE, delay: 0.4 }}
      className="relative z-10"
    >
      <h1 className="se-serif text-4xl text-[#e5e2e1] sm:text-5xl">Payment verification complete</h1>
      <p className="se-body mt-4 max-w-md mx-auto text-sm leading-6 text-[#d0c5af]">
        Your payment has been successfully submitted. Our atelier will begin preparation shortly. We've sent the receipt to your email.
      </p>

      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        {orderId && (
          <Link
            to={`/shopping/order-tracking?orderId=${orderId}`}
            className="se-label flex h-[56px] min-w-[200px] items-center justify-center gap-2 rounded-[16px] bg-[#f2ca50] px-8 text-[10px] uppercase tracking-[0.28em] text-[#0a0a0a] transition hover:bg-[#ffe088] shadow-[0_0_20px_rgba(242,202,80,0.3)] hover:shadow-[0_0_30px_rgba(242,202,80,0.5)]"
          >
            Track Order <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        <Link
          to="/shopping/home"
          className="se-label flex h-[56px] min-w-[200px] items-center justify-center gap-2 rounded-[16px] border border-white/20 px-8 text-[10px] uppercase tracking-[0.28em] text-[#e5e2e1] transition hover:border-[#f2ca50]/40 hover:text-[#f2ca50]"
        >
          Return to Shop
        </Link>
      </div>
    </motion.div>
  </motion.div>
);

const EmailGate = ({ defaultEmail = "", onSubmit, isSubmitting }) => {
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState(null);

  const submit = (event) => {
    event.preventDefault();
    const trimmed = (email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    onSubmit(trimmed);
  };

  return (
    <div className="mx-auto max-w-xl rounded-[2rem] border border-white/5 bg-[#0d0d0d] p-8 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f2ca50]/40 bg-[#f2ca50]/10 text-[#f2ca50]">
          <Mail className="h-4 w-4" />
        </div>
        <div>
          <p className="se-label text-[10px] tracking-[0.32em] text-[#f2ca50]">
            Verify Identity
          </p>
          <h1 className="se-serif text-2xl text-[#e5e2e1]">Confirm your email</h1>
        </div>
      </div>
      <p className="se-body mt-4 text-sm leading-6 text-[#99907c]">
        Enter the email used during checkout to access your private concierge payment portal.
      </p>
      <form onSubmit={submit} className="mt-5 space-y-3">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="your@email.com"
          autoComplete="email"
          autoFocus
          className="w-full rounded-2xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-[#e5e2e1] placeholder-[#574500] outline-none transition focus:border-[#f2ca50] focus:ring-1 focus:ring-[#f2ca50]/50"
        />
        {error ? (
          <p className="text-xs text-rose-300">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="se-label inline-flex w-full h-[56px] items-center justify-center gap-2 rounded-[16px] bg-[#f2ca50] px-5 text-[10px] uppercase tracking-[0.28em] text-[#0a0a0a] transition hover:bg-[#ffe088] disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Enter Portal
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-[#574500]">
        Lost the link? <Link to="/shopping/find-payment" className="text-[#f2ca50] hover:underline">Find payment</Link>
      </p>
    </div>
  );
};

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
  
  const authState = useSelector((state) => state.auth || {});
  const isAuthenticated = Boolean(
    authState.isAuthenticated || authState.user?._id || authState.user?.id
  );

  const [needsEmailGate, setNeedsEmailGate] = useState(false);
  const [successUpload, setSuccessUpload] = useState(false);

  const orderIdParam = searchParams.get("orderId");
  const amountParam = searchParams.get("amount");
  const referenceParam = searchParams.get("referenceNumber");
  const slugParam = searchParams.get("slug");
  const emailParam = searchParams.get("email");

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
        return parsed.referenceNumber || parsed.reference || parsed.ref || "";
      }
      return trimmed;
    } catch {
      return "";
    }
  }, []);

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

  // A previously-confirmed email is remembered so returning guests aren't
  // re-prompted for the same payment session.
  const storedEmailFallback = useMemo(() => {
    if (typeof window === "undefined") return "";
    try {
      return (window.localStorage.getItem("saga_manual_payment_email") || "").trim().toLowerCase();
    } catch {
      return "";
    }
  }, []);

  const resolvedEmail =
    paymentContext?.email ||
    (emailParam ? emailParam.trim().toLowerCase() : "") ||
    (authState.user?.email ? String(authState.user.email).trim().toLowerCase() : "") ||
    storedEmailFallback ||
    "";

  // Authenticated users always have a known email, so they never see the gate.
  const guestNeedsEmail = !isAuthenticated && !resolvedEmail;

  useEffect(() => {
    if (emailParam && !paymentContext?.email) {
      dispatch(setManualPaymentEmail(emailParam));
    }
  }, [dispatch, emailParam, paymentContext?.email]);

  useEffect(() => {
    if (!resolvedOrderId && !resolvedReferenceNumber) {
      return;
    }

    const nextContext = {
      orderId: resolvedOrderId || null,
      amount: resolvedAmount || null,
      slug: currentPayment?.slug || paymentSlug || slugParam || null,
      referenceNumber: resolvedReferenceNumber || null,
      email: resolvedEmail || paymentContext?.email || null,
    };

    const prevContext = contextRef.current;
    const hasChanged =
      !prevContext ||
      prevContext.orderId !== nextContext.orderId ||
      prevContext.amount !== nextContext.amount ||
      prevContext.slug !== nextContext.slug ||
      prevContext.referenceNumber !== nextContext.referenceNumber ||
      prevContext.email !== nextContext.email;

    if (!hasChanged) {
      return;
    }

    contextRef.current = nextContext;
    dispatch(storeManualPaymentContext(nextContext));
  }, [
    currentPayment?.slug,
    dispatch,
    paymentContext?.email,
    paymentSlug,
    resolvedAmount,
    resolvedEmail,
    resolvedOrderId,
    resolvedReferenceNumber,
    slugParam,
  ]);

  useEffect(() => {
    if (guestNeedsEmail) {
      setNeedsEmailGate(true);
      return;
    }

    if (resolvedReferenceNumber) {
      dispatch(
        fetchMyManualPaymentStatus({
          referenceNumber: resolvedReferenceNumber,
          email: resolvedEmail || undefined,
        })
      )
        .unwrap()
        .then(() => setNeedsEmailGate(false))
        .catch(() => {
          if (!isAuthenticated) {
            setNeedsEmailGate(true);
          }
        });
      return;
    }

    if (resolvedOrderId && isAuthenticated) {
      dispatch(
        generateManualPaymentReference({
          orderId: resolvedOrderId,
          amount: resolvedAmount || undefined,
        })
      );
    }
  }, [
    dispatch,
    guestNeedsEmail,
    isAuthenticated,
    resolvedAmount,
    resolvedEmail,
    resolvedOrderId,
    resolvedReferenceNumber,
  ]);

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
        referenceNumber:
          currentPayment?.referenceNumber || resolvedReferenceNumber || null,
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

  const handleEmailSubmit = (email) => {
    dispatch(setManualPaymentEmail(email));
    setNeedsEmailGate(false);
    if (resolvedReferenceNumber) {
      dispatch(
        fetchMyManualPaymentStatus({
          referenceNumber: resolvedReferenceNumber,
          email,
        })
      )
        .unwrap()
        .then(() => {
          // Remember the verified email so this gate isn't shown again on revisit.
          try {
            window.localStorage.setItem("saga_manual_payment_email", email);
          } catch {
            /* ignore storage failures */
          }
        })
        .catch((err) => {
          toast({
            title: "Could not verify",
            description: err || "Email did not match this payment.",
            variant: "destructive",
          });
          setNeedsEmailGate(true);
        });
    }
  };

  const handleSubmitProof = async (file) => {
    if (!activeReferenceNumber) {
      throw new Error("Payment reference is not ready yet.");
    }

    try {
      const result = await dispatch(
        submitManualPaymentReceipt({
          referenceNumber: activeReferenceNumber,
          file,
          email: resolvedEmail || undefined,
        })
      ).unwrap();

      const decision = result?.data?.decision;
      if (decision === "ocr_matched") {
        toast({
          title: "Receipt accepted",
          description:
            "We received your receipt. Your order will be confirmed once your bank notifies us of the credit.",
          variant: "success",
        });
        setSuccessUpload(true);
      } else if (decision === "auto_rejected") {
        toast({
          title: "Receipt didn't match",
          description:
            result?.data?.decisionReason ||
            "We couldn't match the reference and amount on this receipt. Please upload a clearer or correct receipt.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Proof submitted",
          description: "Your payment proof is now awaiting manual verification.",
          variant: "success",
        });
        setSuccessUpload(true);
      }
    } catch (uploadError) {
      const message =
        typeof uploadError === "string"
          ? uploadError
          : uploadError?.message || "Failed to submit receipt.";
      toast({
        title: "Receipt upload failed",
        description: message,
        variant: "destructive",
      });
      throw uploadError;
    }
  };

  const handleGenerateAgain = async () => {
    if (!resolvedOrderId) return;
    try {
      await dispatch(
        generateManualPaymentReference({
          orderId: resolvedOrderId,
          amount: resolvedAmount || undefined,
        })
      ).unwrap();
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

  const bankDetails = currentPayment?.bankDetails || {};
  const paymentStatus = currentPayment?.status || "pending_payment";
  const activeReferenceNumber = currentPayment?.referenceNumber || resolvedReferenceNumber;
  const activeOrderId = currentPayment?.orderId?._id || currentPayment?.orderId || resolvedOrderId;
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
  const isRejected = paymentStatus === "rejected";
  const isPendingVerification = paymentStatus === "pending_bank_confirmation" || paymentStatus === "proof_submitted";

  if (
    !resolvedOrderId &&
    !resolvedReferenceNumber &&
    !currentPayment?.referenceNumber &&
    !lastGeneratedReference
  ) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="max-w-xl w-full rounded-[2rem] border border-white/5 bg-[#0d0d0d] p-8 text-center shadow-2xl">
          <p className="se-label text-[10px] tracking-[0.32em] text-[#f2ca50]">
            Concierge Portal
          </p>
          <h1 className="se-serif mt-4 text-3xl text-[#e5e2e1]">
            Order context missing
          </h1>
          <p className="se-body mt-3 text-sm leading-6 text-[#99907c]">
            Please open this page directly from your order confirmation email.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/shopping/find-payment"
              className="se-label flex h-[56px] items-center justify-center gap-2 rounded-[16px] bg-[#f2ca50] px-6 text-[10px] uppercase tracking-[0.28em] text-[#0a0a0a] transition hover:bg-[#ffe088]"
            >
              Find Payment
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (needsEmailGate || guestNeedsEmail) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 pb-32 pt-16 md:px-8">
        <EmailGate
          defaultEmail={resolvedEmail}
          onSubmit={handleEmailSubmit}
          isSubmitting={isFetching}
        />
      </div>
    );
  }

  if ((isGenerating || isFetching) && !currentPayment && !activeReferenceNumber) {
    if (!isAuthenticated && !resolvedEmail) {
      return (
        <div className="mx-auto max-w-[1280px] px-4 pb-32 pt-16 md:px-8">
          <EmailGate
            defaultEmail={resolvedEmail}
            onSubmit={handleEmailSubmit}
            isSubmitting={isFetching}
          />
        </div>
      );
    }
    return <PremiumLoader />;
  }

  // Show success screen immediately after successful upload or if verified
  if (isVerified || (successUpload && isPendingVerification)) {
    return <CinematicSuccess orderId={activeOrderId} />;
  }

  return (
    <div className="relative mx-auto w-full max-w-[1280px] px-4 pb-32 pt-8 md:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#574500]">
        <Link to="/" className="transition-colors hover:text-[#d0c5af]">Home</Link>
        <span>&gt;</span>
        <Link to="/shopping/orders" className="transition-colors hover:text-[#d0c5af]">My Orders</Link>
        <span>&gt;</span>
        <span>Order Details</span>
        <span>&gt;</span>
        <span className="font-semibold text-[#F2CA50]">Manual Payment Verification</span>
      </nav>

      {/* Hero Section */}
      <PaymentVerificationHero
        orderNumber={currentPayment?.orderId?.orderNumber || "—"}
        paymentAmount={activeAmount}
        orderDate={currentPayment?.orderId?.orderDate || currentPayment?.createdAt}
        currency="LKR"
      />

      {/* Stepper Section */}
      <div className="mt-12 mb-10 w-full px-2 lg:px-8">
        <PaymentStepper currentStatus={paymentStatus} />
      </div>

      {error && !needsEmailGate && (
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        {/* Left Column: Instructions & Upload */}
        <div className="space-y-8 min-w-0">
          
          {isExpired ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[24px] border border-amber-500/20 bg-amber-500/5 p-6 sm:p-8 text-sm text-amber-100">
              <div className="se-label flex items-center gap-2 text-[10px] tracking-[0.28em] text-amber-400">
                <ShieldAlert className="h-5 w-5" /> Reservation Expired
              </div>
              <p className="mt-3 leading-6 text-amber-200/70">
                This transfer window has closed. The items have been released back to the atelier.
              </p>
              {isAuthenticated && resolvedOrderId && (
                <button onClick={handleGenerateAgain} className="se-label mt-5 flex h-[52px] items-center justify-center gap-2 rounded-2xl border border-amber-500/30 px-6 text-[10px] tracking-[0.25em] text-amber-300 transition hover:bg-amber-500/10">
                  <RotateCcw className="h-4 w-4" /> Request New Reference
                </button>
              )}
            </motion.div>
          ) : (
            <>
              {isRejected && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[24px] border border-rose-500/20 bg-rose-500/5 p-6 sm:p-8 text-sm text-rose-100">
                  <div className="se-label flex items-center gap-2 text-[10px] tracking-[0.28em] text-rose-400">
                    <ShieldAlert className="h-5 w-5" /> Verification Rejected
                  </div>
                  <p className="mt-3 leading-6 text-rose-200/70">
                    {currentPayment?.rejectionReason || "We couldn't verify the receipt you uploaded. Please upload a clearer image where the amount and reference are legible."}
                  </p>
                </motion.div>
              )}

              <PaymentInstructionSteps />
              
              <ProofSubmission
                isSubmitting={isSubmitting}
                onSubmitProof={handleSubmitProof}
                title={isRejected ? "Upload Clearer Receipt" : "Upload Payment Receipt"}
                description="Choose the bank receipt image or PDF. Ensure it is clear and legible."
              />
            </>
          )}

          <VerificationTimeline paymentStatus={paymentStatus} payment={currentPayment} />
          
          <PaymentFAQ />
        </div>

        {/* Right Column: Bank Details, Summary, Support */}
        <div className="space-y-8 flex flex-col items-center lg:items-start">
          <BankDetailsCard
            bankDetails={bankDetails}
            referenceNumber={activeReferenceNumber}
            amount={activeAmount}
            currency="LKR"
          />
          
          <PaymentSummaryCard
            orderNumber={currentPayment?.orderId?.orderNumber || "—"}
            orderDate={currentPayment?.orderId?.orderDate || currentPayment?.createdAt}
            customerName={currentPayment?.orderId?.addressInfo?.name || "—"}
            paymentAmount={activeAmount}
            currency="LKR"
            paymentMethod="Manual Bank Transfer"
            orderStatus={currentPayment?.orderId?.orderStatus || "Pending"}
            paymentStatus={paymentStatus}
          />
          
          <ContactSupportSection
            bankDetails={bankDetails}
            referenceNumber={activeReferenceNumber}
          />
        </div>
      </div>
    </div>
  );
};

export default ManualPaymentPage;
