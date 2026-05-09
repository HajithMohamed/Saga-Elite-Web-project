import { useEffect } from "react";

const ensureMetaTag = (name) => {
  if (typeof document === "undefined") return null;

  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }

  return tag;
};

const usePageMeta = ({ title, description, fullTitle = false }) => {
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (title) {
      if (fullTitle) {
        document.title = title;
      } else if (String(title).includes("Saga Elite")) {
        // already a full title
        document.title = title;
      } else {
        document.title = `${title} — Saga Elite`;
      }
    }

    if (description) {
      const descriptionTag = ensureMetaTag("description");
      if (descriptionTag) {
        descriptionTag.setAttribute("content", description);
      }
    }
  }, [title, description, fullTitle]);
};

export default usePageMeta;
