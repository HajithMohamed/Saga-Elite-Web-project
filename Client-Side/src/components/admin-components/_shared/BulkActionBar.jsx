import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, AlertTriangle, Loader2 } from "lucide-react";

/**
 * BulkActionBar — slides up from the bottom when a list page has selected
 * rows. Each action can opt into an inline confirm dialog by setting
 * `confirm: { title, body, confirmLabel? }`. Destructive actions MUST set
 * `confirm` to give the admin a guard rail.
 *
 *   <BulkActionBar
 *     count={selectedIds.length}
 *     onClear={clear}
 *     pending={isMutating}
 *     actions={[
 *       { label: "Activate", onClick: () => dispatch(bulk({ action: "activate" })) },
 *       { label: "Delete", variant: "destructive", confirm: {
 *           title: "Delete selected products?",
 *           body: "This cannot be undone.",
 *         }, onClick: () => dispatch(bulk({ action: "delete" })) },
 *     ]}
 *   />
 */
const BulkActionBar = ({ count = 0, onClear, actions = [], pending = false, label = "selected" }) => {
  const [pendingAction, setPendingAction] = useState(null);

  const visible = count > 0;

  const runAction = (action) => {
    if (action.confirm) {
      setPendingAction(action);
      return;
    }
    action.onClick?.();
  };

  const confirmPending = () => {
    if (!pendingAction) return;
    pendingAction.onClick?.();
    setPendingAction(null);
  };

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="bulk-action-bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            data-testid="admin-bulk-action-bar"
            className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-full border border-gold-ink2/40 bg-black/95 px-5 py-3 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 pr-3 border-r border-gray-800">
                <span className="text-xs font-bold text-ink" data-testid="admin-bulk-count">
                  {count}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-gold-ink2">
                  {label}
                </span>
              </div>
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  disabled={pending}
                  onClick={() => runAction(action)}
                  data-testid={`admin-bulk-action-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${
                    action.variant === "destructive"
                      ? "border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                      : "border border-gold-ink2/30 bg-gold-deep/10 text-gold-ink2 hover:bg-gold-deep/20"
                  }`}
                >
                  {pending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    action.label
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={onClear}
                disabled={pending}
                aria-label="Clear selection"
                className="ml-1 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-ink disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingAction && (
          <motion.div
            key="bulk-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setPendingAction(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-page p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10">
                  <AlertTriangle className="h-5 w-5 text-rose-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-ink">
                    {pendingAction.confirm.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    {pendingAction.confirm.body}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPendingAction(null)}
                  className="rounded-full border border-gray-700 px-5 py-2 text-xs font-bold uppercase tracking-widest text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmPending}
                  data-testid="admin-bulk-confirm"
                  className="rounded-full border border-rose-500/40 bg-rose-500/20 px-5 py-2 text-xs font-bold uppercase tracking-widest text-rose-200 hover:bg-rose-500/30"
                >
                  {pendingAction.confirm.confirmLabel || "Confirm"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BulkActionBar;
