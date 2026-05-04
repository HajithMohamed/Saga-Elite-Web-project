import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const RELATED_POLICIES = [
  { label: "Privacy Policy", to: "/legal/privacy-policy" },
  { label: "Terms & Conditions", to: "/legal/terms-and-conditions" },
  { label: "Refund Policy", to: "/legal/refund-policy" },
  { label: "Contact Us", to: "/contact" },
  { label: "About Us", to: "/about" },
];

const slugifyHeading = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

const LegalLayout = ({ title, lastUpdated, children }) => {
  const contentRef = useRef(null);
  const [tocItems, setTocItems] = useState([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const headings = Array.from(container.querySelectorAll("h2"));
    const items = headings
      .map((heading) => {
        const text = heading.textContent?.trim() || "";
        if (!heading.id) {
          heading.id = slugifyHeading(text);
        }
        return text ? { id: heading.id, text } : null;
      })
      .filter(Boolean);

    setTocItems(items);
    if (items.length) {
      setActiveId((current) => current || items[0].id);
    }

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -65% 0px", threshold: 0.1 }
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, [children]);

  return (
    <div className="w-full min-h-screen bg-background text-on-surface">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex flex-col gap-4 mb-8"
        >
          <nav
            className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"
            aria-label="Breadcrumb"
          >
            <Link to="/" className="text-[#D4AF37] hover:underline">
              Home
            </Link>
            <span aria-hidden="true">→</span>
            <span className="text-muted-foreground">Legal</span>
            <span aria-hidden="true">→</span>
            <span className="text-on-surface font-medium">{title}</span>
          </nav>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold text-on-surface">
                {title}
              </h1>
              {lastUpdated && (
                <p className="mt-2 text-sm text-gray-500 dark:text-white/60">
                  Last updated: {lastUpdated}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center rounded border border-[#D4AF37]/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors shrink-0"
            >
              Print this page
            </button>
          </div>
        </motion.div>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_260px] gap-10">
          <div className="space-y-10">
            <article
              ref={contentRef}
              className="space-y-10 text-sm sm:text-base text-on-surface/90 dark:text-white/80"
            >
              {children}
            </article>

            <section className="rounded border border-border bg-muted/30 dark:bg-[#0f0f0f] dark:border-white/10 px-6 py-6">
              <h3 className="text-sm uppercase tracking-[0.2em] text-on-surface">
                Related policies
              </h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {RELATED_POLICIES.map((policy) => (
                  <Link
                    key={policy.to}
                    to={policy.to}
                    className="text-sm text-[#D4AF37] hover:underline transition-colors"
                  >
                    {policy.label}
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="hidden lg:block">
            <div className="lg:sticky lg:top-24">
              <div className="rounded border border-border bg-muted/30 dark:bg-[#0f0f0f] dark:border-white/10 px-5 py-6">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  On this page
                </p>
                <nav className="mt-4" aria-label="Table of contents">
                  <ul className="space-y-2 text-sm">
                    {tocItems.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className={`block transition-colors ${
                            activeId === item.id
                              ? "text-[#D4AF37]"
                              : "text-muted-foreground hover:text-on-surface dark:hover:text-white"
                          }`}
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default LegalLayout;
