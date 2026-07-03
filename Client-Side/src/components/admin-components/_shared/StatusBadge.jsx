/**
 * RULE 8 — status → pill classes (normalized keys).
 */
const STATUS_CLASSES = {
  pending: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
  pending_payment: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
  verification_pending:
    "bg-orange-500/10 text-orange-300 border border-orange-500/20",
  confirmed: "bg-sky-500/10 text-sky-300 border border-sky-500/20",
  shipped: "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20",
  delivered: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-300 border border-rose-500/20",
  active: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
  inactive: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
  approved: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-300 border border-rose-500/20",
  live: "bg-gold-deep/10 text-gold-ink2 border border-gold-ink2/20",
  published: "bg-gold-deep/10 text-gold-ink2 border border-gold-ink2/20",
  draft: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
  archived: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
  suspended: "bg-rose-500/10 text-rose-300 border border-rose-500/20",
  banned: "bg-rose-500/10 text-rose-300 border border-rose-500/20",
};

const BASE =
  "inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.12em]";

function normalizeStatus(status) {
  if (status == null) return "";
  const s = String(status).trim().toLowerCase().replace(/\s+/g, "_");
  return s;
}

export function StatusBadge({ status, label }) {
  const key = normalizeStatus(status);
  const cls = STATUS_CLASSES[key] ?? STATUS_CLASSES.inactive;
  const text = label ?? String(status ?? "—").replace(/_/g, " ");

  return <span className={`${BASE} ${cls}`}>{text}</span>;
}

const METHOD_CLASSES = {
  GET: "text-sky-300 bg-sky-500/10 border-sky-500/20",
  POST: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  PATCH: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  DELETE: "text-rose-300 bg-rose-500/10 border-rose-500/20",
};

export function MethodBadge({ method }) {
  const m = String(method || "").toUpperCase().split(/\s/)[0] || "GET";
  const cls = METHOD_CLASSES[m] ?? METHOD_CLASSES.GET;
  return (
    <span className={`${BASE} border ${cls}`}>{m}</span>
  );
}
