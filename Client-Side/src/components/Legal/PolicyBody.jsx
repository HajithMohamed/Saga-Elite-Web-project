import React, { useMemo } from "react";
import DOMPurify from "dompurify";

const PolicyBody = ({ html, loading }) => {
  // Sanitize admin-authored HTML before injecting it — defense-in-depth even
  // though writes are super-admin-only; never trust stored HTML blindly.
  const cleanHtml = useMemo(() => DOMPurify.sanitize(html || ""), [html]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading policy">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-6 w-48 rounded bg-white/10" />
            <div className="h-4 w-full rounded bg-white/5" />
            <div className="h-4 w-5/6 rounded bg-white/5" />
            <div className="h-4 w-2/3 rounded bg-white/5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="legal-policy-content space-y-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-2 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_a]:text-[#D4AF37] [&_a]:hover:underline [&_strong]:text-white"
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
};

export default PolicyBody;
