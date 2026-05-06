import React from "react";

const statusConfig = {
  pending: { label: "Pending", bg: "#4d4635", color: "#f2ca50" },
  pending_payment: { label: "Pending Payment", bg: "#4d4635", color: "#f2ca50" },
  processing: { label: "Processing", bg: "#f2ca50", color: "#0a0a0a" },
  verification_pending: {
    label: "Verification Pending",
    bg: "#f2ca50",
    color: "#0a0a0a",
  },
  confirmed: { label: "Confirmed", bg: "#f2ca50", color: "#0a0a0a" },
  proof_submitted: { label: "Proof Submitted", bg: "#f2ca50", color: "#0a0a0a" },
  shipped: { label: "Shipped", bg: "#e5e2e1", color: "#0a0a0a" },
  delivered: { label: "Delivered", bg: "#f2ca50", color: "#0a0a0a" },
  cancelled: { label: "Cancelled", bg: "#1c1b1b", color: "#99907c" },
  paid: { label: "Paid", bg: "#f2ca50", color: "#0a0a0a" },
  failed: { label: "Failed", bg: "#1c1b1b", color: "#e5e2e1" },
};

const statusAliases = {};

const StatusBadge = ({ status }) => {
  const normalizedStatus = String(status || "").toLowerCase();
  let resolvedStatus = normalizedStatus;
  if (!statusConfig[normalizedStatus]) {
    resolvedStatus = statusAliases[normalizedStatus] || "pending";
  }
  const cfg = statusConfig[resolvedStatus] || statusConfig.pending;

  return (
    <span
      className="se-label uppercase tracking-widest"
      style={{
        background: cfg.bg,
        color: cfg.color,
        padding: "4px 8px",
        borderRadius: "2px",
        fontSize: "9px",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${cfg.color}30`
      }}
    >
      {cfg.label}
    </span>
  );
};

export default StatusBadge;