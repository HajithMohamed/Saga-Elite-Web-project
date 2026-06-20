import { useMemo } from "react";
import useShopAbout from "@/hooks/use-shop-about";

const formatLastUpdated = (raw) => {
  if (!raw) return null;
  if (typeof raw === "string" && !raw.includes("T")) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return raw;
  }
  try {
    return new Date(raw).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return String(raw);
  }
};

/**
 * Loads a CMS policy document from the cached site-config/about payload.
 * Falls back to FALLBACK_HTML when the key is missing or empty.
 */
export function usePolicyPage(policyKey, { fallbackHtml, defaultTitle, defaultDescription }) {
  const { data: about, loading } = useShopAbout();

  return useMemo(() => {
    const doc = about?.[policyKey];
    const html =
      typeof doc?.html === "string" && doc.html.trim() ? doc.html : fallbackHtml;
    const lastUpdated = formatLastUpdated(doc?.lastUpdated) || "May 2, 2026";
    const metaTitle = doc?.metaTitle?.trim() || defaultTitle;
    const metaDescription = doc?.metaDescription?.trim() || defaultDescription;

    return { html, lastUpdated, metaTitle, metaDescription, loading };
  }, [about, policyKey, fallbackHtml, defaultTitle, defaultDescription, loading]);
}

export default usePolicyPage;
