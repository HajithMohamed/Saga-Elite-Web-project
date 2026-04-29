import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Filter, Landmark, Loader2, RefreshCcw, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchPendingManualPayments } from "@/store/manualPaymentSlice";

const statusOptions = ["proof_submitted", "pending_payment", "rejected", "verified", "expired"];

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

const PendingPaymentsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pendingPayments, pagination, isAdminLoading } = useSelector((state) => state.manualPayment);

  const [statusFilter, setStatusFilter] = useState("proof_submitted");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    dispatch(fetchPendingManualPayments({ status: statusFilter, page, limit }));
  }, [dispatch, page, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const filteredPayments = pendingPayments.filter((payment) => {
    const query = searchTerm.toLowerCase();
    const orderId = payment.orderId?._id || payment.orderId || "";
    const email = payment.orderId?.user?.email || payment.userId?.email || "";
    return (
      payment.referenceNumber?.toLowerCase().includes(query) ||
      orderId.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query)
    );
  });

  const handleRefresh = async () => {
    try {
      await dispatch(fetchPendingManualPayments({ status: statusFilter, page, limit })).unwrap();
      toast({
        title: "Queue refreshed",
        description: "Latest payment proofs have been loaded.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: error || "Could not refresh the payment queue.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] px-6 py-8 text-white lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-[2rem] border border-[#D4AF37]/15 bg-[linear-gradient(180deg,rgba(212,175,55,0.14),rgba(255,255,255,0.02)_50%,rgba(255,255,255,0.04)_100%)] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.35em] text-[#D4AF37]">Manual Payment Queue</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Review bank-transfer proofs without leaving the admin shell.
              </h1>
              <p className="mt-4 text-sm leading-7 text-gray-400">
                Proofs are sorted from oldest to newest so the oldest pending transfers can be cleared first.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-3 self-start rounded-full border border-[#D4AF37]/25 bg-black/70 px-5 py-3 text-sm font-semibold text-white transition hover:border-[#D4AF37]"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh queue
            </button>
          </div>
        </section>

        <section className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-[#0b0b0b] p-6 md:grid-cols-2 xl:grid-cols-[1.1fr_0.7fr_0.7fr]">
          <label className="space-y-2 text-sm text-gray-300">
            Search
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Reference, order ID, or customer email"
                className="w-full rounded-2xl border border-white/10 bg-black/80 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-[#D4AF37]"
              />
            </div>
          </label>

          <label className="space-y-2 text-sm text-gray-300">
            Status
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full appearance-none rounded-2xl border border-white/10 bg-black/80 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-[#D4AF37]"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-gray-400">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <Landmark className="h-4 w-4" />
              Current view
            </div>
            <p className="mt-2 text-white">{pagination.totalCount || 0} payment records in this queue.</p>
          </div>
        </section>

        {isAdminLoading ? (
          <div className="flex items-center justify-center rounded-[2rem] border border-white/10 bg-[#0b0b0b] py-16 text-gray-400">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-[#D4AF37]" /> Loading payment queue…
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-[#0b0b0b] p-10 text-center text-sm text-gray-400">
            No manual payments match the selected filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((payment) => {
              const order = payment.orderId || {};
              const customerEmail = order.user?.email || payment.userId?.email || "Unknown";

              return (
                <article
                  key={payment._id}
                  className="rounded-[1.75rem] border border-[#D4AF37]/10 bg-[#0b0b0b] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition hover:border-[#D4AF37]/25"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[#D4AF37]">
                          {payment.status}
                        </span>
                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-gray-300">
                          {payment.currency} {formatCurrency(payment.amount)}
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Reference</p>
                          <p className="mt-1 font-mono text-sm tracking-[0.2em] text-[#D4AF37]">{payment.referenceNumber}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Order ID</p>
                          <p className="mt-1 break-all text-sm text-white">{order._id}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Customer</p>
                          <p className="mt-1 text-sm text-white">{customerEmail}</p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/5 bg-black/35 p-4">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Submitted</p>
                          <p className="mt-2 text-sm text-white">{formatDateTime(payment.proofSubmittedAt)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/5 bg-black/35 p-4">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Expires</p>
                          <p className="mt-2 text-sm text-white">{formatDateTime(payment.expiresAt)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/5 bg-black/35 p-4">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Order total</p>
                          <p className="mt-2 text-sm text-white">LKR {formatCurrency(order.totalAmount || payment.amount)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:min-w-[220px]">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/manual-payments/${payment._id}`)}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-bold uppercase tracking-[0.22em] text-black transition hover:bg-[#c29a2d]"
                      >
                        Review <ArrowRight className="h-4 w-4" />
                      </button>
                      <div className="rounded-2xl border border-white/5 bg-black/35 p-4 text-xs text-gray-400">
                        <p className="uppercase tracking-[0.22em] text-gray-500">Receipt</p>
                        <p className="mt-2 line-clamp-2 break-all text-gray-300">
                          {payment.proofUrl || "No receipt URL stored"}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-[#0b0b0b] px-5 py-4 text-sm text-gray-400">
          <span>
            Page {pagination.page || page} of {pagination.totalPages || 0}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-full border border-white/10 px-4 py-2 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= (pagination.totalPages || 1)}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-full border border-white/10 px-4 py-2 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingPaymentsPage;