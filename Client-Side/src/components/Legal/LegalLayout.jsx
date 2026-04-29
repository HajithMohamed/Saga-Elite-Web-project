import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

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
    <div className="w-full bg-black text-white">
      <div className="container mx-auto px-4 md:px-8 py-10">
        <div className="flex flex-col gap-4 mb-8">
          <Link
            to="/"
            className="text-sm text-[#D4AF37] hover:text-white transition-colors"
          >
            Back to home
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold text-white">
                {title}
              </h1>
              {lastUpdated && (
                <p className="mt-2 text-sm text-white/60">
                  Last updated: {lastUpdated}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center rounded border border-[#D4AF37]/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
            >
              Print
            </button>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_260px] gap-10">
          <div className="space-y-10">
            <article
              ref={contentRef}
              className="space-y-10 text-sm sm:text-base text-white/80"
            >
              {children}
            </article>

            <section className="rounded border border-white/10 bg-[#0f0f0f] px-6 py-6">
              <h3 className="text-sm uppercase tracking-[0.2em] text-white">
                Related policies
              </h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {RELATED_POLICIES.map((policy) => (
                  <Link
                    key={policy.to}
                    to={policy.to}
                    className="text-sm text-[#D4AF37] hover:text-white transition-colors"
                  >
                    {policy.label}
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="hidden lg:block">
            <div className="lg:sticky lg:top-24">
              <div className="rounded border border-white/10 bg-[#0f0f0f] px-5 py-6">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">
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
                              : "text-white/70 hover:text-white"
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
