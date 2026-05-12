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
import { cn } from "@/lib/utils";

const MOTION_EASE = [0.16, 1, 0.3, 1];

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

const PageHeader = () => (
  <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0a]/85 backdrop-blur-xl">
    <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-4 md:px-8">
      <Link to="/shopping/home" className="flex flex-col leading-none">
        <span className="se-serif text-2xl tracking-[0.18em] text-[#e5e2e1]">SAGA ELITE</span>
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

const DemoBanner = () => (
  <div className="rounded-[2rem] border border-[#f2ca50]/30 bg-[#f2ca50]/10 p-5 sm:p-6">
    <div className="flex items-start gap-3">
      <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#f2ca50]" />
      <div>
        <p className="se-label text-[10px] tracking-[0.28em] text-[#f2ca50]">
          Demo Mode — No Real Charge
        </p>
        <p className="se-body mt-2 text-sm text-[#e5e2e1]">
          This is a sample gateway. Use test card{" "}
          <span className="se-mono text-[#f2ca50]">4111 1111 1111 1111</span> with any future
          expiry and 3-digit CVV. Our team will verify the sample transaction manually until the
          PayHere gateway is live.
        </p>
      </div>
    </div>
  </div>
);

const SubmittedPanel = ({ payment }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: MOTION_EASE }}
    className="rounded-[2rem] border border-[#f2ca50]/10 bg-[#0d0d0d] p-6 sm:p-10"
  >
    <div className="mx-auto flex max-w-md flex-col items-center text-center">
      <div className="rounded-full bg-[#f2ca50]/10 p-5">
        <CheckCircle2 className="h-10 w-10 text-[#f2ca50]" />
      </div>
      <h2 className="se-serif mt-6 text-2xl text-[#e5e2e1]">Card payment received</h2>
      <p className="se-body mt-3 text-sm text-[#99907c]">
        Reference{" "}
        <span className="se-mono text-[#e5e2e1]">{payment?.referenceNumber || "—"}</span>
      </p>
      <p className="se-body mt-5 text-sm text-[#d0c5af]">
        Our team is verifying your sample card transaction. You'll get an email and WhatsApp
        update once the order is confirmed — usually within a few minutes.
      </p>
      <Link
        to="/shopping/home"
        className="se-label mt-8 inline-flex items-center gap-2 rounded-full border border-[#f2ca50]/30 bg-[#f2ca50]/5 px-6 py-3 text-[10px] tracking-[0.28em] text-[#f2ca50] transition-colors hover:bg-[#f2ca50]/15"
      >
        Back to shopping
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

  // Pull amount + email from navigation state where possible; the order ID
  // comes from the URL so the customer can reload the page without losing
  // context (only the URL survives a hard refresh).
  const orderId = orderIdParam || location.state?.orderId || null;
  const presetAmount = location.state?.amount || null;
  const presetEmail =
    searchParams.get("email") || location.state?.email || userEmail || "";

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

  const brand = useMemo(() => detectBrand(form.cardNumber.replace(/\s/g, "")), [form.cardNumber]);

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
      <div className="min-h-screen bg-[#0a0a0a] text-[#e5e2e1]">
        <PageHeader />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="se-serif text-3xl">Card payment unavailable</h1>
          <p className="se-body mt-4 text-sm text-[#99907c]">
            We couldn't find an order to pay for on this link. Please return to checkout to
            place your order again.
          </p>
          <button
            type="button"
            onClick={() => navigate("/shopping/checkout")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f2ca50] px-6 py-3 text-[10px] tracking-[0.28em] text-black uppercase"
          >
            Return to checkout
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e2e1] pb-20">
      <PageHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 md:py-14 space-y-8">
        <div>
          <p className="se-label text-[10px] tracking-[0.32em] text-[#99907c]">
            Step 4 of 4
          </p>
          <h1 className="se-serif mt-2 text-3xl sm:text-4xl text-[#e5e2e1]">Card payment</h1>
          <p className="se-body mt-2 text-sm text-[#99907c]">
            Order reference <span className="se-mono text-[#d0c5af]">{orderId}</span>
          </p>
        </div>

        <DemoBanner />

        {submitted ? (
          <SubmittedPanel payment={submitted} />
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: MOTION_EASE }}
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-[#f2ca50]/10 bg-[#0d0d0d] p-6 sm:p-10 space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-[#f2ca50]" />
                <span className="se-label text-[10px] tracking-[0.28em] text-[#f2ca50]">
                  Card details
                </span>
              </div>
              {brand ? (
                <span className="se-label text-[10px] tracking-[0.28em] text-[#d0c5af]">
                  {brand}
                </span>
              ) : null}
            </div>

            {presetAmount ? (
              <div className="rounded-2xl border border-white/5 bg-[#131313] px-5 py-4">
                <p className="se-label text-[9px] tracking-[0.32em] text-[#99907c]">
                  Amount due
                </p>
                <p className="se-instrument mt-1 text-2xl text-[var(--accent)]">
                  LKR {formatLKR(presetAmount)}
                </p>
              </div>
            ) : null}

            <div>
              <label className="se-label block text-[9px] uppercase tracking-[0.28em] text-[#99907c] mb-2">
                Cardholder name
              </label>
              <input
                type="text"
                autoComplete="cc-name"
                value={form.cardholderName}
                onChange={handleChange("cardholderName")}
                placeholder="As printed on the card"
                className="w-full bg-[#0a0a0a] border border-[#4d4635]/40 rounded-xl px-4 py-3 text-[#e5e2e1] placeholder-[#4d4635] focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
              {errors.cardholderName ? (
                <p className="mt-2 text-xs text-rose-400">{errors.cardholderName}</p>
              ) : null}
            </div>

            <div>
              <label className="se-label block text-[9px] uppercase tracking-[0.28em] text-[#99907c] mb-2">
                Card number
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                value={form.cardNumber}
                onChange={handleChange("cardNumber")}
                placeholder="1234 5678 9012 3456"
                className="w-full bg-[#0a0a0a] border border-[#4d4635]/40 rounded-xl px-4 py-3 se-mono tracking-[0.2em] text-[#e5e2e1] placeholder-[#4d4635] focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
              {errors.cardNumber ? (
                <p className="mt-2 text-xs text-rose-400">{errors.cardNumber}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="se-label block text-[9px] uppercase tracking-[0.28em] text-[#99907c] mb-2">
                  Expiry (MM/YY)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  value={form.expiry}
                  onChange={handleChange("expiry")}
                  placeholder="MM/YY"
                  className="w-full bg-[#0a0a0a] border border-[#4d4635]/40 rounded-xl px-4 py-3 se-mono tracking-[0.2em] text-[#e5e2e1] placeholder-[#4d4635] focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
                {errors.expiry ? (
                  <p className="mt-2 text-xs text-rose-400">{errors.expiry}</p>
                ) : null}
              </div>
              <div>
                <label className="se-label block text-[9px] uppercase tracking-[0.28em] text-[#99907c] mb-2">
                  CVV
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={form.cvv}
                  onChange={handleChange("cvv")}
                  placeholder="•••"
                  className="w-full bg-[#0a0a0a] border border-[#4d4635]/40 rounded-xl px-4 py-3 se-mono tracking-[0.4em] text-[#e5e2e1] placeholder-[#4d4635] focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
                {errors.cvv ? (
                  <p className="mt-2 text-xs text-rose-400">{errors.cvv}</p>
                ) : null}
              </div>
            </div>

            {!isAuthenticated ? (
              <div>
                <label className="se-label block text-[9px] uppercase tracking-[0.28em] text-[#99907c] mb-2">
                  Email used at checkout
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="you@example.com"
                  className="w-full bg-[#0a0a0a] border border-[#4d4635]/40 rounded-xl px-4 py-3 text-[#e5e2e1] placeholder-[#4d4635] focus:border-[var(--accent)] focus:outline-none transition-colors"
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
              <div className="flex flex-col items-center gap-2 text-[#99907c]">
                <Lock size={16} />
                <span className="text-[9px] uppercase tracking-widest">Encrypted</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-[#99907c]">
                <ShieldCheck size={16} />
                <span className="text-[9px] uppercase tracking-widest">Admin verified</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-[#99907c]">
                <Sparkles size={16} />
                <span className="text-[9px] uppercase tracking-widest">Sample mode</span>
              </div>
            </div>
          </motion.form>
        )}
      </main>
    </div>
  );
};

export default CardPaymentPage;
