import React, { useMemo } from "react";
import DOMPurify from "dompurify";

const PolicyBody = ({ html, loading }) => {
  // Sanitize admin-authored HTML before injecting it
  const cleanHtml = useMemo(() => DOMPurify.sanitize(html || ""), [html]);

  if (loading) {
    return (
      <div className="space-y-12 animate-pulse" aria-busy="true" aria-label="Loading policy">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-6">
            <div className="h-8 w-64 rounded bg-card" />
            <div className="space-y-4">
              <div className="h-4 w-full rounded bg-ink/5" />
              <div className="h-4 w-5/6 rounded bg-ink/5" />
              <div className="h-4 w-3/4 rounded bg-ink/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="
        legal-policy-content 
        max-w-[960px] 
        text-ink-2
        
        /* Layout & Spacing */
        space-y-12
        [&>section]:py-8 [&>section]:border-t [&>section]:border-ink/5
        [&>section:first-child]:border-t-0 [&>section:first-child]:pt-0
        
        /* Headings */
        [&_h2]:se-serif [&_h2]:text-[28px] md:[&_h2]:text-[32px] [&_h2]:text-ink [&_h2]:mb-8 [&_h2]:mt-10
        [&_h3]:font-sans [&_h3]:font-semibold [&_h3]:text-[20px] md:[&_h3]:text-[24px] [&_h3]:text-ink [&_h3]:mb-4 [&_h3]:mt-8
        
        /* Typography */
        [&_p]:se-body [&_p]:text-[16px] [&_p]:leading-[1.7] [&_p]:text-muted [&_p]:mb-6 [&_p]:max-w-[800px]
        
        /* Lists */
        [&_ul]:se-body [&_ul]:text-[16px] [&_ul]:leading-[1.7] [&_ul]:text-muted [&_ul]:list-none [&_ul]:space-y-4 [&_ul]:mb-6 [&_ul]:max-w-[800px]
        [&_ul_li]:relative [&_ul_li]:pl-6
        [&_ul_li::before]:content-[''] [&_ul_li::before]:absolute [&_ul_li::before]:left-0 [&_ul_li::before]:top-[10px] [&_ul_li::before]:w-1.5 [&_ul_li::before]:h-1.5 [&_ul_li::before]:rounded-full [&_ul_li::before]:bg-gold
        
        /* Links */
        [&_a]:text-gold-ink [&_a]:font-semibold [&_a]:transition-colors hover:[&_a]:text-gold-ink hover:[&_a]:underline
        
        /* Bold Text */
        [&_strong]:text-ink [&_strong]:font-semibold
      "
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
};

export default PolicyBody;
