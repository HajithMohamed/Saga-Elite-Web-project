import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
// eslint-disable-next-line no-unused-vars -- motion JSX
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API_V1_URL } from "@/lib/api";
import {
  ArrowLeft,
  Banknote,
  Beaker,
  CheckCircle2,
  Landmark,
  Loader2,
  MessageSquareText,
  ScanLine,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchManualPaymentById, verifyManualPayment } from "@/store/manualPaymentSlice";
import { useSocketEvent } from "@/hooks/use-socket-events";
import { pageVariants, modalBackdropVariants, modalCardVariants } from "@/components/admin-components/_shared/animations";
import { PrimaryButton, DangerButton } from "@/components/admin-components/_shared/Buttons";
import { ToastFlash } from "@/components/admin-components/_shared/ToastFlash";

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const PaymentVerificationPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { paymentId } = useParams();
  const { currentPayment, isAdminLoading, isVerifying } = useSelector((state) => state.manualPayment);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [proofLightboxOpen, setProofLightboxOpen] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // The dev endpoint is only mounted when NODE_ENV !== "production". Vite
  // exposes import.meta.env.PROD/MODE — we render the simulate button only
  // in non-prod builds. The server has its own guard so a stale build can't
  // exploit this client-side flag.
  const isDevBuild = import.meta.env?.MODE !== "production" && !import.meta.env?.PROD;

  useEffect(() => {
    if (!paymentId) return;
    queueMicrotask(() => {
      setRejectionReason("");
      setAdminNotes("");
    });
    dispatch(fetchManualPaymentById(paymentId));
  }, [dispatch, paymentId]);

  useSocketEvent(
    "payment:refresh",
    (payload) => {
      if (!paymentId) return;

      if (!payload?.paymentId || String(payload.paymentId) === String(paymentId)) {
        dispatch(fetchManualPaymentById(paymentId));
      }
    },
    [dispatch, paymentId]
  );

  useEffect(() => {
    if (!proofLightboxOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setProofLightboxOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [proofLightboxOpen]);

  const handleSimulateBankCredit = async ({ mismatch = false } = {}) => {
    if (!currentPayment?.referenceNumber) return;

    try {
      setIsSimulating(true);
      const amount = mismatch
        ? Number(currentPayment.amount || 0) + 100 // deliberately wrong
        : Number(currentPayment.amount || 0);
      await axios.post(
        `${API_V1_URL}/dev/simulate-bank-credit`,
        {
          referenceNumber: currentPayment.referenceNumber,
          amount,
          bankName: "Sampath Bank (simulated)",
        },
        { withCredentials: true }
      );

      toast({
        title: mismatch ? "Simulated mismatch credit" : "Simulated bank credit",
        description: mismatch
          ? "Bank reported a wrong amount — payment should now show amount mismatch."
          : "Bank confirmation simulated. Status should auto-flip to verified.",
        variant: "success",
      });

      // Re-fetch so the UI reflects the new state.
      await dispatch(fetchManualPaymentById(paymentId));
    } catch (error) {
      toast({
        title: "Simulation failed",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Could not simulate bank credit.",
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleDecision = async (action) => {
    if (!paymentId) return;

    if (action === "reject" && !rejectionReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a rejection reason before rejecting proof.",
        variant: "destructive",
      });
      return;
    }

    try {
      await dispatch(
        verifyManualPayment({
          paymentId,
          action,
          rejectionReason: action === "reject" ? rejectionReason : undefined,
          adminNotes,
        }),
      ).unwrap();

      toast({
        title: action === "approve" ? "Payment verified" : "Payment rejected",
        description: action === "approve" ? "The order has been marked confirmed." : "The customer has been notified.",
        variant: "success",
      });

      setSuccessFlash(true);
      window.setTimeout(() => navigate("/admin/payments/pending"), 1100);
    } catch (error) {
      toast({
        title: "Action failed",
        description: error || "Unable to complete this verification.",
        variant: "destructive",
      });
    }
  };

  if (isAdminLoading && !currentPayment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="flex items-center gap-3 text-gray-300">
          <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" /> Loading payment details…
        </div>
      </div>
    );
  }

  if (!currentPayment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
        <div className="max-w-xl rounded-[28px] border border-white/10 bg-[#0b0b0b] p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#D4AF37]">Manual Payment</p>
          <h1 className="mt-4 text-3xl font-black">Payment not found</h1>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            The selected payment record could not be loaded. Return to the queue and open another payment.
          </p>
          <Link
            to="/admin/payments/pending"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-black"
          >
            <ArrowLeft className="h-4 w-4" /> Back to queue
          </Link>
        </div>
      </div>
    );
  }

  const order = currentPayment.orderId || {};
  const customerEmail = order.user?.email || currentPayment.userId?.email || "Unknown";
  const statusTone = {
    pending_payment: "text-amber-300 border-amber-500/20 bg-amber-500/10",
    proof_submitted: "text-sky-300 border-sky-500/20 bg-sky-500/10",
    pending_bank_confirmation: "text-sky-300 border-sky-500/20 bg-sky-500/10",
    verified: "text-emerald-300 border-emerald-500/20 bg-emerald-500/10",
    rejected: "text-rose-300 border-rose-500/20 bg-rose-500/10",
    expired: "text-gray-300 border-gray-500/20 bg-gray-500/10",
  };

  const eyebrow = "text-[10px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]";

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#050505] px-6 py-8 text-white lg:px-8"
    >
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-white/10 bg-[#0b0b0b] px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#D4AF37]">Payment verification</p>
            <h1 className="mt-2 text-2xl font-black text-white">Review receipt and customer details</h1>
          </div>
          <Link
            to="/admin/payments/pending"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-[#D4AF37]/30"
          >
            <ArrowLeft className="h-4 w-4" /> Back to queue
          </Link>
        </div>

        <div className="max-w-xl">
          <ToastFlash
            show={successFlash}
            message={successFlash ? "Saved — returning to queue…" : ""}
          />
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6 rounded-[1.75rem] border border-[#D4AF37]/10 bg-[#0b0b0b] p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.24em] ${statusTone[currentPayment.status] || statusTone.pending_payment}`}>
                {currentPayment.status}
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-gray-300">
                {currentPayment.currency} {formatCurrency(currentPayment.amount)}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/5 bg-black/35 p-4">
                <p className={eyebrow}>Reference number</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="font-mono text-lg tracking-[0.2em] text-[#D4AF37]">{currentPayment.referenceNumber}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentPayment.referenceNumber);
                    }}
                    className="rounded-full border border-[#D4AF37]/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] transition hover:bg-[#D4AF37]/10 hover:text-white"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/35 p-4">
                <p className={eyebrow}>Customer email</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-white">{customerEmail}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(customerEmail);
                    }}
                    className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            {currentPayment.extensionGranted && (
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-400">Time Extension Granted</p>
                <p className="mt-1 text-sm text-blue-200">
                  Customer requested 12-hour extension at {currentPayment.extensionRequestedAt ? formatDateTime(currentPayment.extensionRequestedAt) : "unknown time"}.
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/5 bg-black/35 p-4">
                <p className={eyebrow}>Order ID</p>
                <p className="mt-2 break-all text-sm text-white">{order._id}</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/35 p-4">
                <p className={eyebrow}>Submitted at</p>
                <p className="mt-2 text-sm text-white">{formatDateTime(currentPayment.proofSubmittedAt)}</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/35 p-4">
                <p className={eyebrow}>Proof expires</p>
                <p className="mt-2 text-sm text-white">{formatDateTime(currentPayment.expiresAt)}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-white/5 bg-black/30">
              {currentPayment.proofUrl ? currentPayment.proofUrl.match(/\.pdf(\?|$)/i) ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 p-8 text-center text-gray-300">
                  <p className="text-sm uppercase tracking-[0.24em] text-gray-500">PDF proof</p>
                  <a
                    href={currentPayment.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-black"
                  >
                    Open receipt
                  </a>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setProofLightboxOpen(true)}
                  className="group relative block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                >
                  <img
                    src={currentPayment.proofUrl}
                    alt="Payment proof — tap to enlarge"
                    className="max-h-[520px] w-full cursor-zoom-in object-contain transition group-hover:opacity-95"
                  />
                  <span className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                    View full size
                  </span>
                </button>
              ) : (
                <div className="flex min-h-[360px] items-center justify-center text-sm text-gray-400">
                  No proof image stored.
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#0b0b0b] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Landmark className="h-4 w-4 text-[#D4AF37]" /> Order summary
              </div>
              <div className="mt-4 space-y-3 text-sm text-gray-300">
                <p>
                  <span className={eyebrow}>Order total</span>
                  <span className="mt-1 block text-base text-white">LKR {formatCurrency(order.totalAmount || currentPayment.amount)}</span>
                </p>
                <div>
                  <span className={eyebrow}>Contact number</span>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="block text-white">{order.contactNumber || "—"}</span>
                    {order.contactNumber && (
                      <a
                        href={`https://wa.me/${order.contactNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi, regarding your Saga Elite order ${currentPayment.referenceNumber}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-green-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-green-400 transition hover:bg-green-500/30"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
                <p>
                  <span className={eyebrow}>Order status</span>
                  <span className="mt-1 block text-white">{order.status || "—"}</span>
                </p>
                <p>
                  <span className={eyebrow}>Payment method</span>
                  <span className="mt-1 block text-white">{order.paymentMethod || "—"}</span>
                </p>
              </div>
            </div>

            {currentPayment.ocr?.processedAt ? (
              <div className="rounded-[1.75rem] border border-white/10 bg-[#0b0b0b] p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <ScanLine className="h-4 w-4 text-[#D4AF37]" /> OCR audit
                  </div>
                  {currentPayment.ocr.decision ? (
                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                        // ocr_matched (current) and auto_verified (legacy
                        // value from before bank confirmation existed) both
                        // mean "OCR found everything" — green badge.
                        currentPayment.ocr.decision === "ocr_matched" ||
                        currentPayment.ocr.decision === "auto_verified"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : currentPayment.ocr.decision === "auto_rejected"
                            ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                            : "border-sky-500/30 bg-sky-500/10 text-sky-300"
                      }`}
                    >
                      {currentPayment.ocr.decision.replace(/_/g, " ")}
                    </span>
                  ) : null}
                </div>
                <p className={`mt-2 ${eyebrow} text-gray-500`}>
                  Auto-decision based on receipt scan
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/5 bg-black/35 p-3">
                    <p className={eyebrow}>Extracted reference</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="font-mono text-sm text-white">
                        {currentPayment.ocr.extractedReference || "—"}
                      </span>
                      {currentPayment.ocr.referenceMatched === true ? (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                          MATCH
                        </span>
                      ) : currentPayment.ocr.referenceMatched === false ? (
                        <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                          NO MATCH
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-black/35 p-3">
                    <p className={eyebrow}>Extracted amount</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-sm text-white">
                        {currentPayment.ocr.extractedAmount != null
                          ? formatCurrency(currentPayment.ocr.extractedAmount)
                          : "—"}
                      </span>
                      {currentPayment.ocr.amountMatched === true ? (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                          MATCH
                        </span>
                      ) : currentPayment.ocr.amountMatched === false ? (
                        <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                          NO MATCH
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {currentPayment.ocr.decisionReason ? (
                  <p className="mt-4 rounded-2xl border border-white/5 bg-black/30 p-3 text-xs leading-5 text-gray-300">
                    {currentPayment.ocr.decisionReason}
                  </p>
                ) : null}

                {currentPayment.ocr.extractedText ? (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-[11px] uppercase tracking-[0.22em] text-gray-500 hover:text-[#D4AF37]">
                      Show full extracted text
                    </summary>
                    <pre className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/5 bg-black/40 p-3 text-[11px] leading-5 text-gray-300">
                      {currentPayment.ocr.extractedText}
                    </pre>
                  </details>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-[1.75rem] border border-white/10 bg-[#0b0b0b] p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Banknote className="h-4 w-4 text-[#D4AF37]" /> Bank confirmation
                </div>
                {currentPayment.bankVerification?.confirmed ? (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-300">
                    Confirmed
                  </span>
                ) : currentPayment.bankVerification?.amountMismatch ? (
                  <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-rose-300">
                    Amount mismatch
                  </span>
                ) : (
                  <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-sky-300">
                    Awaiting bank
                  </span>
                )}
              </div>
              <p className={`mt-2 ${eyebrow} text-gray-500`}>
                Bank-side credit notification — the only proof money landed
              </p>

              {currentPayment.bankVerification?.confirmed ||
              currentPayment.bankVerification?.emailMessageId ? (
                <>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/5 bg-black/35 p-3">
                      <p className={eyebrow}>Bank reference</p>
                      <p className="mt-1 font-mono text-sm text-white">
                        {currentPayment.bankVerification?.extractedReference || "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-black/35 p-3">
                      <p className={eyebrow}>Bank amount</p>
                      <p className="mt-1 text-sm text-white">
                        {currentPayment.bankVerification?.extractedAmount != null
                          ? formatCurrency(currentPayment.bankVerification.extractedAmount)
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-black/35 p-3">
                      <p className={eyebrow}>Source</p>
                      <p className="mt-1 text-sm text-white">
                        {currentPayment.bankVerification?.bankName || "—"}
                        {currentPayment.bankVerification?.source
                          ? ` · ${currentPayment.bankVerification.source}`
                          : ""}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-black/35 p-3">
                      <p className={eyebrow}>Confirmed at</p>
                      <p className="mt-1 text-sm text-white">
                        {formatDateTime(currentPayment.bankVerification?.confirmedAt)}
                      </p>
                    </div>
                    {currentPayment.bankVerification?.transactionId ? (
                      <div className="rounded-2xl border border-white/5 bg-black/35 p-3 sm:col-span-2">
                        <p className={eyebrow}>Bank transaction id</p>
                        <p className="mt-1 break-all font-mono text-sm text-white">
                          {currentPayment.bankVerification.transactionId}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {currentPayment.bankVerification?.amountMismatch ? (
                    <p className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs leading-5 text-rose-200">
                      Bank reported a different amount than the order total.
                      Compare the values above and verify manually before
                      confirming.
                    </p>
                  ) : null}

                  {currentPayment.bankVerification?.rawSnippet ? (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-[11px] uppercase tracking-[0.22em] text-gray-500 hover:text-[#D4AF37]">
                        Show bank email snippet
                      </summary>
                      <pre className="mt-3 max-h-60 overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/5 bg-black/40 p-3 text-[11px] leading-5 text-gray-300">
                        {currentPayment.bankVerification.rawSnippet}
                      </pre>
                    </details>
                  ) : null}
                </>
              ) : (
                <p className="mt-4 rounded-2xl border border-white/5 bg-black/30 p-3 text-xs leading-5 text-gray-400">
                  Awaiting bank notification — usually arrives within 2-5
                  minutes of the customer's transfer. If the bank email never
                  comes, manually verify in your banking app and approve below.
                </p>
              )}
            </div>

            {isDevBuild ? (
              <div className="rounded-[1.75rem] border border-amber-500/30 bg-amber-500/[0.06] p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                  <Beaker className="h-4 w-4" /> Test tools (dev only)
                </div>
                <p className={`mt-2 ${eyebrow} text-amber-300/70`}>
                  Hidden in production builds
                </p>
                <p className="mt-3 text-xs leading-5 text-gray-300">
                  Simulate a bank credit notification for this payment without
                  needing a real transfer. Calls the same code path as the
                  IMAP watcher and SMS webhook — end state will be identical
                  to a real bank confirmation.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleSimulateBankCredit({ mismatch: false })}
                    disabled={isSimulating}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSimulating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Simulate match
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateBankCredit({ mismatch: true })}
                    disabled={isSimulating}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/15 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-rose-200 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" /> Simulate mismatch
                  </button>
                </div>
              </div>
            ) : null}

            <div className="rounded-[1.75rem] border border-white/10 bg-[#0b0b0b] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <MessageSquareText className="h-4 w-4 text-[#D4AF37]" /> Admin notes
              </div>
              <p className={`mt-2 ${eyebrow} text-gray-500`}>Internal only</p>
              <textarea
                value={adminNotes}
                onChange={(event) => setAdminNotes(event.target.value)}
                placeholder="Optional internal note"
                className="mt-4 min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-[#0b0b0b] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldAlert className="h-4 w-4 text-[#D4AF37]" /> Rejection reason
              </div>
              <p className={`mt-2 ${eyebrow} text-gray-500`}>Required to reject</p>
              <textarea
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Required if rejecting proof"
                className="mt-4 min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
              />
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-stretch">
                <PrimaryButton
                  type="button"
                  onClick={() => handleDecision("approve")}
                  disabled={isVerifying}
                  className="inline-flex flex-1 items-center justify-center gap-2 !bg-emerald-400 !text-black hover:!bg-emerald-300 py-4 px-8 text-base font-black uppercase tracking-[0.18em]"
                >
                  {isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  Approve payment
                </PrimaryButton>
                <DangerButton
                  type="button"
                  onClick={() => handleDecision("reject")}
                  disabled={isVerifying}
                  className="inline-flex flex-1 items-center justify-center gap-2 py-4 px-8 text-base font-black uppercase tracking-[0.18em]"
                >
                  {isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <XCircle className="h-5 w-5" />}
                  Reject payment
                </DangerButton>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {proofLightboxOpen && currentPayment.proofUrl && !currentPayment.proofUrl.match(/\.pdf(\?|$)/i) ? (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-6"
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={() => setProofLightboxOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              variants={modalCardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[92vh] max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0b] p-3 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setProofLightboxOpen(false)}
                className="absolute right-4 top-4 z-10 rounded-full border border-white/20 bg-black/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white"
              >
                Close
              </button>
              <img
                src={currentPayment.proofUrl}
                alt="Payment proof enlarged"
                className="max-h-[85vh] w-full object-contain"
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
};

export default PaymentVerificationPage;