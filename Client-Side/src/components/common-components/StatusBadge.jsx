import React from "react";

const statusConfig = {
  pending: { label: "Pending", bg: "#FAEEDA", color: "#854F0B" },
  processing: { label: "Processing", bg: "#E6F1FB", color: "#185FA5" },
  shipped: { label: "Shipped", bg: "#EEEDFE", color: "#534AB7" },
  delivered: { label: "Delivered", bg: "#EAF3DE", color: "#3B6D11" },
  cancelled: { label: "Cancelled", bg: "#FCEBEB", color: "#A32D2D" },
};

const statusAliases = {
  pending_payment: "pending",
  proof_submitted: "processing",
  verification_pending: "processing",
  confirmed: "processing",
};

const StatusBadge = ({ status }) => {
  const normalizedStatus = String(status || "").toLowerCase();
  const resolvedStatus = statusConfig[normalizedStatus]
    ? normalizedStatus
    : statusAliases[normalizedStatus] || "pending";
  const cfg = statusConfig[resolvedStatus] || statusConfig.pending;

  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 500,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {cfg.label}
    </span>
  );
};

export default StatusBadge;