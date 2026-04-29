import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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

  useEffect(() => {
    if (paymentId) {
      setRejectionReason("");
      setAdminNotes("");
      dispatch(fetchManualPaymentById(paymentId));
    }
  }, [dispatch, paymentId]);

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

      navigate("/admin/manual-payments");
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
            to="/admin/manual-payments"
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

  return (
    <div className="min-h-screen bg-[#050505] px-6 py-8 text-white lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="flex items-center justify-between rounded-[1.75rem] border border-white/10 bg-[#0b0b0b] px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#D4AF37]">Payment verification</p>
            <h1 className="mt-2 text-2xl font-black text-white">Review receipt and customer details</h1>
          </div>
          <Link
            to="/admin/manual-payments"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-[#D4AF37]/30"
          >
            <ArrowLeft className="h-4 w-4" /> Back to queue
          </Link>
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
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Reference</p>
                <p className="mt-2 font-mono text-lg tracking-[0.2em] text-[#D4AF37]">{currentPayment.referenceNumber}</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Customer</p>
                <p className="mt-2 text-sm text-white">{customerEmail}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/5 bg-black/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Order ID</p>
                <p className="mt-2 break-all text-sm text-white">{order._id}</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Submitted</p>
                <p className="mt-2 text-sm text-white">{formatDateTime(currentPayment.proofSubmittedAt)}</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Expires</p>
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
                <a href={currentPayment.proofUrl} target="_blank" rel="noreferrer" className="block">
                  <img src={currentPayment.proofUrl} alt="Payment proof" className="max-h-[520px] w-full object-contain" />
                </a>
              ) : (
                <div className="flex min-h-[360px] items-center justify-center text-sm text-gray-400">
                  No proof image stored.
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#0b0b0b] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#D4AF37]">
                <Landmark className="h-4 w-4" /> Order summary
              </div>
              <div className="mt-4 space-y-3 text-sm text-gray-300">
                <p><span className="text-gray-500">Order total:</span> LKR {formatCurrency(order.totalAmount || currentPayment.amount)}</p>
                <p><span className="text-gray-500">Contact number:</span> {order.contactNumber || "—"}</p>
                <p><span className="text-gray-500">Order status:</span> {order.status || "—"}</p>
                <p><span className="text-gray-500">Payment method:</span> {order.paymentMethod || "—"}</p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-[#0b0b0b] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#D4AF37]">
                <MessageSquareText className="h-4 w-4" /> Admin notes
              </div>
              <textarea
                value={adminNotes}
                onChange={(event) => setAdminNotes(event.target.value)}
                placeholder="Optional internal note"
                className="mt-4 min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-[#0b0b0b] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#D4AF37]">
                <ShieldAlert className="h-4 w-4" /> Decision reason
              </div>
              <textarea
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Required if rejecting proof"
                className="mt-4 min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
              />
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleDecision("approve")}
                  disabled={isVerifying}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-sm font-black uppercase tracking-[0.22em] text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision("reject")}
                  disabled={isVerifying}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-5 py-3 text-sm font-black uppercase tracking-[0.22em] text-rose-200 transition hover:border-rose-500/40 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Reject
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerificationPage;