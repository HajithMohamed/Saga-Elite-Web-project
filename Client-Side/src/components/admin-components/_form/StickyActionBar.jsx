import React from "react";
import { ChevronLeft, Save, Eye, X, Check, Loader2 } from "lucide-react";

/**
 * Sticky top action bar — Cancel | Save Draft | Preview | Publish.
 *
 * Props:
 *  - eyebrow: tiny label above the title (e.g. "Drop Atelier").
 *  - title: bold title (e.g. "New Drop").
 *  - subtitle: muted line under the title (e.g. "Winter Solstice 2025").
 *  - onCancel: required.
 *  - onSaveDraft: optional.
 *  - onPreview: optional.
 *  - onPublish: required (primary action).
 *  - publishLabel: defaults to "Publish".
 *  - saveDraftLabel: defaults to "Save Draft".
 *  - status: "idle" | "saving" | "saved" | "error" — drives the auto-save indicator.
 *  - lastSavedAt: Date | string — used when status="saved".
 *  - isSubmitting: boolean — disables buttons while true.
 */
export function StickyActionBar({
  eyebrow,
  title,
  subtitle,
  onCancel,
  onSaveDraft,
  onPreview,
  onPublish,
  publishLabel = "Publish",
  saveDraftLabel = "Save Draft",
  cancelLabel = "Cancel",
  status = "idle",
  lastSavedAt,
  isSubmitting = false,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/[0.06] bg-page/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-4 lg:px-10">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/10 text-ink/60 hover:border-ink/20 hover:text-ink transition"
            aria-label="Close"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold-ink2 font-semibold">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-base font-semibold text-ink truncate">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-xs text-ink/40 truncate">{subtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AutoSaveIndicator status={status} lastSavedAt={lastSavedAt} />

          <button
            type="button"
            onClick={onCancel}
            className="hidden md:inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-ink/60 hover:text-ink transition"
          >
            <X className="h-3.5 w-3.5" />
            {cancelLabel}
          </button>

          {onSaveDraft ? (
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-ink/[0.04] px-4 py-2 text-xs font-medium text-ink/80 hover:border-ink/20 hover:bg-ink/[0.08] hover:text-ink transition disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {saveDraftLabel}
            </button>
          ) : null}

          {onPreview ? (
            <button
              type="button"
              onClick={onPreview}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-ink/[0.04] px-4 py-2 text-xs font-medium text-ink/80 hover:border-ink/20 hover:bg-ink/[0.08] hover:text-ink transition"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
          ) : null}

          <button
            type="button"
            onClick={onPublish}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-full bg-gold-deep px-5 py-2 text-xs font-semibold text-ongold shadow-[0_4px_14px_rgba(212,175,55,0.35)] hover:bg-gold-deep hover:shadow-[0_6px_22px_rgba(212,175,55,0.5)] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            {publishLabel}
          </button>
        </div>
      </div>
    </header>
  );
}

function AutoSaveIndicator({ status, lastSavedAt }) {
  if (status === "saving") {
    return (
      <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] text-ink/40">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </span>
    );
  }
  if (status === "saved" && lastSavedAt) {
    return (
      <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] text-ink/40">
        <Check className="h-3 w-3 text-emerald-400/80" />
        Saved {formatRelative(lastSavedAt)}
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] text-rose-400">
        Save failed
      </span>
    );
  }
  return null;
}

function formatRelative(date) {
  const d = date instanceof Date ? date : new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default StickyActionBar;
