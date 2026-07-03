import React from "react";

/**
 * Numbered section header with title + description.
 *
 *   01  General Details
 *       Basic information shown to customers.
 *
 * Props:
 *  - number: e.g. "01" (string).
 *  - title: section heading.
 *  - description: optional helper line.
 *  - action: optional ReactNode rendered top-right (e.g. an "Add" button).
 *  - children: section content.
 *  - id: optional anchor for tab/scroll navigation.
 */
export function FormSection({ number, title, description, action, children, id, className = "" }) {
  return (
    <section
      id={id}
      className={`rounded-2xl border border-ink/[0.06] bg-panel p-6 lg:p-8 ${className}`.trim()}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-baseline gap-3 min-w-0">
          {number ? (
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-ink2 mt-0.5 shrink-0">
              {number}
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-ink truncate">{title}</h2>
            {description ? (
              <p className="mt-1 text-xs text-ink/50 leading-relaxed">{description}</p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export default FormSection;
