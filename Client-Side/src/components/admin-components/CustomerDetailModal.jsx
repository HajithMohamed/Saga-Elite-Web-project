import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Activity,
  AlertTriangle,
  Crown,
  Eye,
  Heart,
  KeyRound,
  Loader2,
  Lock,
  MapPin,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  StickyNote,
  Trash2,
  UserCog,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/admin-components/_shared/StatusBadge";
import {
  adminChangeUserPassword,
  deleteAdminUser,
  fetchAdminUserDetail,
  triggerAdminPasswordReset,
  updateAdminUserStatus,
} from "@/store/admin/user-slice";

// Keep keys in sync with the User.tags enum (server: USER_TAG_ENUM).
const CUSTOMER_TAGS = [
  { key: "vip", label: "VIP", accent: "border-gold-ink/50 bg-gold/15 text-gold-ink" },
  { key: "high_spender", label: "High Spender", accent: "border-emerald-400/50 bg-emerald-400/10 text-emerald-200" },
  { key: "drop_collector", label: "Drop Collector", accent: "border-violet-400/50 bg-violet-400/10 text-violet-200" },
  { key: "frequent_buyer", label: "Frequent Buyer", accent: "border-sky-400/50 bg-sky-400/10 text-sky-200" },
  { key: "early_supporter", label: "Early Supporter", accent: "border-rose-400/50 bg-rose-400/10 text-rose-200" },
  { key: "refund_risk", label: "Refund Risk", accent: "border-orange-400/50 bg-orange-400/10 text-orange-200" },
];

const MEMBERSHIP_OPTIONS = ["standard", "elite", "rare", "legend", "vip"];

const MEMBERSHIP_STYLES = {
  vip: "border-gold-ink bg-gold/15 text-gold-ink",
  legend: "border-purple-400/40 bg-purple-400/10 text-purple-300",
  rare: "border-cyan-400/40 bg-cyan-400/10 text-cyan-300",
  elite: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  standard: "border-ink/10 bg-ink/5 text-gray-300",
};

const currencyFormatter = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});
const money = (v) => currencyFormatter.format(v || 0);

const fmtDate = (value, withTime = false) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

const membershipBadge = (m) => MEMBERSHIP_STYLES[m] || MEMBERSHIP_STYLES.standard;

const StatTile = ({ label, value, icon: Icon }) => (
  <div className="rounded-2xl border border-ink/10 bg-panel p-4">
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-[0.16em] text-ink/45">{label}</span>
      {Icon ? <Icon className="h-3.5 w-3.5 text-gold-ink2" /> : null}
    </div>
    <div className="mt-2 text-lg font-semibold text-ink">{value}</div>
  </div>
);

/**
 * Centered, responsive customer-detail modal. Replaces the old expandable
 * section below the table. Owns its own mutation logic (status, tags,
 * membership, notes, password reset/change, delete) so the list page stays
 * lean. `onMutated` refreshes the list; `onDeleted` closes + repaginates.
 */
