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
  CheckCircle2,
  Clock3,
  Copy,
  Landmark,
  Loader2,
  Lock,
  Mail,
  MessageSquareText,
  RotateCcw,
  Send,
  ShieldAlert,
} from "lucide-react";
import { motion } from "framer-motion";

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
  <nav aria-label="Checkout progress" className="mb-10 mt-2">
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
                {isComplete ? <Check className="h-4 w-4" strokeWidth={3} /> : step.id}
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

const STATUS_LABEL = {
  pending_payment: "Awaiting transfer",
  proof_submitted: "Proof submitted",
  pending_bank_confirmation: "Awaiting bank confirmation",
  verified: "Verified",
  rejected: "Proof rejected",
  expired: "Expired",
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
};

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
    <div className="mx-auto max-w-xl rounded-[2rem] border border-[#4d4635]/40 bg-[#0d0d0d] p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f2ca50]/40 bg-[#f2ca50]/10 text-[#f2ca50]">
          <Mail className="h-4 w-4" />
        </div>
        <div>
          <p className="se-label text-[10px] tracking-[0.32em] text-[#f2ca50]">
            Verify your order
          </p>
          <h1 className="se-serif text-2xl text-[#e5e2e1]">Confirm your email</h1>
        </div>
      </div>
      <p className="se-body mt-4 text-sm leading-6 text-[#99907c]">
        Enter the email you used at checkout. We use this to make sure only you
        can view and submit proof for this payment.
      </p>
      <form onSubmit={submit} className="mt-5 space-y-3">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
          className="w-full rounded-2xl border border-[#4d4635]/40 bg-[#0a0a0a] px-4 py-3 text-sm text-[#e5e2e1] placeholder-[#574500] outline-none transition focus:border-[#f2ca50]"
        />
        {error ? (
          <p className="text-xs text-rose-300">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="se-label inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f2ca50] px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-[#0a0a0a] transition hover:bg-[#ffe088] disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Continue
        </button>
      </form>
      <p className="mt-4 text-xs text-[#574500]">
        Don't have the link? <Link to="/shopping/find-payment" className="text-[#f2ca50] hover:underline">Find my payment</Link>
      </p>
    </div>
  );
};

const UploadNowPrompt = ({ onYes, onNo, isSending }) => (
  <div className="rounded-[2rem] border border-[#f2ca50]/30 bg-[#f2ca50]/5 p-6 sm:p-7">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f2ca50]/15 text-[#f2ca50]">
        <Clock3 className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <h2 className="se-serif text-xl text-[#e5e2e1]">Pay and upload now?</h2>
        <p className="se-body mt-2 text-sm leading-6 text-[#d0c5af]">
          Bank transfers can take a few minutes. If you can do it now, upload
          the receipt below. If you'd rather pay later, we'll email and WhatsApp
          this payment link so you can finish anytime within 24 hours.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onYes}
            className="se-label inline-flex items-center justify-center gap-2 rounded-full bg-[#f2ca50] px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-[#0a0a0a] transition hover:bg-[#ffe088]"
          >
            Upload now <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onNo}
            disabled={isSending}
            className="se-label inline-flex items-center justify-center gap-2 rounded-full border border-[#4d4635]/40 px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-[#e5e2e1] transition hover:border-[#f2ca50]/40 hover:text-[#f2ca50] disabled:opacity-60"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send me the link
          </button>
        </div>
      </div>
    </div>
  </div>
);

