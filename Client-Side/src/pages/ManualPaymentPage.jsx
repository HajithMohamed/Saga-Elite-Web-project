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
  ShieldCheck,
  Eye,
  Timer,
  Phone,
  Scan,
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
import { cn } from "@/lib/utils";

const MOTION_EASE = [0.16, 1, 0.3, 1];

const PageHeader = () => (
  <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0a]/85 backdrop-blur-xl">
    <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-4 md:px-8">
      <Link to="/shopping/home" className="flex flex-col leading-none">
        <span className="se-serif text-2xl tracking-[0.18em] text-[#e5e2e1]">
          SAGA ELITE
        </span>
        <span className="se-label mt-1 text-[9px] tracking-[0.32em] text-[#99907c]">
          Rare Fit Forever
        </span>
      </Link>
      <div className="flex items-center gap-2 rounded-full border border-[#f2ca50]/20 bg-[#f2ca50]/5 px-4 py-2">
        <Lock className="h-3.5 w-3.5 text-[#f2ca50]" />
        <span className="se-label text-[9px] tracking-[0.28em] text-[#d0c5af]">
          <span className="hidden sm:inline">Secure Checkout · </span>SSL Protected
        </span>
      </div>
    </div>
  </header>
);

const VerticalTimeline = ({ currentStepId }) => {
  const steps = [
    { id: 'pending_payment', label: 'Transfer Payment' },
    { id: 'proof_submitted', label: 'Upload Receipt' },
    { id: 'pending_bank_confirmation', label: 'Bank Verification' },
    { id: 'verified', label: 'Order Confirmed' },
    { id: 'dispatch', label: 'Atelier Dispatch' }
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStepId) >= 0 
    ? steps.findIndex(s => s.id === currentStepId) 
    : 0;

  return (
    <div className="rounded-[2rem] border border-white/5 bg-[#0d0d0d] p-6 sm:p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#f2ca50]/5 to-transparent pointer-events-none" />
      <h3 className="se-label mb-6 text-[10px] tracking-[0.28em] text-[#f2ca50]">Reservation Progress</h3>
      
      <div className="relative pl-3">
        <div className="absolute left-[15px] top-2 bottom-4 w-px bg-white/10" />
        <div 
          className="absolute left-[15px] top-2 w-px bg-gradient-to-b from-[#f2ca50] to-[#ffe088] transition-all duration-1000 ease-in-out"
          style={{ height: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />
        
        <div className="space-y-6">
          {steps.map((step, index) => {
            const isComplete = index < currentIndex;
            const isActive = index === currentIndex;
            
            return (
              <div key={step.id} className="relative flex items-center gap-4">
                <div className={cn(
                  "relative z-10 flex h-3 w-3 shrink-0 items-center justify-center rounded-full transition-all duration-500",
                  isActive ? "bg-[#f2ca50] shadow-[0_0_12px_rgba(242,202,80,0.6)]" : 
                  isComplete ? "bg-[#f2ca50]" : "bg-[#1c1b1b] border border-white/20"
                )}>
                  {isActive && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f2ca50] opacity-40"></span>
                  )}
                </div>
                <span className={cn(
                  "se-label text-[10px] tracking-[0.2em] transition-colors duration-500",
                  isActive ? "text-[#f2ca50]" : 
                  isComplete ? "text-[#d0c5af]" : "text-[#574500]"
                ) }>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const OrderMiniSummary = ({ items, amount }) => {
  if (!items || items.length === 0) return null;
  const firstItem = items[0];
  const extraCount = items.length - 1;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: MOTION_EASE, delay: 0.1 }}
      className="mt-4 flex flex-col justify-between gap-4 rounded-3xl border border-white/5 bg-[#131313] p-5 sm:flex-row sm:items-center"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black border border-white/10 text-[#f2ca50]">
          <Eye className="h-5 w-5 opacity-50" />
        </div>
        <div>
          <p className="se-body text-sm font-medium text-[#e5e2e1] line-clamp-1">{firstItem.productName}</p>
          <p className="se-label mt-1 text-[9px] tracking-[0.2em] text-[#99907c]">
            {firstItem.quantity}x • {firstItem.color || 'Default'} {firstItem.size ? `• ${firstItem.size}` : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1 border-t border-white/5 pt-4 sm:border-t-0 sm:pt-0">
        <span className="se-mono text-sm tracking-wider text-[#f2ca50]">
          LKR {Number(amount).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
        </span>
        {extraCount > 0 && (
          <span className="se-label text-[9px] tracking-[0.2em] text-[#574500]">
            + {extraCount} more piece{extraCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </motion.div>
  );
};

const CountdownTimer = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();

    const update = () => {
      const now = new Date().getTime();
      const distance = target - now;
      if (distance < 0) {
        setTimeLeft("Expired");
        return;
      }
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${h}h ${m}m remaining`);
    };

    update();
    const interval = setInterval(update, 60000); // update every minute
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!timeLeft || timeLeft === "Expired") return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
      <Timer className="h-3.5 w-3.5 text-amber-400" />
      <span className="se-label text-[9px] tracking-[0.2em] text-amber-200">{timeLeft}</span>
    </div>
  );
};

const TrustIndicators = () => (
  <div className="mt-4 flex flex-wrap gap-3">
    {[
      { icon: Lock, text: "256-bit encrypted" },
      { icon: Scan, text: "Auto-verified" },
      { icon: ShieldCheck, text: "Secure Bank Transfer" },
      { icon: Eye, text: "Private handling" },
    ].map((item, i) => (
      <div key={i} className="flex items-center gap-1.5 text-xs text-[#574500]">
        <item.icon className="h-3.5 w-3.5 opacity-70" />
        <span className="tracking-wide">{item.text}</span>
      </div>
    ))}
  </div>
);

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
      <h1 className="se-serif text-4xl text-[#e5e2e1] sm:text-5xl">Your order is confirmed</h1>
      <p className="se-body mt-4 max-w-md mx-auto text-sm leading-6 text-[#d0c5af]">
        The atelier will begin preparation shortly. We've sent the receipt to your email and WhatsApp.
      </p>

      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        {orderId && (
          <Link
            to={`/shopping/order-tracking?orderId=${orderId}`}
            className="se-label inline-flex items-center justify-center gap-2 rounded-full bg-[#f2ca50] px-8 py-4 text-[10px] uppercase tracking-[0.28em] text-[#0a0a0a] transition hover:bg-[#ffe088] shadow-[0_0_20px_rgba(242,202,80,0.3)] hover:shadow-[0_0_30px_rgba(242,202,80,0.5)]"
          >
            Track Order <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        <Link
          to="/shopping/home"
          className="se-label inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-4 text-[10px] uppercase tracking-[0.28em] text-[#e5e2e1] transition hover:border-[#f2ca50]/40 hover:text-[#f2ca50]"
        >
          Return to Shop
        </Link>
      </div>
    </motion.div>
  </motion.div>
);

const DetailRow = ({ label, value, mono }) => (
  <div className="flex items-center justify-between border-b border-white/5 py-3.5 last:border-0">
    <span className="text-[10px] uppercase tracking-[0.24em] text-[#574500]">{label}</span>
    <span className={cn("text-sm text-[#e5e2e1]", mono && "font-mono tracking-[0.16em] text-[#f2ca50]")}>
      {value || "-"}
    </span>
  </div>
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
          className="se-label inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f2ca50] px-5 py-4 text-[10px] uppercase tracking-[0.28em] text-[#0a0a0a] transition hover:bg-[#ffe088] disabled:opacity-60"
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

  const waDigits = String(bankDetails.supportWhatsapp || "+94770704274").replace(/\D/g, "");
  const waMessage = activeReferenceNumber
    ? `Hi Saga Elite — I have a question about my bank transfer. Reference: ${activeReferenceNumber}.`
    : "Hi Saga Elite — I need help with my bank transfer.";
  const waHref = waDigits.length >= 8
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(waMessage)}`
    : null;

  if (
    !resolvedOrderId &&
    !resolvedReferenceNumber &&
    !currentPayment?.referenceNumber &&
    !lastGeneratedReference
  ) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white bg-grain">
        <PageHeader />
        <div className="flex min-h-[70vh] items-center justify-center px-6">
          <div className="max-w-xl rounded-[2rem] border border-white/5 bg-[#0d0d0d] p-8 text-center shadow-2xl">
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
                className="se-label inline-flex items-center justify-center gap-2 rounded-full bg-[#f2ca50] px-6 py-3 text-[10px] uppercase tracking-[0.28em] text-[#0a0a0a] transition hover:bg-[#ffe088]"
              >
                Find Payment
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (needsEmailGate || guestNeedsEmail) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white bg-grain">
        <PageHeader />
        <div className="mx-auto max-w-[1280px] px-4 pb-32 pt-16 md:px-8">
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
      <div className="min-h-screen bg-[#0a0a0a] text-white bg-grain">
        <PageHeader />
        <PremiumLoader />
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white bg-grain">
        <PageHeader />
        <CinematicSuccess orderId={activeOrderId} />
      </div>
    );
  }

  const isAwaitingBank = paymentStatus === "pending_bank_confirmation";
  const isProofSubmitted = paymentStatus === "proof_submitted";
  const isRejected = paymentStatus === "rejected";
  const needsAction = !isAwaitingBank && !isProofSubmitted && !isExpired;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white bg-grain relative">
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(242,202,80,0.05)_0%,transparent_70%)] pointer-events-none" />
      <PageHeader />
      
      <main className="relative z-10 mx-auto max-w-[1080px] px-4 pb-32 pt-8 md:px-6">
        
        {/* Reserved Banner */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: MOTION_EASE }}
          className="mb-8 rounded-[2rem] border border-[#f2ca50]/20 bg-[#f2ca50]/5 p-6 shadow-[0_0_60px_rgba(242,202,80,0.08)] backdrop-blur-sm sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
        >
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
              <p className="se-label text-[10px] tracking-[0.25em] text-[#e5e2e1]">Order Reserved</p>
            </div>
            <h1 className="se-serif mt-3 text-2xl text-[#f2ca50] sm:text-3xl">Your pieces are safely reserved.</h1>
            <p className="se-body mt-2 max-w-md text-sm leading-6 text-[#d0c5af]">
              The atelier holds these items exclusively for you. Complete the bank transfer to confirm.
            </p>
            {currentPayment?.orderId?.items && (
              <OrderMiniSummary items={currentPayment.orderId.items} amount={activeAmount} />
            )}
          </div>
          <div className="shrink-0 flex justify-end">
            <CountdownTimer expiresAt={currentPayment?.expiresAt} />
          </div>
        </motion.section>

        {error && !needsEmailGate ? (
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Main Column */}
          <div className="space-y-8">
            
            {/* Reference Hero */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: MOTION_EASE, delay: 0.1 }}
              className="rounded-[2.5rem] border border-[#f2ca50]/15 bg-[linear-gradient(180deg,rgba(212,175,55,0.05),transparent)] p-8 sm:p-10 shadow-[0_0_80px_rgba(242,202,80,0.05)]"
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end justify-between">
                <div>
                  <p className="se-serif text-sm italic text-[#d0c5af]">Your exclusive transaction identity</p>
                  <div className="mt-4 flex items-center gap-4">
                    <p className="se-mono text-4xl font-bold tracking-[0.15em] text-[#f2ca50] sm:text-5xl">
                      {activeReferenceNumber || "—"}
                    </p>
                  </div>
                  <p className="se-body mt-4 max-w-md text-sm leading-6 text-[#99907c]">
                    This exact code must be placed in the bank's remarks field. It is the only way we match your payment.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyReference}
                  disabled={!activeReferenceNumber}
                  className="shrink-0 inline-flex h-14 items-center justify-center gap-3 rounded-full border border-[#f2ca50]/30 bg-black px-6 text-[10px] uppercase tracking-[0.25em] text-[#f2ca50] transition hover:bg-[#f2ca50] hover:text-black disabled:opacity-50"
                >
                  <Copy className="h-4 w-4" />
                  Copy Identity
                </button>
              </div>

              <div className="mt-10 rounded-[2rem] border border-white/5 bg-[#0a0a0a]/50 p-6">
                <p className="se-label mb-4 text-[10px] tracking-[0.28em] text-[#574500]">Transfer Destination</p>
                <div className="grid gap-x-10 gap-y-1 sm:grid-cols-2">
                  <DetailRow label="Bank" value={bankDetails.bankName} />
                  <DetailRow label="Branch" value={bankDetails.branch} />
                  <DetailRow label="Account" value={bankDetails.accountName} />
                  <DetailRow label="Number" value={bankDetails.accountNumber} mono />
                </div>
              </div>
              <TrustIndicators />
            </motion.section>

            {/* Status Messages */}
            {isExpired && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[2rem] border border-amber-500/20 bg-amber-500/5 p-6 text-sm text-amber-100">
                <div className="se-label flex items-center gap-2 text-[10px] tracking-[0.28em] text-amber-400">
                  <ShieldAlert className="h-4 w-4" /> Reservation Expired
                </div>
                <p className="mt-3 leading-6 text-amber-200/70">
                  This transfer window has closed. The pieces have been released back to the atelier.
                </p>
                {isAuthenticated && resolvedOrderId && (
                  <button onClick={handleGenerateAgain} className="se-label mt-5 inline-flex items-center gap-2 rounded-full border border-amber-500/30 px-5 py-3 text-[9px] tracking-[0.25em] text-amber-300 transition hover:bg-amber-500/10">
                    <RotateCcw className="h-3 w-3" /> Request New Reference
                  </button>
                )}
              </motion.div>
            )}

            {isRejected && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[2rem] border border-rose-500/20 bg-rose-500/5 p-6 text-sm text-rose-100">
                <div className="se-label flex items-center gap-2 text-[10px] tracking-[0.28em] text-rose-400">
                  <ShieldAlert className="h-4 w-4" /> Proof Rejected
                </div>
                <p className="mt-3 leading-6 text-rose-200/70">
                  {currentPayment?.rejectionReason || "The uploaded proof could not be verified. Please upload a clearer copy that shows the reference above."}
                </p>
              </motion.div>
            )}

            {(isAwaitingBank || isProofSubmitted) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[2rem] border border-sky-500/20 bg-sky-500/5 p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/10 text-sky-400 mb-5 relative">
                  {isAwaitingBank ? (
                    <div className="absolute inset-0 border-2 border-dashed border-sky-500/40 rounded-full animate-[spin_10s_linear_infinite]" />
                  ) : null}
                  <Clock3 className="h-6 w-6" />
                </div>
                <h3 className="se-serif text-2xl text-sky-100">Verification in progress</h3>
                <p className="se-body mt-3 text-sm leading-6 text-sky-200/70 max-w-md mx-auto">
                  {isAwaitingBank 
                    ? "Receipt accepted. We are securely communicating with the bank to confirm the credit. This usually takes a few minutes."
                    : "Receipt received. Our concierge team is manually reviewing the transfer details."}
                </p>
                <div className="mt-6 text-xs text-sky-500">You may close this page. We will notify you via email and WhatsApp.</div>
              </motion.div>
            )}

            {/* Upload Area */}
            {(needsAction || isRejected) && (
              <ProofSubmission
                isSubmitting={isSubmitting}
                onSubmitProof={handleSubmitProof}
                title={isRejected ? "Provide Clearer Proof" : "Submit Receipt"}
                description={isRejected ? "Ensure the reference and amount are clearly legible." : "Once transferred, drop the receipt here to begin verification."}
              />
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: MOTION_EASE, delay: 0.2 }}
            >
              <VerticalTimeline currentStepId={paymentStatus} />
            </motion.div>

            {/* Concierge Support Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: MOTION_EASE, delay: 0.3 }}
              className="rounded-[2rem] border border-white/5 bg-[#0d0d0d] p-6 sm:p-8"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1c1b1b] text-[#d0c5af] mb-5">
                <Phone className="h-4 w-4" />
              </div>
              <h3 className="se-serif text-xl text-[#e5e2e1]">Need assistance?</h3>
              <p className="se-body mt-2 text-sm leading-6 text-[#99907c]">
                Our private concierge is available to guide you through the transfer process. Replies usually within minutes.
              </p>
              
              <div className="mt-6 flex flex-col gap-3">
                {waHref && (
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className="se-label flex items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 py-3 text-[9px] tracking-[0.2em] text-emerald-400 transition hover:bg-emerald-500/20">
                    <MessageSquareText className="h-3.5 w-3.5" /> WhatsApp Concierge
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleSendLink}
                  disabled={isSendingLink || !paymentSlug}
                  className="se-label flex items-center justify-center gap-2 rounded-full border border-white/10 bg-transparent py-3 text-[9px] tracking-[0.2em] text-[#d0c5af] transition hover:bg-white/5"
                >
                  {isSendingLink ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                  Email This Page Link
                </button>
              </div>
            </motion.div>

            {/* Reassurance blocks */}
            <div className="rounded-[2rem] border border-white/5 bg-transparent p-6 text-center">
              <ShieldCheck className="h-6 w-6 text-[#574500] mx-auto mb-3" />
              <p className="se-body text-xs leading-5 text-[#574500]">
                We verify transfers securely multiple times daily. You will receive an official confirmation immediately upon clearance.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Floating Mobile WhatsApp */}
      {waHref && (
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)] transition hover:scale-110 md:hidden">
          <MessageSquareText className="h-6 w-6 text-white" />
        </a>
      )}
    </div>
  );
};

export default ManualPaymentPage;
