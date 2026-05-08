import React from "react";
import { motion } from "framer-motion";
import { slideInPanelVariants } from "../_shared/animations";

/**
 * Luxury Control Panel — top-level shell for admin form views.
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ Sticky Action Bar (header)                              │
 *   ├─────────────────────────────────────────────────────────┤
 *   │ Main Form Area (≈70%)         │ Sticky Right Rail (30%) │
 *   │  Section 1                     │  Publish / Status      │
 *   │  Section 2                     │  Live Preview          │
 *   │  …                             │  Help / Tips           │
 *   └─────────────────────────────────────────────────────────┘
 *
 * Props:
 *  - header: ReactNode rendered as the sticky top bar (use StickyActionBar).
 *  - rightRail: ReactNode rendered in the 30% sticky sidebar.
 *  - children: main form content (rendered in the 70% column).
 *  - onClose: optional — called when the user presses Esc or backdrop.
 */
export function AdminFormShell({ header, rightRail, children, onClose }) {
  React.useEffect(() => {
    if (!onClose) return undefined;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll while the panel is open so the underlying page can't bleed.
  React.useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <motion.div
      key="admin-form-shell"
      variants={slideInPanelVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      data-admin-form-scroll
      className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-[#0A0A0A] text-white"
    >
      {/* Sticky header (StickyActionBar already sets `sticky top-0`). */}
      {header}
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-6 pt-10 pb-32 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10 lg:px-10 lg:pt-12 lg:pb-40">
        <main className="min-w-0 space-y-8">{children}</main>
        {rightRail ? (
          <aside className="lg:sticky lg:top-[96px] lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
            <div className="space-y-5">{rightRail}</div>
          </aside>
        ) : null}
      </div>
    </motion.div>
  );
}

export default AdminFormShell;
