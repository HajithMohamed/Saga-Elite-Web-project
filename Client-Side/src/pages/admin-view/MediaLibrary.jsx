import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  FolderOpen,
  Upload,
  Trash2,
  Copy,
  ImageIcon,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { API_V1_URL as API_BASE } from "@/lib/api";

const FOLDERS = [
  {
    key: "hero",
    label: "Hero",
    description: "Storefront hero banners.",
    listEndpoint: "/image/get-hero-images",
    uploadType: "hero",
    refModel: "System",
  },
  {
    key: "ad",
    label: "Promotional Ads",
    description: "Mid-page banners and promo cards.",
    listEndpoint: "/image/get-ad-images",
    uploadType: "ad",
    refModel: "System",
  },
  {
    key: "logo",
    label: "Logos",
    description: "Site logos and wordmarks.",
    listEndpoint: "/image/get-logo-images",
    uploadType: "logo",
    refModel: "System",
  },
  {
    key: "category-logo",
    label: "Category Logos",
    description: "Per-category brand marks.",
    listEndpoint: "/image/get-category-logo-images",
    uploadType: "category-logo",
    refModel: "System",
  },
];

const MediaLibrary = () => {
  const [activeFolder, setActiveFolder] = useState(FOLDERS[0].key);
  const [imagesByFolder, setImagesByFolder] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const folder = FOLDERS.find((f) => f.key === activeFolder) || FOLDERS[0];

  const fetchFolder = useCallback(
    async (key) => {
      const target = FOLDERS.find((f) => f.key === key);
      if (!target) return;
      try {
        setLoading(true);
        const res = await axios
          .get(`${API_BASE}${target.listEndpoint}`, { withCredentials: true })
          .catch((err) => {
            // The typed image endpoints 404 when empty — treat as zero results.
            if (err?.response?.status === 404) {
              return { data: { images: [] } };
            }
            throw err;
          });
        setImagesByFolder((prev) => ({
          ...prev,
          [key]: res.data?.images || [],
        }));
      } catch (err) {
        toast({
          title: "Could not load folder",
          description: err?.response?.data?.message || err?.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchFolder(activeFolder);
  }, [activeFolder, fetchFolder]);

  const images = imagesByFolder[activeFolder] || [];

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const fd = new FormData();
    fd.append("refModel", folder.refModel);
    fd.append("type", folder.uploadType);
    files.forEach((f) => fd.append("images", f));

    try {
      setUploading(true);
      await axios.post(`${API_BASE}/image/upload-image`, fd, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast({
        title: "Upload complete",
        description: `${files.length} image${files.length === 1 ? "" : "s"} uploaded.`,
      });
      await fetchFolder(activeFolder);
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      event.target.value = "";
    }
  };

  const handleDelete = async (image) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      await axios.delete(`${API_BASE}/image/delete-image/${image._id}`, {
        withCredentials: true,
      });
      toast({ title: "Image deleted" });
      await fetchFolder(activeFolder);
    } catch (err) {
      toast({
        title: "Could not delete",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    }
  };

  const handleCopyUrl = (url) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(url);
    toast({ title: "URL copied" });
  };

  return (
    <div className="mx-auto max-w-7xl p-6 text-[#e5e2e1]">
      <div className="mb-8 flex items-center justify-between border-b border-[#2a2a2a] pb-4">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-widest text-[#FAF7F2]">
            Media Library
          </h1>
          <p className="mt-2 font-sans text-sm text-[#99907c]">
            Browse, upload, and delete site media. Product and drop images are
            managed from their respective admin pages.
          </p>
        </div>
        <label
          className={`flex cursor-pointer items-center gap-2 px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors ${
            uploading
              ? "cursor-not-allowed bg-[#f2ca50]/40"
              : "bg-[#f2ca50] hover:bg-[#ffe088]"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> Upload to {folder.label}
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {FOLDERS.map((f) => {
          const isActive = activeFolder === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setActiveFolder(f.key)}
              className={`flex items-center gap-2 border px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
                isActive
                  ? "border-[#f2ca50] bg-[#131313] text-[#f2ca50]"
                  : "border-[#2a2a2a] text-[#888] hover:text-[#e5e2e1]"
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              {f.label}
            </button>
          );
        })}
      </div>

      <p className="mb-4 text-xs text-[#99907c]">{folder.description}</p>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#f2ca50]" />
        </div>
      ) : images.length === 0 ? (
        <div className="border border-dashed border-[#2a2a2a] bg-[#0a0a0a] p-12 text-center font-mono text-xs uppercase tracking-widest text-[#888]">
          <ImageIcon className="mx-auto mb-3 h-10 w-10 text-[#4d4635]" />
          No images in this folder yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <div
              key={img._id}
              className="group relative overflow-hidden border border-[#2a2a2a] bg-[#0a0a0a]"
            >
              <button
                type="button"
                onClick={() => setLightboxImage(img)}
                className="block aspect-square w-full overflow-hidden"
              >
                <img
                  src={img.url}
                  alt={img.altText || img.label || "media"}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </button>
              <div className="flex items-center justify-between gap-2 px-3 py-2 text-[10px] uppercase tracking-[0.18em]">
                <p className="truncate text-[#99907c]">
                  {img.label || img.altText || "Untitled"}
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(img.url)}
                    className="text-[#99907c] hover:text-[#f2ca50]"
                    title="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(img)}
                    className="text-[#99907c] hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightboxImage ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-6"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-5xl overflow-hidden border border-[#4d4635]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.url}
              alt={lightboxImage.altText || lightboxImage.label || "media"}
              className="max-h-[90vh] max-w-full object-contain"
            />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center justify-between gap-4 border-t border-[#4d4635] bg-[#0a0a0a] px-4 py-2 text-xs">
              <p className="truncate text-[#99907c]">
                {lightboxImage.label || lightboxImage.altText || "Untitled"}
              </p>
              <button
                type="button"
                onClick={() => handleCopyUrl(lightboxImage.url)}
                className="inline-flex items-center gap-2 text-[#f2ca50] hover:underline"
              >
                <Copy className="h-3 w-3" /> Copy URL
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MediaLibrary;