const DetailRow = ({ label, value, mono }) => (
  <div className="grid grid-cols-[110px_1fr] items-baseline gap-3 border-b border-white/5 py-3 last:border-0">
    <span className="text-[10px] uppercase tracking-[0.24em] text-[#574500]">{label}</span>
    <span className={cn("text-sm text-[#e5e2e1]", mono && "font-mono tracking-[0.16em] text-[#f2ca50]")}>
      {value || "-"}
    </span>
  </div>
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
  const authState = useSelector((state) => state.auth || {});
  const isAuthenticated = Boolean(
    authState.isAuthenticated || authState.user?._id || authState.user?.id
  );

  const [needsEmailGate, setNeedsEmailGate] = useState(false);
  const [showUploadPrompt, setShowUploadPrompt] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [isSendingLink, setIsSendingLink] = useState(false);

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

  const resolvedEmail =
    paymentContext?.email ||
    (emailParam ? emailParam.trim().toLowerCase() : "") ||
    "";

  // Authenticated users skip the gate. Guests need an email match before the
  // server returns payment data.
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
      // Don't bother fetching — the server will 401 without auth+email.
      // We'll show the email gate instead.
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

  const handleCopyReference = async () => {
    if (!currentPayment?.referenceNumber) return;
    try {
      await navigator.clipboard.writeText(currentPayment.referenceNumber);
      toast({
        title: "Copied",
        description: "Reference number copied to clipboard.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy the reference number.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitProof = async (file) => {
    if (!currentPayment?.referenceNumber) {
      throw new Error("Payment reference is not ready yet.");
    }

    const result = await dispatch(
      submitManualPaymentReceipt({
        referenceNumber: currentPayment.referenceNumber,
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
    }
  };

  const handleSendLink = async () => {
    const slug = currentPayment?.slug || paymentContext?.slug || paymentSlug;
    if (!slug) {
      toast({
        title: "Not ready yet",
        description: "Wait a moment for the reference to load.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingLink(true);
    try {
      const result = await dispatch(
        sendManualPaymentLink({ slug, email: resolvedEmail || undefined })
      ).unwrap();
      const target = [];
      if (result?.data?.emailSent && result?.data?.maskedEmail) {
        target.push(`email (${result.data.maskedEmail})`);
      }
      if (result?.data?.whatsAppSent && result?.data?.maskedPhone) {
        target.push(`WhatsApp (${result.data.maskedPhone})`);
      }
      toast({
        title: "Link sent",
        description: target.length
          ? `Payment link sent via ${target.join(" and ")}.`
          : "Payment link queued for delivery.",
        variant: "success",
      });
      setShowUploadPrompt(false);
    } catch (sendError) {
      toast({
        title: "Could not send link",
        description: sendError || "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSendingLink(false);
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

  const handleRequestExtension = async () => {
    const slug = currentPayment?.slug || paymentContext?.slug || paymentSlug;
    if (!slug) return;
    try {
      const data = await requestManualPaymentExtension({
        slug,
        email: resolvedEmail || undefined,
      });
      if (data?.success) {
        toast({
          title: "Extension granted",
          description: "Your payment deadline has been extended by 12 hours.",
          variant: "success",
        });
        dispatch(
          fetchMyManualPaymentStatus({
            referenceNumber: slug,
            email: resolvedEmail || undefined,
          })
        );
      } else {
        throw new Error(data?.message || "Failed to request extension");
      }
    } catch (extensionError) {
      toast({
        title: "Unable to request extension",
        description:
          extensionError?.response?.data?.message ||
          extensionError?.message ||
          "Could not request extension.",
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

  const waDigits = String(bankDetails.supportWhatsapp || "+94770704274").replace(/\D/g, "");
  const waMessage = activeReferenceNumber
    ? `Hi Saga Elite — I have made a bank transfer. My payment reference is: ${activeReferenceNumber}. Please confirm.`
    : "Hi Saga Elite — I need help with my bank transfer reference.";
  const waHref = waDigits.length >= 8
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(waMessage)}`
    : null;

  // No order context at all — point user to orders or find-payment.
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
              Open this page from the link we emailed you, or look it up below.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/shopping/find-payment"
                className="se-label inline-flex items-center justify-center gap-2 rounded-full bg-[#f2ca50] px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-[#0a0a0a] transition hover:bg-[#ffe088]"
              >
                Find my payment <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/shopping/orders"
                className="se-label inline-flex items-center justify-center gap-2 rounded-full border border-[#4d4635]/40 px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-[#e5e2e1] transition hover:border-[#f2ca50]/40 hover:text-[#f2ca50]"
              >
                Go to orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Guest must verify email before we render any payment data.
  if (needsEmailGate || guestNeedsEmail) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <PageHeader />
        <div className="mx-auto max-w-[1280px] px-4 pb-32 pt-8 md:px-8">
          <Stepper currentStep={3} />
          <EmailGate
            defaultEmail={resolvedEmail}
            onSubmit={handleEmailSubmit}
            isSubmitting={isFetching}
          />
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
              {activeOrderId ? (
                <Link
                  to={`/shopping/order-tracking?orderId=${activeOrderId}`}
                  className="se-label inline-flex items-center justify-center gap-2 rounded-full bg-[#f2ca50] px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-[#0a0a0a] transition hover:bg-[#ffe088]"
                >
                  Track order <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
              <Link
                to="/shopping/home"
                className="se-label inline-flex items-center justify-center gap-2 rounded-full border border-[#4d4635]/40 px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-[#e5e2e1] transition hover:border-[#f2ca50]/40 hover:text-[#f2ca50]"
              >
                Back to shop
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAwaitingBank = paymentStatus === "pending_bank_confirmation";
  const isProofSubmitted = paymentStatus === "proof_submitted";
  const isRejected = paymentStatus === "rejected";
  const showProofUploader =
    showUploader || isRejected || (!showUploadPrompt && !isAwaitingBank && !isProofSubmitted);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <PageHeader />
      <div className="mx-auto max-w-[920px] px-4 pb-32 pt-8 md:px-6">
        <Stepper currentStep={3} />

        {error && !needsEmailGate ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {/* ---------- Single reference + transfer card ---------- */}
        <section className="rounded-[2rem] border border-[#D4AF37]/20 bg-[linear-gradient(180deg,rgba(212,175,55,0.08),rgba(255,255,255,0.02))] p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[#f2ca50]">
                <Landmark className="h-3.5 w-3.5" />
                Bank transfer
              </div>
              <p className="se-label mt-4 text-[10px] uppercase tracking-[0.32em] text-[#99907c]">
                Your payment reference
              </p>
              <p className="se-serif mt-2 break-all font-mono text-3xl font-bold tracking-[0.12em] text-[#f2ca50] sm:text-4xl">
                {activeReferenceNumber || "—"}
              </p>
              <p className="se-body mt-3 max-w-md text-sm leading-6 text-[#d0c5af]">
                Write this exact code in the bank transfer remarks. Without it,
                we cannot match your payment.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:items-end">
              <button
                type="button"
                onClick={handleCopyReference}
                disabled={!activeReferenceNumber}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#D4AF37]/30 bg-black/30 px-5 text-sm font-semibold text-white transition hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                Copy reference
              </button>
              <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-left sm:text-right">
                <p className="text-[9px] uppercase tracking-[0.24em] text-[#574500]">Status</p>
                <p className="mt-1 text-sm font-semibold text-[#e5e2e1]">
                  {STATUS_LABEL[paymentStatus] || paymentStatus}
                </p>
                <p className="mt-1 text-[10px] text-[#574500]">
                  Expires {formatDateTime(currentPayment?.expiresAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
              <p className="se-label text-[10px] uppercase tracking-[0.28em] text-[#f2ca50]">
                Transfer details
              </p>
              <DetailRow
                label="Amount"
                value={`LKR ${Number(activeAmount || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                mono
              />
              <DetailRow label="Bank" value={bankDetails.bankName} />
              <DetailRow label="Branch" value={bankDetails.branch} />
              <DetailRow label="Account" value={bankDetails.accountName} />
              <DetailRow label="Number" value={bankDetails.accountNumber} mono />
              <DetailRow label="WhatsApp" value={bankDetails.supportWhatsapp} mono />
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
              <p className="se-label text-[10px] uppercase tracking-[0.28em] text-[#f2ca50]">
                What happens next
              </p>
              <ol className="mt-3 space-y-3">
                {[
                  "Transfer the exact total to the account.",
                  "Include the reference in the bank's remarks/note field.",
                  "Upload the receipt below — we'll match it automatically.",
                ].map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm leading-6 text-[#d0c5af]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#f2ca50]/30 bg-[#f2ca50]/10 text-[10px] font-bold text-[#f2ca50]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-5 text-amber-100">
                <strong className="text-amber-200">Pay within 24 hours</strong> to confirm your order.
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Upload now / send link prompt ---------- */}
        {!isAwaitingBank && !isProofSubmitted && !isExpired && showUploadPrompt && !showUploader ? (
          <div className="mt-6">
            <UploadNowPrompt
              onYes={() => {
                setShowUploader(true);
                setShowUploadPrompt(false);
              }}
              onNo={handleSendLink}
              isSending={isSendingLink}
            />
          </div>
        ) : null}

        {/* ---------- Status messaging ---------- */}
        {isExpired ? (
          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-100">
            <div className="se-label flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200">
              <ShieldAlert className="h-4 w-4" />
              Reference expired
            </div>
            <p className="mt-2 leading-6">
              This transfer window has expired. Generate a fresh reference to
              continue with the same order.
            </p>
            {isAuthenticated && resolvedOrderId ? (
              <button
                type="button"
                onClick={handleGenerateAgain}
                className="se-label mt-4 inline-flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-black transition hover:bg-amber-200"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Regenerate reference
              </button>
            ) : null}
          </div>
        ) : null}

        {isAwaitingBank ? (
          <div className="mt-6 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5 text-sm text-sky-100">
            <div className="se-label flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-sky-200">
              <Clock3 className="h-4 w-4" />
              Awaiting bank confirmation
            </div>
            <p className="mt-2 leading-6">
              Your receipt looks right. We're now waiting for your bank to
              notify us — usually within a few minutes. We'll email and WhatsApp
              the moment it confirms.
            </p>
          </div>
        ) : null}

        {isProofSubmitted ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm text-emerald-100">
            <div className="se-label flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              Receipt received
            </div>
            <p className="mt-2 leading-6">
              We received your transfer proof. Our team will verify it and
              email you once the order is confirmed.
            </p>
          </div>
        ) : null}

        {isRejected ? (
          <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-100">
            <div className="se-label flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-rose-200">
              <ShieldAlert className="h-4 w-4" />
              Proof rejected
            </div>
            <p className="mt-2 leading-6">
              {currentPayment?.rejectionReason ||
                "The uploaded proof was rejected. Upload a clearer copy of the slip that matches the reference above."}
            </p>
          </div>
        ) : null}

        {/* ---------- Proof uploader ---------- */}
        {showProofUploader && !isAwaitingBank && !isProofSubmitted && !isExpired ? (
          <div className="mt-6">
            <ProofSubmission
              isSubmitting={isSubmitting}
              onSubmitProof={handleSubmitProof}
              title={isRejected ? "Upload a new receipt" : "Upload proof of transfer"}
              description={
                isRejected
                  ? "Your last receipt was rejected. Upload a clearer copy that matches the reference above."
                  : "Choose the bank receipt image or PDF that matches the reference shown above."
              }
            />
          </div>
        ) : null}

        {/* ---------- Footer actions ---------- */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleSendLink}
            disabled={isSendingLink || !activePaymentSlug}
            className="se-label inline-flex items-center justify-center gap-2 rounded-2xl border border-[#4d4635]/40 bg-[#0d0d0d] px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-[#e5e2e1] transition hover:border-[#f2ca50]/40 hover:text-[#f2ca50] disabled:opacity-60"
          >
            {isSendingLink ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send this link to my email + WhatsApp
          </button>
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="se-label inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-600/15 px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-emerald-100 transition hover:bg-emerald-600/25"
            >
              <MessageSquareText className="h-4 w-4" />
              Message Saga Elite on WhatsApp
            </a>
          ) : null}
        </div>

        {paymentStatus === "pending_payment" &&
        expiresAtTime &&
        expiresAtTime - Date.now() < 3 * 60 * 60 * 1000 &&
        !currentPayment?.extensionGranted ? (
          <button
            type="button"
            onClick={handleRequestExtension}
            className="se-label mt-4 w-full rounded-2xl border border-[#4d4635] px-4 py-3 text-[10px] tracking-[0.26em] text-[#d0c5af] transition-colors hover:border-[#f2ca50] hover:text-[#f2ca50]"
          >
            Need more time? Request a 12-hour extension
          </button>
        ) : null}

        <p className="mt-6 text-center text-xs text-[#574500]">
          Lost this page? <Link to="/shopping/find-payment" className="text-[#f2ca50] hover:underline">Find my payment</Link>
          {isAuthenticated ? (
            <>
              {" · "}
              <Link to="/shopping/orders" className="text-[#f2ca50] hover:underline">My orders</Link>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
};

export default ManualPaymentPage;
