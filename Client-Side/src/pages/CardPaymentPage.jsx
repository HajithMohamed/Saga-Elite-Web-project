import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { CheckCircle2, CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";

import { toast } from "@/hooks/use-toast";
import {
  fetchPayHereConfig,
  initiatePayHerePayment,
  fetchCardPaymentStatus,
} from "@/api/cardPaymentAPI";
import { cn } from "@/lib/utils";

const MOTION_EASE = [0.16, 1, 0.3, 1];

const formatLKR = (value) =>
  Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Persist just enough context (payment reference + guest email) to confirm the
// payment status after PayHere redirects the browser back to this page.
const storePayHereContext = (orderId, reference, email) => {
  try {
    if (reference) window.sessionStorage.setItem(`payhere_ref_${orderId}`, reference);
    if (email) window.sessionStorage.setItem(`payhere_email_${orderId}`, email);
  } catch {
    /* sessionStorage unavailable — non-fatal */
  }
};

const readStored = (key) => {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

// One-shot guard so the Back button (which lands on this page WITHOUT a
// ?payment param) doesn't bounce the customer straight back into PayHere.
const markRedirected = (orderId) => {
  try {
    window.sessionStorage.setItem(`payhere_started_${orderId}`, "1");
  } catch {
    /* ignore */
  }
};
const wasRedirected = (orderId) => readStored(`payhere_started_${orderId}`) === "1";
const clearRedirected = (orderId) => {
  try {
    window.sessionStorage.removeItem(`payhere_started_${orderId}`);
  } catch {
    /* ignore */
  }
};

// PayHere Checkout API redirect: POST a self-submitting hidden form to the
// (sandbox or live) checkout URL. Card details are entered on PayHere's
// PCI-DSS window — they never touch our servers.
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

const redirectToPayHere = (checkoutUrl, payment) => {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = checkoutUrl;
  PAYHERE_FORM_FIELDS.forEach((key) => {
    const value = payment[key];
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

const PageHeader = () => (
  <header className="sticky top-0 z-40 border-b border-ink/5 bg-page/85 backdrop-blur-xl">
    <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-4 md:px-8">
      <Link to="/shopping/home" className="flex flex-col leading-none">
        <span className="se-serif text-2xl tracking-[0.18em] text-ink-2">SAGA ELITE</span>
        <span className="se-label mt-1 text-[9px] tracking-[0.32em] text-muted">
          Rare Fit Forever
        </span>
      </Link>
      <div className="flex items-center gap-2 rounded-full border border-gold-ink/20 bg-gold/5 px-4 py-2">
        <Lock className="h-3.5 w-3.5 text-gold-ink" />
        <span className="se-label text-[9px] tracking-[0.28em] text-cream">
          <span className="hidden sm:inline">Secure Checkout · </span>SSL Protected
        </span>
      </div>
    </div>
  </header>
);

const SuccessPanel = ({ reference, verified }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: MOTION_EASE }}
    className="rounded-[2rem] border border-gold-ink/10 bg-page p-6 sm:p-10"
  >
    <div className="mx-auto flex max-w-md flex-col items-center text-center">
      <div className="rounded-full bg-gold/10 p-5">
        <CheckCircle2 className="h-10 w-10 text-gold-ink" />
      </div>
      <h2 className="se-serif mt-6 text-2xl text-ink-2">Payment successful</h2>
      {reference ? (
        <p className="se-body mt-3 text-sm text-muted">
          Reference <span className="se-mono text-ink-2">{reference}</span>
        </p>
      ) : null}
      <p className="se-body mt-5 text-sm text-cream">
        {verified
          ? "Your card payment was successful and your order is confirmed. A confirmation email is on its way."
          : "We received your payment and are confirming it with the gateway. Your order will update within a few minutes — no further action needed."}
      </p>
      <Link
        to="/shopping/orders"
        className="se-label mt-8 inline-flex items-center gap-2 rounded-full border border-gold-ink/30 bg-gold/5 px-6 py-3 text-[10px] tracking-[0.28em] text-gold-ink transition-colors hover:bg-gold/15"
      >
        View my orders
      </Link>
    </div>
  </motion.div>
);

const CardPaymentPage = () => {
  const { orderId: orderIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);
  const userEmail = useSelector((state) => state.auth?.user?.email);
  const userName = useSelector((state) => state.auth?.user?.name);

  // Order id survives a hard refresh via the URL; amount/email come from the
  // checkout navigation state or the ?email= query.
  const orderId = orderIdParam || location.state?.orderId || null;
  const presetAmount = location.state?.amount || null;
  const presetEmail =
    searchParams.get("email") || location.state?.email || userEmail || "";

  // loading → probing config; payhere → gateway ready; unavailable → not configured.
  const [gatewayMode, setGatewayMode] = useState("loading");
  const [phState, setPhState] = useState("idle"); // idle | initiating | redirecting | confirming | failed
  const [payReference, setPayReference] = useState(null);
  const [email, setEmail] = useState(presetEmail);
  const [emailError, setEmailError] = useState(null);
  const [submitted, setSubmitted] = useState(null);

  const guestEmail = () => (email || presetEmail || "").trim().toLowerCase();

  useEffect(() => {
    if (presetEmail && !email) setEmail(presetEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetEmail]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const config = await fetchPayHereConfig();
        if (active) setGatewayMode(config?.enabled ? "payhere" : "unavailable");
      } catch {
        if (active) setGatewayMode("unavailable");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Poll the payment record after returning from PayHere — the notify webhook
  // confirms the charge asynchronously, so we wait for it to flip to verified.
  const pollUntilResolved = async (reference, pollEmail) => {
    for (let i = 0; i < 10; i += 1) {
      try {
        const status = await fetchCardPaymentStatus({ reference, email: pollEmail });
        if (status?.status === "verified") return "verified";
        if (status?.status === "rejected") return "rejected";
      } catch {
        // transient — keep polling
      }
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    return "pending";
  };

  const startPayHere = async () => {
    if (!orderId) return;
    if (!isAuthenticated && !guestEmail()) {
      setEmailError("Please enter the email used at checkout.");
      return;
    }

    setPhState("initiating");
    try {
      const init = await initiatePayHerePayment({
        orderId,
        email: isAuthenticated ? undefined : guestEmail(),
        customerName: userName || undefined,
      });

      if (!init?.payment || !init?.checkoutUrl) {
        throw new Error("Could not start the payment. Please try again.");
      }

      storePayHereContext(orderId, init.referenceNumber, isAuthenticated ? "" : guestEmail());
      markRedirected(orderId);
      setPhState("redirecting");
      redirectToPayHere(init.checkoutUrl, init.payment);
    } catch (err) {
      setPhState("idle");
      toast({
        title: "Couldn't start payment",
        description: typeof err === "string" ? err : err?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle the return from PayHere (?payment=success|cancelled), and otherwise
  // auto-launch the gateway so card checkout goes straight to PayHere.
  useEffect(() => {
    if (gatewayMode !== "payhere" || !orderId) return;

    const outcome = searchParams.get("payment");

    if (outcome === "cancelled") {
      clearRedirected(orderId);
      toast({
        title: "Payment cancelled",
        description: "You can try the card payment again below.",
      });
      return;
    }

    if (outcome === "success") {
      const ref = readStored(`payhere_ref_${orderId}`);
      clearRedirected(orderId);
      if (!ref) {
        setSubmitted({ reference: null, verified: false });
        return;
      }
      setPayReference(ref);
      setPhState("confirming");
      const pollEmail = isAuthenticated
        ? undefined
        : readStored(`payhere_email_${orderId}`) || presetEmail;
      (async () => {
        const result = await pollUntilResolved(ref, pollEmail);
        if (result === "rejected") {
          setPhState("failed");
          toast({
            title: "Payment failed",
            description: "The payment couldn't be completed. Please try again.",
            variant: "destructive",
          });
          return;
        }
        setPhState("idle");
        setSubmitted({ reference: ref, verified: result === "verified" });
      })();
      return;
    }

    // Fresh visit (no ?payment): go straight to PayHere. The one-shot guard
    // stops the Back button from bouncing the customer into a redirect loop,
    // and guests without an email get the prompt below instead.
    if (!wasRedirected(orderId) && (isAuthenticated || guestEmail())) {
      startPayHere();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatewayMode]);

  if (!orderId) {
    return (
      <div className="min-h-screen bg-page text-ink-2">
        <PageHeader />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="se-serif text-3xl">Card payment unavailable</h1>
          <p className="se-body mt-4 text-sm text-muted">
            We couldn't find an order to pay for on this link. Please return to checkout to
            place your order again.
          </p>
          <button
            type="button"
            onClick={() => navigate("/shopping/checkout")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-[10px] tracking-[0.28em] text-black uppercase"
          >
            Return to checkout
          </button>
        </main>
      </div>
    );
  }

  const phBusy =
    phState === "initiating" || phState === "redirecting" || phState === "confirming";

  return (
    <div className="min-h-screen bg-page text-ink-2 pb-20">
      <PageHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 md:py-14 space-y-8">
        <div>
          <p className="se-label text-[10px] tracking-[0.32em] text-muted">Step 4 of 4</p>
          <h1 className="se-serif mt-2 text-3xl sm:text-4xl text-ink-2">Card payment</h1>
          <p className="se-body mt-2 text-sm text-muted">
            Order reference <span className="se-mono text-cream">{orderId}</span>
          </p>
        </div>

        {submitted ? (
          <SuccessPanel reference={submitted.reference} verified={submitted.verified} />
        ) : gatewayMode === "loading" ? (
          <div className="flex items-center justify-center rounded-[2rem] border border-gold-ink/10 bg-page p-16">
            <Loader2 className="h-6 w-6 animate-spin text-gold-ink" />
          </div>
        ) : phState === "confirming" ? (
          <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-gold-ink/10 bg-page p-10 text-center sm:p-16">
            <Loader2 className="h-8 w-8 animate-spin text-gold-ink" />
            <p className="se-serif text-xl text-ink-2">Confirming your payment…</p>
            <p className="se-body max-w-sm text-sm text-muted">
              We're verifying your card payment with PayHere. This usually takes a few seconds —
              please don't close this page.
            </p>
          </div>
        ) : gatewayMode === "unavailable" ? (
          <div className="rounded-[2rem] border border-gold-ink/10 bg-page p-6 sm:p-10 text-center">
            <h2 className="se-serif text-2xl text-ink-2">Card payment is unavailable</h2>
            <p className="se-body mt-4 text-sm text-muted">
              Online card payment isn't available right now. Please return to checkout and choose
              <strong className="text-ink-2"> Manual Bank Transfer</strong> to complete your order.
            </p>
            <button
              type="button"
              onClick={() => navigate("/shopping/checkout")}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-[10px] tracking-[0.28em] text-black uppercase"
            >
              Return to checkout
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: MOTION_EASE }}
            className="rounded-[2rem] border border-gold-ink/10 bg-page p-6 sm:p-10 space-y-6"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-gold-ink" />
              <span className="se-label text-[10px] tracking-[0.28em] text-gold-ink">
                Secure card payment · PayHere
              </span>
            </div>

            {presetAmount ? (
              <div className="rounded-2xl border border-ink/5 bg-panel px-5 py-4">
                <p className="se-label text-[9px] tracking-[0.32em] text-muted">Amount due</p>
                <p className="se-instrument mt-1 text-2xl text-accent">
                  LKR {formatLKR(presetAmount)}
                </p>
              </div>
            ) : null}

            <p className="se-body text-sm text-muted">
              You'll be taken to PayHere — Sri Lanka's trusted payment gateway — to enter your card
              details securely. Your card details are never stored on our servers. Visa, Mastercard
              and Amex are accepted.
            </p>

            {!isAuthenticated ? (
              <div>
                <label className="se-label block text-[9px] uppercase tracking-[0.28em] text-muted mb-2">
                  Email used at checkout
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(null);
                  }}
                  placeholder="you@example.com"
                  className="w-full bg-page border border-line/40 rounded-xl px-4 py-3 text-ink-2 placeholder-line focus:border-accent focus:outline-none transition-colors"
                />
                {emailError ? <p className="mt-2 text-xs text-rose-400">{emailError}</p> : null}
              </div>
            ) : null}

            <button
              type="button"
              onClick={startPayHere}
              disabled={phBusy}
              className={cn(
                "w-full h-14 bg-accent text-black font-bold uppercase tracking-[0.2em] text-sm",
                "hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-3",
              )}
            >
              {phBusy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Redirecting to PayHere…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Pay {presetAmount ? `LKR ${formatLKR(presetAmount)}` : "securely"} with PayHere
                </>
              )}
            </button>

            {payReference ? (
              <p className="text-center text-[10px] uppercase tracking-widest text-line">
                Reference {payReference}
              </p>
            ) : null}

            <div className="grid grid-cols-3 gap-4 pt-2 text-center">
              <div className="flex flex-col items-center gap-2 text-muted">
                <Lock size={16} />
                <span className="text-[9px] uppercase tracking-widest">PCI-DSS</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-muted">
                <ShieldCheck size={16} />
                <span className="text-[9px] uppercase tracking-widest">3-D Secure</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-muted">
                <CreditCard size={16} />
                <span className="text-[9px] uppercase tracking-widest">Visa · MC · Amex</span>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default CardPaymentPage;