export default function CustomerDetailModal({ user, isLoading, onClose, onMutated, onDeleted }) {
  const dispatch = useDispatch();

  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [tagSaving, setTagSaving] = useState(null);
  const [membershipSaving, setMembershipSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [resetSaving, setResetSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  // Esc to close + lock background scroll while the modal is open.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // Reset transient controls when the focused customer changes.
  useEffect(() => {
    setNoteDraft("");
    setShowPw(false);
    setPw("");
    setPwConfirm("");
    setConfirmDelete(false);
  }, [user?._id]);

  const isLocal = !user?.provider || user.provider === "local";

  const addresses = useMemo(() => {
    const list = Array.isArray(user?.addresses) ? user.addresses : [];
    const permanent = list.find((a) => a.isDefault) || list[0] || null;
    const others = list.filter((a) => a !== permanent);
    return { permanent, others, count: list.length };
  }, [user]);

  const lastLoginAt = user?.recentLogins?.find((l) => l.success)?.createdAt || null;
  const orderCount = user?.relationship?.orderCount || 0;
  const totalSpent = user?.relationship?.totalSpent || 0;
  const avgOrderValue = orderCount ? Math.round(totalSpent / orderCount) : 0;

  const refreshDetail = async () => {
    if (user?._id) {
      await dispatch(fetchAdminUserDetail(user._id)).unwrap().catch(() => {});
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    const next = !user.isActive;
    setStatusSaving(true);
    try {
      await dispatch(updateAdminUserStatus({ userId: user._id, isActive: next })).unwrap();
      toast({
        title: next ? "Customer activated" : "Customer deactivated",
        description: `${user.email} is now ${next ? "active" : "inactive"}.`,
        variant: "success",
      });
      await refreshDetail();
      onMutated?.();
    } catch (err) {
      toast({ title: "Status update failed", description: typeof err === "string" ? err : "Try again.", variant: "destructive" });
    } finally {
      setStatusSaving(false);
    }
  };

  const handleTagToggle = async (tagKey) => {
    if (!user) return;
    const current = Array.isArray(user.tags) ? user.tags : [];
    const next = current.includes(tagKey)
      ? current.filter((t) => t !== tagKey)
      : [...current, tagKey];
    setTagSaving(tagKey);
    try {
      await dispatch(updateAdminUserStatus({ userId: user._id, tags: next })).unwrap();
      await refreshDetail();
      onMutated?.();
    } catch (err) {
      toast({ title: "Tag update failed", description: typeof err === "string" ? err : "Try again.", variant: "destructive" });
    } finally {
      setTagSaving(null);
    }
  };

  const handleMembershipChange = async (nextMembership) => {
    if (!user || (user.membership || "standard") === nextMembership) return;
    setMembershipSaving(true);
    try {
      await dispatch(updateAdminUserStatus({ userId: user._id, membership: nextMembership })).unwrap();
      toast({ title: "Membership updated", description: `${user.email} is now ${nextMembership}.`, variant: "success" });
      await refreshDetail();
      onMutated?.();
    } catch (err) {
      toast({ title: "Membership update failed", description: typeof err === "string" ? err : "Try again.", variant: "destructive" });
    } finally {
      setMembershipSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!user || !noteDraft.trim()) return;
    setNoteSaving(true);
    try {
      await dispatch(updateAdminUserStatus({ userId: user._id, addAdminNote: noteDraft.trim() })).unwrap();
      await refreshDetail();
      setNoteDraft("");
      toast({ title: "Note added", variant: "success" });
    } catch (err) {
      toast({ title: "Could not add note", description: typeof err === "string" ? err : "Try again.", variant: "destructive" });
    } finally {
      setNoteSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;
    setResetSaving(true);
    try {
      await dispatch(triggerAdminPasswordReset(user._id)).unwrap();
      toast({ title: "Password reset email sent", description: `An OTP was delivered to ${user.email}.`, variant: "success" });
    } catch (err) {
      toast({ title: "Reset failed", description: typeof err === "string" ? err : "Try again.", variant: "destructive" });
    } finally {
      setResetSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    if (pw.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (pw !== pwConfirm) {
      toast({ title: "Passwords don't match", description: "Re-enter the confirmation.", variant: "destructive" });
      return;
    }
    setPwSaving(true);
    try {
      await dispatch(
        adminChangeUserPassword({ userId: user._id, newPassword: pw, confirmPassword: pwConfirm })
      ).unwrap();
      toast({ title: "Password updated", description: `${user.email} can now sign in with the new password.`, variant: "success" });
      setShowPw(false);
      setPw("");
      setPwConfirm("");
    } catch (err) {
      toast({ title: "Couldn't change password", description: typeof err === "string" ? err : "Try again.", variant: "destructive" });
    } finally {
      setPwSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await dispatch(deleteAdminUser(user._id)).unwrap();
      toast({ title: "Customer deleted", description: `${user.email} has been removed.`, variant: "success" });
      onDeleted?.();
    } catch (err) {
      toast({ title: "Delete failed", description: typeof err === "string" ? err : "Try again.", variant: "destructive" });
      setDeleting(false);
    }
  };

  const displayName = user?.username || (user?.email ? user.email.split("@")[0] : "Customer");

  return (
    <div
      className="fixed inset-0 z-[120] flex items-stretch justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Customer details"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden border border-ink/10 bg-page shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
        {/* Sticky header */}
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 bg-panel px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-ink">{displayName}</h2>
              {user?.isVerified ? <ShieldCheck className="h-4 w-4 shrink-0 text-gold-ink2" /> : null}
            </div>
            <p className="truncate font-mono text-[11px] text-gray-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/10 text-gray-400 transition hover:border-gold-ink2/40 hover:text-gold-ink2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
          {isLoading || !user ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gold-ink2" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Identity + status */}
              <section className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-panel p-5 sm:flex-row sm:items-center">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={displayName}
                    className="h-16 w-16 shrink-0 rounded-2xl border border-ink/10 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-ink/10 bg-gradient-to-br from-card to-page text-lg font-serif text-gold-ink2">
                    {(user.email || "?").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${membershipBadge(user.membership)}`}>
                      {user.membership === "vip" && <Crown className="h-2.5 w-2.5" />}
                      {user.membership || "standard"}
                    </span>
                    <StatusBadge status={user.isActive ? "active" : "inactive"} />
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">
                      via {user.provider || "local"}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span className="truncate">Name: {user.username || "—"}</span>
                    <span className="truncate">Phone: {user.phoneNumber || "—"}</span>
                    <span>Joined {fmtDate(user.createdAt)}</span>
                    <span>Last login {fmtDate(lastLoginAt, true)}</span>
                  </div>
                  {user.tags?.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {user.tags.map((t) => (
                        <span key={t} className="rounded-sm border border-ink/10 bg-ink/5 px-2 py-0.5 text-[9px] uppercase tracking-wider text-gray-300">
                          {t.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </section>

              {/* Quick actions */}
              <section className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={statusSaving}
                  className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-panel px-4 py-2 text-xs font-semibold text-ink transition hover:border-gold-ink2/40 disabled:opacity-50"
                >
                  <UserCog className="h-4 w-4" /> {user.isActive ? "Disable account" : "Enable account"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-panel px-4 py-2 text-xs font-semibold text-ink transition hover:border-gold-ink2/40"
                >
                  <Lock className="h-4 w-4" /> Change password
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resetSaving || !isLocal}
                  title={isLocal ? "Email a reset OTP" : "Social accounts have no local password"}
                  className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-panel px-4 py-2 text-xs font-semibold text-ink transition hover:border-gold-ink2/40 disabled:opacity-40"
                >
                  <KeyRound className="h-4 w-4" /> Email reset OTP
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/5 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:border-red-400/50"
                >
                  <Trash2 className="h-4 w-4" /> Delete customer
                </button>
              </section>

              {/* Change-password form */}
              {showPw ? (
                <section className="rounded-2xl border border-gold-ink2/25 bg-gold-deep/5 p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
                    <Lock className="h-4 w-4 text-gold-ink2" /> Set a new password
                  </div>
                  {isLocal ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="password"
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                        placeholder="New password (min 8 chars)"
                        className="admin-input"
                        autoComplete="new-password"
                      />
                      <input
                        type="password"
                        value={pwConfirm}
                        onChange={(e) => setPwConfirm(e.target.value)}
                        placeholder="Confirm new password"
                        className="admin-input"
                        autoComplete="new-password"
                      />
                      <div className="sm:col-span-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleChangePassword}
                          disabled={pwSaving || !pw || !pwConfirm}
                          className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ongold transition-opacity disabled:opacity-50"
                        >
                          {pwSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                          Update password
                        </button>
                        <span className="text-[11px] text-gray-500">
                          The customer can sign in immediately with the new password.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-200/80">
                      This customer signs in with {user.provider}; there is no local password to change.
                    </p>
                  )}
                </section>
              ) : null}

              {/* Statistics */}
              <section>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-ink2">Statistics</p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  <StatTile label="Total Orders" value={orderCount} icon={ShoppingBag} />
                  <StatTile label="Total Spending" value={money(totalSpent)} icon={Wallet} />
                  <StatTile label="Avg Order Value" value={money(avgOrderValue)} icon={Activity} />
                  <StatTile label="Wishlist" value={user.relationship?.wishlistCount || 0} icon={Heart} />
                  <StatTile label="Last Purchase" value={fmtDate(user.relationship?.lastOrderAt)} icon={Package} />
                </div>
              </section>

              {/* Membership + tags (Edit / Manage Tags) */}
              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-ink/10 bg-panel p-5">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/50">Membership</p>
                  <select
                    value={user.membership || "standard"}
                    onChange={(e) => handleMembershipChange(e.target.value)}
                    disabled={membershipSaving}
                    className="admin-select w-full"
                  >
                    {MEMBERSHIP_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-panel p-5">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/50">Customer Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {CUSTOMER_TAGS.map((tag) => {
                      const active = user.tags?.includes(tag.key);
                      const busy = tagSaving === tag.key;
                      return (
                        <button
                          key={tag.key}
                          type="button"
                          onClick={() => handleTagToggle(tag.key)}
                          disabled={busy}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition disabled:opacity-50 ${
                            active ? tag.accent : "border-ink/10 bg-ink/5 text-gray-400 hover:border-gold-ink2/40"
                          }`}
                        >
                          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Address information */}
              <section className="rounded-2xl border border-ink/10 bg-panel p-5">
                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gold-ink2" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/50">Address Information</p>
                </div>
                {addresses.count === 0 ? (
                  <p className="text-xs text-gray-500">No saved addresses.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gold-ink2/80">Permanent / Default</p>
                      <p className="mt-1 text-sm text-gray-300">
                        {[addresses.permanent?.street, addresses.permanent?.city, addresses.permanent?.postalCode, addresses.permanent?.country]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-ink/40">Other addresses</p>
                      {addresses.others.length ? (
                        <ul className="mt-1 space-y-1 text-sm text-gray-400">
                          {addresses.others.map((a) => (
                            <li key={a._id || a.street}>
                              {[a.street, a.city, a.postalCode].filter(Boolean).join(", ")}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500">—</p>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* Recent orders */}
              <section className="rounded-2xl border border-ink/10 bg-panel p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Package className="h-4 w-4 text-gold-ink2" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/50">Recent Orders</p>
                </div>
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-ink/10 text-[10px] uppercase tracking-widest text-gray-500">
                      <tr>
                        <th className="px-2 pb-3">Order</th>
                        <th className="px-2 pb-3">Date</th>
                        <th className="px-2 pb-3">Status</th>
                        <th className="px-2 pb-3">Payment</th>
                        <th className="px-2 pb-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.recentOrders?.length ? (
                        user.recentOrders.map((o) => (
                          <tr key={o._id} className="border-b border-ink/5 last:border-0">
                            <td className="px-2 py-3 font-mono text-[11px] text-gray-300">
                              {o.referenceNumber || o._id.slice(-6).toUpperCase()}
                            </td>
                            <td className="px-2 py-3 text-[11px] text-gray-500">{fmtDate(o.createdAt)}</td>
                            <td className="px-2 py-3"><StatusBadge status={o.status || "processing"} /></td>
                            <td className="px-2 py-3 text-[11px] capitalize text-gray-400">{o.paymentStatus || "—"}</td>
                            <td className="px-2 py-3 text-right font-mono text-[12px] text-gold-ink2">{money(o.totalAmount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[12px] text-gray-500">No orders placed yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Intelligence + notes */}
              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-ink/10 bg-panel p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/50">Lifetime & Risk</p>
                    <Eye className="h-3.5 w-3.5 text-gold-ink2" />
                  </div>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-gray-500">Lifetime value</span>
                    <span className="font-mono text-gold-ink2">
                      {money(user.intelligence?.customerLifetimeValue || totalSpent)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between text-sm">
                    <span className="text-gray-500">Churn risk</span>
                    <span className="inline-flex items-center gap-1 font-mono text-rose-300">
                      {(user.intelligence?.predictedChurnRisk || 0) > 70 && <AlertTriangle className="h-3.5 w-3.5" />}
                      {user.intelligence?.predictedChurnRisk || 0}/100
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-ink/10 bg-panel p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/50">Admin Notes</p>
                    <StickyNote className="h-3.5 w-3.5 text-gold-ink2" />
                  </div>
                  <div className="max-h-40 space-y-2 overflow-y-auto scrollbar-thin pr-1">
                    {(user.adminNotes || []).length === 0 ? (
                      <p className="text-[11px] italic text-gray-500">No internal notes.</p>
                    ) : (
                      [...user.adminNotes]
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .map((note, idx) => (
                          <div key={idx} className="rounded-xl border border-ink/5 bg-black/30 p-3">
                            <p className="text-xs leading-snug text-gray-300">{note.note}</p>
                            <div className="mt-2 text-[9px] uppercase text-gray-600">
                              {note.author?.email?.split("@")[0] || "Admin"} · {fmtDate(note.createdAt)}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Add a note…"
                      className="admin-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddNote}
                      disabled={!noteDraft.trim() || noteSaving}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold-ink2/20 bg-gold-deep/10 text-gold-ink2 transition hover:bg-gold-deep/20 disabled:opacity-50"
                    >
                      {noteSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Delete confirmation overlay */}
        {confirmDelete ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-page p-6 text-center shadow-2xl">
              <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-400" />
              <p className="text-sm text-ink">
                Delete <span className="font-semibold">{user?.email}</span>? This permanently removes the
                customer account and their notifications.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold text-gray-300 hover:border-ink/30"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-full bg-red-500/90 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-500 disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
