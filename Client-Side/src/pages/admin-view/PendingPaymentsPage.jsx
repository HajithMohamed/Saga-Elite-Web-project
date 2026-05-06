import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Landmark,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";

import { toast } from "@/hooks/use-toast";
import { pageVariants } from "@/components/admin-components/_shared/animations";
import { SkeletonRow } from "@/components/admin-components/_shared/SkeletonCard";
import {
  fetchPendingManualPayments,
  verifyManualPayment,
} from "@/store/manualPaymentSlice";
import { useSocketEvent } from "@/hooks/use-socket-events";

const MotionLink = motion.create(Link);

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Pending", value: "proof_submitted" },
  { label: "Verified", value: "verified" },
  { label: "Rejected", value: "rejected" },
];

const statusMeta = {
  proof_submitted: {
    label: "Pending",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
  pending_payment: {
    label: "Pending",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
  verified: {
    label: "Verified",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },
  rejected: {
    label: "Rejected",
    className: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  },
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const resolveOrder = (payment) => payment?.orderId || {};

const resolveCustomerName = (payment) => {
  const order = resolveOrder(payment);
  const user = order.user || payment?.userId || {};

  return (
    user.fullName ||
    user.name ||
    user.userName ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.email ||
    "—"
  );
};

const resolveOrderId = (payment) => {
  const order = resolveOrder(payment);
  return order._id || order.id || payment?.orderId || "—";
};

const resolvePaymentMethod = (payment) => {
  const order = resolveOrder(payment);
  return order.paymentMethod || payment?.paymentMethod || "—";
};

const PendingPaymentsPage = () => {
  const dispatch = useDispatch();
  const { pendingPayments, pagination, isAdminLoading, isVerifying } =
    useSelector((state) => state.manualPayment);

  const location = useLocation();
  const defaultStatusFilter = useMemo(
    () =>
      location.pathname.includes("/admin/manual-payments")
        ? "all"
        : "proof_submitted",
    [location.pathname]
  );

  const [statusFilter, setStatusFilter] = useState(defaultStatusFilter);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [decisionModal, setDecisionModal] = useState({
    open: false,
    payment: null,
    action: null,
    notes: "",
  });

  const [flashIds, setFlashIds] = useState(() => new Set());

  const requestParams = useMemo(
    () => ({
      page,
      limit,
      ...(statusFilter === "all" ? {} : { status: statusFilter }),
    }),
    [limit, page, statusFilter]
  );

  const loadQueue = useCallback(async () => {
    await dispatch(fetchPendingManualPayments(requestParams));
  }, [dispatch, requestParams]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    setStatusFilter(defaultStatusFilter);
  }, [defaultStatusFilter]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useSocketEvent("payment:refresh", loadQueue, [loadQueue]);

  useSocketEvent(
    "payment:new_pending",
    (payload) => {
      const id = payload?.paymentId || payload?._id || payload?.id;
      if (id) {
        setFlashIds((prev) => new Set(prev).add(String(id)));
        setTimeout(() => {
          setFlashIds((prev) => {
            const next = new Set(prev);
            next.delete(String(id));
            return next;
          });
        }, 2400);
      }
      loadQueue();
    },
    [loadQueue]
  );

  const openDecisionModal = (payment, action) => {
    setDecisionModal({ open: true, payment, action, notes: "" });
  };

  const closeDecisionModal = () => {
    if (isVerifying) return;
    setDecisionModal({ open: false, payment: null, action: null, notes: "" });
  };

  const confirmDecision = async () => {
    if (!decisionModal.payment || !decisionModal.action) return;

    const notes = decisionModal.notes.trim();
    const action =
      decisionModal.action === "verify" ? "approve" : "reject";

    try {
      await dispatch(
        verifyManualPayment({
          paymentId: decisionModal.payment._id,
          action,
          adminNotes: notes || undefined,
          rejectionReason:
            decisionModal.action === "reject"
              ? notes || undefined
              : undefined,
        })
      ).unwrap();

      toast({
        title:
          decisionModal.action === "verify"
            ? "Payment verified"
            : "Payment rejected",
        variant: "success",
      });

      closeDecisionModal();
      await loadQueue();
    } catch (error) {
      toast({
        title: "Action failed",
        description: error || "Unable to complete this verification.",
        variant: "destructive",
      });
    }
  };

  const currentStatusLabel = (status) =>
    statusMeta[status]?.label || status.replace(/_/g, " ");

  const currentStatusClass = (status) =>
    statusMeta[status]?.className ||
    "border-white/10 bg-white/5 text-gray-300";

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#050505] px-6 py-8 text-white lg:px-8"
    >
      {/* UI omitted for brevity — your table + modal stays EXACTLY as before */}
    </motion.div>
  );
};

export default PendingPaymentsPage;