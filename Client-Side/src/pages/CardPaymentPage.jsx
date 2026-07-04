import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { toast } from "@/hooks/use-toast";
import { submitSampleCardPayment } from "@/store/manualPaymentSlice";
import {
  fetchPayHereConfig,
  initiatePayHerePayment,
  fetchCardPaymentStatus,
} from "@/api/cardPaymentAPI";
import { cn } from "@/lib/utils";

const MOTION_EASE = [0.16, 1, 0.3, 1];
const PAYHERE_SDK_URL = "https://www.payhere.lk/lib/payhere.js";

const formatLKR = (value) =>
  Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// PAN auto-format: 4-4-4-4 (or 4-4-4-7 for AmEx-length cards) with spaces.
const formatCardNumber = (raw) => {
  const digits = String(raw || "").replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
};

const detectBrand = (digits) => {
  const d = String(digits || "");
  if (/^4/.test(d)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  if (/^(6011|65|64[4-9])/.test(d)) return "Discover";
  return null;
};

const luhnOk = (digits) => {
  const s = String(digits || "").replace(/\D/g, "");
  if (s.length < 13 || s.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = s.length - 1; i >= 0; i -= 1) {
    let n = Number(s[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum > 0 && sum % 10 === 0;
};

// Load the PayHere onsite-checkout SDK once. The `sandbox` flag inside the
// payment object (not a different script) selects the sandbox gateway.
const loadPayHereSdk = () =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("PayHere is only available in the browser."));
      return;
    }
    if (window.payhere) {
      resolve(window.payhere);
      return;
    }
    const existing = document.querySelector(`script[src="${PAYHERE_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.payhere));
      existing.addEventListener("error", () =>
        reject(new Error("Could not load the payment gateway.")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = PAYHERE_SDK_URL;
    script.async = true;
    script.onload = () => resolve(window.payhere);
    script.onerror = () =>
      reject(new Error("Could not load the payment gateway. Check your connection and try again."));
    document.body.appendChild(script);
  });

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

const DemoBanner = () => (
  <div className="rounded-[2rem] border border-gold-ink/30 bg-gold/10 p-5 sm:p-6">
    <div className="flex items-start gap-3">
      <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold-ink" />
      <div>
        <p className="se-label text-[10px] tracking-[0.28em] text-gold-ink">
          Demo Mode — No Real Charge
        </p>
        <p className="se-body mt-2 text-sm text-ink-2">
          This is a sample gateway. Use test card{" "}
          <span className="se-mono text-gold-ink">4111 1111 1111 1111</span> with any future
          expiry and 3-digit CVV. Our team will verify the sample transaction manually until the
          PayHere gateway is live.
        </p>
      </div>
    </div>
  </div>
);

const SubmittedPanel = ({ payment, title, message }) => (
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
      <h2 className="se-serif mt-6 text-2xl text-ink-2">
        {title || "Card payment received"}
      </h2>
      <p className="se-body mt-3 text-sm text-muted">
        Reference{" "}
        <span className="se-mono text-ink-2">{payment?.referenceNumber || "—"}</span>
      </p>
      <p className="se-body mt-5 text-sm text-cream">
        {message ||
          "Our team is verifying your sample card transaction. You'll get an email and WhatsApp update once the order is confirmed — usually within a few minutes."}
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
  const dispatch = useDispatch();

  const isSubmitting = useSelector((state) => state.manualPayment?.isSubmitting);
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);
  const userEmail = useSelector((state) => state.auth?.user?.email);
  const userName = useSelector((state) => state.auth?.user?.name);

  // Pull amount + email from navigation state where possible; the order ID
  // comes from the URL so the customer can reload the page without losing
  // context (only the URL survives a hard refresh).
  const orderId = orderIdParam || location.state?.orderId || null;
  const presetAmount = location.state?.amount || null;
  const presetEmail =
    searchParams.get("email") || location.state?.email || userEmail || "";

  // Gateway resolution: "loading" until we know if PayHere is configured, then
  // "payhere" (real gateway) or "sample" (legacy demo form fallback).
  const [gatewayMode, setGatewayMode] = useState("loading");
  const [phState, setPhState] = useState("idle"); // idle | initiating | processing | confirming | failed
  const [payReference, setPayReference] = useState(null);

  const [form, setForm] = useState({
    cardholderName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    email: presetEmail,
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    if (presetEmail && !form.email) {
      setForm((prev) => ({ ...prev, email: presetEmail }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetEmail]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const config = await fetchPayHereConfig();
        if (!active) return;
        setGatewayMode(config?.enabled ? "payhere" : "sample");
      } catch {
        // If the config probe fails, fall back to the sample form so the
        // customer is never stranded without a way to pay.
        if (active) setGatewayMode("sample");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // A redirect-based return (rare — the popup uses callbacks) can land here with
  // ?payment=cancelled. Surface it once so the customer knows why nothing moved.
  useEffect(() => {
    if (searchParams.get("payment") === "cancelled") {
      toast({
        title: "Payment cancelled",
        description: "You can try the card payment again below.",
        variant: "default",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const brand = useMemo(() => detectBrand(form.cardNumber.replace(/\s/g, "")), [form.cardNumber]);

  const guestEmail = () =>
    (form.email || presetEmail || "").trim().toLowerCase();

  const handleChange = (field) => (event) => {
    let value = event.target.value;

    if (field === "cardNumber") {
      value = formatCardNumber(value);
    } else if (field === "expiry") {
      const digits = value.replace(/\D/g, "").slice(0, 4);
      value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    } else if (field === "cvv") {
      value = value.replace(/\D/g, "").slice(0, 4);
    }

    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Poll the payment record after the PayHere popup completes. The order is
  // confirmed asynchronously by the notify webhook, so we wait for "verified".
  const pollUntilResolved = async (reference) => {
    const email = isAuthenticated ? undefined : guestEmail();
    for (let i = 0; i < 10; i += 1) {
      try {
        const status = await fetchCardPaymentStatus({ reference, email });
        if (status?.status === "verified") return "verified";
        if (status?.status === "rejected") return "rejected";
      } catch {
        // transient — keep polling
      }
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    return "pending";
  };

  const handlePayHerePay = async () => {
    if (!orderId) return;

    if (!isAuthenticated && !guestEmail()) {
      setErrors({ email: "Please enter the email used at checkout." });
      return;
    }

    setPhState("initiating");
    try {
      const init = await initiatePayHerePayment({
        orderId,
        email: isAuthenticated ? undefined : guestEmail(),
        customerName: userName || undefined,
      });

      if (!init?.payment) {
        throw new Error("Could not start the payment. Please try again.");
      }

      const reference = init.referenceNumber;
      setPayReference(reference);

      const payhere = await loadPayHereSdk();

      payhere.onCompleted = async () => {
        setPhState("confirming");
        const result = await pollUntilResolved(reference);
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
        setSubmitted({ referenceNumber: reference, status: result });
        toast({
          title: "Payment successful",
          description:
            result === "verified"
              ? "Your order is confirmed."
              : "We're confirming your payment — your order will update shortly.",
          variant: "success",
        });
      };

      payhere.onDismissed = () => {
        setPhState("idle");
        toast({
          title: "Payment cancelled",
          description: "You closed the payment window before completing.",
        });
      };

      payhere.onError = (error) => {
        setPhState("idle");
        toast({
          title: "Payment error",
          description: String(error || "Something went wrong. Please try again."),
          variant: "destructive",
        });
      };

      setPhState("processing");
      payhere.startPayment(init.payment);
    } catch (err) {
      setPhState("idle");
      toast({
        title: "Couldn't start payment",
        description: typeof err === "string" ? err : err?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const validate = () => {
    const nextErrors = {};
    const rawCard = form.cardNumber.replace(/\s/g, "");

    if (!orderId) {
      nextErrors.form = "Missing order reference — please return to checkout and try again.";
    }
    if (!form.cardholderName.trim() || form.cardholderName.trim().length < 2) {
      nextErrors.cardholderName = "Enter the name printed on the card.";
    }
    if (!luhnOk(rawCard)) {
      nextErrors.cardNumber = "Card number isn't valid.";
    }

    const [monthStr, yearStr] = form.expiry.split("/");
    const month = Number.parseInt(monthStr, 10);
    const yearTwoDigit = Number.parseInt(yearStr, 10);
    const year = Number.isFinite(yearTwoDigit) ? 2000 + yearTwoDigit : NaN;
    const now = new Date();
    if (!month || month < 1 || month > 12 || !year) {
      nextErrors.expiry = "Use MM/YY.";
    } else {
      const end = new Date(year, month, 0, 23, 59, 59);
      if (end < now) {
        nextErrors.expiry = "Card has expired.";
      }
    }

    if (!/^\d{3,4}$/.test(form.cvv)) {
      nextErrors.cvv = "CVV must be 3 or 4 digits.";
    }

    if (!isAuthenticated && !form.email) {
      nextErrors.email = "Please enter the email used at checkout.";
    }

    setErrors(nextErrors);
    return { ok: Object.keys(nextErrors).length === 0, month, year, rawCard };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { ok, month, year, rawCard } = validate();
    if (!ok) {
      toast({
        title: "Check your card details",
        description: "A few fields need attention before we can process the payment.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await dispatch(
        submitSampleCardPayment({
          orderId,
          cardholderName: form.cardholderName.trim(),
          cardNumber: rawCard,
          expiryMonth: month,
          expiryYear: year,
          cvv: form.cvv,
          email: isAuthenticated ? undefined : form.email.trim().toLowerCase(),
        }),
      ).unwrap();

      setSubmitted(response?.data || response);
      toast({
        title: "Card payment received",
        description: "Verification in progress — we'll confirm your order shortly.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Payment failed",
        description: typeof err === "string" ? err : err?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

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

  const phBusy = phState === "initiating" || phState === "processing" || phState === "confirming";

  return (
    <div className="min-h-screen bg-page text-ink-2 pb-20">
      <PageHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 md:py-14 space-y-8">
        <div>
          <p className="se-label text-[10px] tracking-[0.32em] text-muted">
            Step 4 of 4
          </p>
          <h1 className="se-serif mt-2 text-3xl sm:text-4xl text-ink-2">Card payment</h1>
          <p className="se-body mt-2 text-sm text-muted">
            Order reference <span className="se-mono text-cream">{orderId}</span>
          </p>
        </div>

        {submitted ? (
          <SubmittedPanel
            payment={submitted}
            title={
              gatewayMode === "payhere" ? "Payment successful" : "Card payment received"
            }
            message={
              gatewayMode === "payhere"
                ? submitted?.status === "verified"
                  ? "Your card payment was successful and your order is confirmed. A confirmation email is on its way."
                  : "We received your payment and are confirming it with the gateway. Your order will update within a few minutes — no further action needed."
                : undefined
            }
          />
        ) : gatewayMode === "loading" ? (
          <div className="flex items-center justify-center rounded-[2rem] border border-gold-ink/10 bg-page p-16">
            <Loader2 className="h-6 w-6 animate-spin text-gold-ink" />
          </div>
        ) : gatewayMode === "payhere" ? (
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
                <p className="se-instrument mt-1 text-2xl text-[var(--accent)]">
                  LKR {formatLKR(presetAmount)}
                </p>
              </div>
            ) : null}

            <p className="se-body text-sm text-muted">
              You'll pay securely on PayHere — Sri Lanka's trusted payment gateway. Your card
              details are entered on PayHere's PCI-DSS secured window and are never stored on our
              servers. Visa, Mastercard and Amex are accepted.
            </p>

            {!isAuthenticated ? (
              <div>
                <label className="se-label block text-[9px] uppercase tracking-[0.28em] text-muted mb-2">
                  Email used at checkout
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="you@example.com"
                  className="w-full bg-page border border-line/40 rounded-xl px-4 py-3 text-ink-2 placeholder-line focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
                {errors.email ? (
                  <p className="mt-2 text-xs text-rose-400">{errors.email}</p>
                ) : null}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handlePayHerePay}
              disabled={phBusy}
              className={cn(
                "w-full h-14 bg-[var(--accent)] text-black font-bold uppercase tracking-[0.2em] text-sm",
                "hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-3",
              )}
            >
              {phBusy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {phState === "confirming" ? "Confirming payment…" : "Opening secure window…"}
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
        ) : (
          <>
            <DemoBanner />
            <motion.form
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: MOTION_EASE }}
              onSubmit={handleSubmit}
              className="rounded-[2rem] border border-gold-ink/10 bg-page p-6 sm:p-10 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-gold-ink" />
                  <span className="se-label text-[10px] tracking-[0.28em] text-gold-ink">
                    Card details
                  </span>
                </div>
                {brand ? (
                  <span className="se-label text-[10px] tracking-[0.28em] text-cream">
                    {brand}
                  </span>
                ) : null}
              </div>

              {presetAmount ? (
                <div className="rounded-2xl border border-ink/5 bg-panel px-5 py-4">
                  <p className="se-label text-[9px] tracking-[0.32em] text-muted">
                    Amount due
                  </p>
                  <p className="se-instrument mt-1 text-2xl text-[var(--accent)]">
                    LKR {formatLKR(presetAmount)}
                  </p>
                </div>
              ) : null}

              <div>
                <label className="se-label block text-[9px] uppercase tracking-[0.28em] text-muted mb-2">
                  Cardholder name
                </label>
                <input
                  type="text"
                  autoComplete="cc-name"
                  value={form.cardholderName}
                  onChange={handleChange("cardholderName")}
                  placeholder="As printed on the card"
                  className="w-full bg-page border border-line/40 rounded-xl px-4 py-3 text-ink-2 placeholder-line focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
                {errors.cardholderName ? (
                  <p className="mt-2 text-xs text-rose-400">{errors.cardholderName}</p>
                ) : null}
              </div>

              <div>
                <label className="se-label block text-[9px] uppercase tracking-[0.28em] text-muted mb-2">
                  Card number
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={form.cardNumber}
                  onChange={handleChange("cardNumber")}
                  placeholder="1234 5678 9012 3456"
                  className="w-full bg-page border border-line/40 rounded-xl px-4 py-3 se-mono tracking-[0.2em] text-ink-2 placeholder-line focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
                {errors.cardNumber ? (
                  <p className="mt-2 text-xs text-rose-400">{errors.cardNumber}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="se-label block text-[9px] uppercase tracking-[0.28em] text-muted mb-2">
                    Expiry (MM/YY)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={form.expiry}
                    onChange={handleChange("expiry")}
                    placeholder="MM/YY"
                    className="w-full bg-page border border-line/40 rounded-xl px-4 py-3 se-mono tracking-[0.2em] text-ink-2 placeholder-line focus:border-[var(--accent)] focus:outline-none transition-colors"
                  />
                  {errors.expiry ? (
                    <p className="mt-2 text-xs text-rose-400">{errors.expiry}</p>
                  ) : null}
                </div>
                <div>
                  <label className="se-label block text-[9px] uppercase tracking-[0.28em] text-muted mb-2">
                    CVV
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={form.cvv}
                    onChange={handleChange("cvv")}
                    placeholder="•••"
                    className="w-full bg-page border border-line/40 rounded-xl px-4 py-3 se-mono tracking-[0.4em] text-ink-2 placeholder-line focus:border-[var(--accent)] focus:outline-none transition-colors"
                  />
                  {errors.cvv ? (
                    <p className="mt-2 text-xs text-rose-400">{errors.cvv}</p>
                  ) : null}
                </div>
              </div>

              {!isAuthenticated ? (
                <div>
                  <label className="se-label block text-[9px] uppercase tracking-[0.28em] text-muted mb-2">
                    Email used at checkout
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    placeholder="you@example.com"
                    className="w-full bg-page border border-line/40 rounded-xl px-4 py-3 text-ink-2 placeholder-line focus:border-[var(--accent)] focus:outline-none transition-colors"
                  />
                  {errors.email ? (
                    <p className="mt-2 text-xs text-rose-400">{errors.email}</p>
                  ) : null}
                </div>
              ) : null}

              {errors.form ? (
                <p className="text-xs text-rose-400">{errors.form}</p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "w-full h-14 bg-[var(--accent)] text-black font-bold uppercase tracking-[0.2em] text-sm",
                  "hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-3",
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    Pay {presetAmount ? `LKR ${formatLKR(presetAmount)}` : "now"}
                  </>
                )}
              </button>

              <div className="grid grid-cols-3 gap-4 pt-2 text-center">
                <div className="flex flex-col items-center gap-2 text-muted">
                  <Lock size={16} />
                  <span className="text-[9px] uppercase tracking-widest">Encrypted</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-muted">
                  <ShieldCheck size={16} />
                  <span className="text-[9px] uppercase tracking-widest">Admin verified</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-muted">
                  <Sparkles size={16} />
                  <span className="text-[9px] uppercase tracking-widest">Sample mode</span>
                </div>
              </div>
            </motion.form>
          </>
        )}
      </main>
    </div>
  );
};

export default CardPaymentPage;
