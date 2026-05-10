import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowRight, Loader2, Lock, Search } from "lucide-react";

import { toast } from "@/hooks/use-toast";
import {
  lookupManualPayment,
  setManualPaymentEmail,
} from "@/store/manualPaymentSlice";

const FindPaymentPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
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
              SSL Protected
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[640px] px-4 pb-24 pt-12 md:px-6">
        <div className="rounded-[2rem] border border-[#4d4635]/40 bg-[#0d0d0d] p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f2ca50]/40 bg-[#f2ca50]/10 text-[#f2ca50]">
              <Search className="h-4 w-4" />
            </div>
            <div>
              <p className="se-label text-[10px] tracking-[0.32em] text-[#f2ca50]">
                Find my payment
              </p>
              <h1 className="se-serif text-2xl text-[#e5e2e1]">Recover your payment link</h1>
            </div>
          </div>
          <p className="se-body mt-4 text-sm leading-6 text-[#99907c]">
            Enter the email you used at checkout along with your reference
            number or order ID. We'll take you straight to your payment page.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="se-label text-[10px] uppercase tracking-[0.28em] text-[#99907c]">
                Email used at checkout
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="mt-2 w-full rounded-2xl border border-[#4d4635]/40 bg-[#0a0a0a] px-4 py-3 text-sm text-[#e5e2e1] placeholder-[#574500] outline-none transition focus:border-[#f2ca50]"
              />
            </div>
            <div>
              <label className="se-label text-[10px] uppercase tracking-[0.28em] text-[#99907c]">
                Reference number or order ID
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="SE-20260509-XYZ123"
                className="mt-2 w-full rounded-2xl border border-[#4d4635]/40 bg-[#0a0a0a] px-4 py-3 font-mono text-sm tracking-[0.12em] text-[#e5e2e1] placeholder-[#574500] outline-none transition focus:border-[#f2ca50]"
              />
            </div>

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
              Find my payment
            </button>
          </form>

          <p className="mt-6 text-xs text-[#574500]">
            Still stuck?{" "}
            <a
              href="https://wa.me/94770704274"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f2ca50] hover:underline"
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
