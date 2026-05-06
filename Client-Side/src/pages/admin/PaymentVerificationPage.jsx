import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
// eslint-disable-next-line no-unused-vars -- motion JSX
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Landmark,
  Loader2,
  MessageSquareText,
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