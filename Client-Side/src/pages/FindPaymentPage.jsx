import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, Loader2, Lock, Search, Upload } from "lucide-react";

import { toast } from "@/hooks/use-toast";
import {
  lookupManualPayment,
  setManualPaymentEmail,
  fetchMyPendingManualPayments,
  fetchGuestPendingManualPayments,
} from "@/store/manualPaymentSlice";

const FindPaymentPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isAuthenticated } = useSelector((state) => state.auth);
  const pendingPayments = useSelector(
    (state) => state.manualPayment?.pendingForCurrentVisitor ?? []
  );

  // Auto-recover via cookie/auth (Fix #1).
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMyPendingManualPayments());
    } else {
      dispatch(fetchGuestPendingManualPayments());
    }
  }, [dispatch, isAuthenticated]);

  const submit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedIdentifier = identifier.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast({
        title: "Invalid email",
        description: "Enter the email used at checkout.",
        variant: "destructive",
      });
      return;
    }
    if (!trimmedIdentifier) {
      toast({
        title: "Reference required",
        description: "Enter your reference number or order ID.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await dispatch(
        lookupManualPayment({ email: trimmedEmail, identifier: trimmedIdentifier })
      ).unwrap();
      const slug = result?.data?.slug;
      if (!slug) {
        throw new Error("Lookup did not return a payment slug");
      }
      dispatch(setManualPaymentEmail(trimmedEmail));
      navigate(
        `/shopping/manual-payment/${encodeURIComponent(slug)}?email=${encodeURIComponent(trimmedEmail)}`
      );
    } catch (lookupError) {
      toast({
        title: "Could not find payment",
        description:
          typeof lookupError === "string"
            ? lookupError
            : lookupError?.message || "Check the email and reference and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-page text-ink">
      <header className="sticky top-0 z-40 border-b border-card bg-page/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-4 md:px-8">
          <Link to="/shopping/home" className="flex flex-col leading-none">
            <span className="se-serif text-2xl tracking-[0.18em] text-ink-2">
              SAGA ELITE
            </span>
            <span className="se-label mt-1 text-[9px] tracking-[0.32em] text-muted">
              Rare Fit Forever
            </span>
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-line/40 bg-page px-4 py-2">
            <Lock className="h-3.5 w-3.5 text-gold-ink" />
            <span className="se-label text-[9px] tracking-[0.28em] text-cream">
              SSL Protected
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[640px] px-4 pb-24 pt-12 md:px-6 space-y-6">
        {pendingPayments.length > 0 && (
          <div className="rounded-[2rem] border border-amber-500/40 bg-amber-500/5 p-8">
            <p className="se-label text-[10px] tracking-[0.32em] text-amber-400">
              We found your payments
            </p>
            <h2 className="se-serif mt-2 text-xl text-ink">
              {pendingPayments.length === 1
                ? "1 payment is waiting"
                : `${pendingPayments.length} payments are waiting`}
            </h2>
            <ul className="mt-5 space-y-3">
              {pendingPayments.map((payment) => (
                <li
                  key={payment._id}
                  className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-black/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs uppercase tracking-widest text-amber-300">
                      Ref {payment.referenceNumber}
                    </p>
                    <p className="mt-1 text-sm text-ink">
                      LKR{" "}
                      {Number(payment.amount || 0).toLocaleString("en-LK", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p className="mt-1 text-xs text-amber-200/70">
                      Status: {String(payment.status || "").replace(/_/g, " ")}
                    </p>
                  </div>
                  <Link
                    to={`/shopping/manual-payment/${payment.slug}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-5 py-2 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-amber-400"
                  >
                    <Upload className="h-3.5 w-3.5" /> Upload receipt
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-[2rem] border border-line/40 bg-page p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-ink/40 bg-gold/10 text-gold-ink">
              <Search className="h-4 w-4" />
            </div>
            <div>
              <p className="se-label text-[10px] tracking-[0.32em] text-gold-ink">
                Find my payment
              </p>
              <h1 className="se-serif text-2xl text-ink-2">Recover your payment link</h1>
            </div>
          </div>
          <p className="se-body mt-4 text-sm leading-6 text-muted">
            Enter the email you used at checkout along with your reference
            number or order ID. We'll take you straight to your payment page.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="se-label text-[10px] uppercase tracking-[0.28em] text-muted">
                Email used at checkout
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="mt-2 w-full rounded-2xl border border-line/40 bg-page px-4 py-3 text-sm text-ink-2 placeholder-goldshadow outline-none transition focus:border-gold-ink"
              />
            </div>
            <div>
              <label className="se-label text-[10px] uppercase tracking-[0.28em] text-muted">
                Reference number or order ID
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="SE-20260509-XYZ123"
                className="mt-2 w-full rounded-2xl border border-line/40 bg-page px-4 py-3 font-mono text-sm tracking-[0.12em] text-ink-2 placeholder-goldshadow outline-none transition focus:border-gold-ink"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="se-label inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-ongold transition hover:bg-gold-hover disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Find my payment
            </button>
          </form>

          <p className="mt-6 text-xs text-goldshadow">
            Still stuck?{" "}
            <a
              href="https://wa.me/94770704274"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-ink hover:underline"
            >
              WhatsApp Saga Elite support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default FindPaymentPage;
