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

const usePageMeta = ({ title, description }) => {
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (title) {
      document.title = `Saga Elite | ${title}`;
    }

    if (description) {
      const descriptionTag = ensureMetaTag("description");
      if (descriptionTag) {
        descriptionTag.setAttribute("content", description);
      }
    }
  }, [title, description]);
};

export default usePageMeta;
