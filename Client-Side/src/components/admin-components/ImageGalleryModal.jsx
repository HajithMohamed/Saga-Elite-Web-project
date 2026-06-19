import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import { Star, Trash2, Upload, ChevronUp, ChevronDown, X } from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { compressImageFile } from "@/lib/image-compression";
import { ConfirmInline } from "@/components/admin-components/_shared/ConfirmInline";
import { modalBackdropVariants, modalCardVariants } from "@/components/admin-components/_shared/animations";

const ImageGalleryModal = ({ title, images = [], onClose, onImagesUpdate }) => {
  const [localImages, setLocalImages] = useState(images);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editingColorTagId, setEditingColorTagId] = useState(null);
  const [colorTagInput, setColorTagInput] = useState("");
  const [colorFilter, setColorFilter] = useState("all");

  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  const updateImages = (updated) => {
    setLocalImages(updated);
    if (onImagesUpdate) onImagesUpdate(updated);
  };

  const getOrderPayload = (list) =>
    list
      .filter((img) => img._id)
      .map((img, index) => ({ imageId: img._id, order: index }));

  const saveOrder = async (updated) => {
    const imageOrders = getOrderPayload(updated);
    if (imageOrders.length === 0) {
      updateImages(updated);
      return;
    }

    try {
      setLoadingId("reorder");
      await axios.patch(
        `${API_BASE}/image/reorder-images`,
        { imageOrders },
        { withCredentials: true },
      );
      updateImages(updated);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to reorder images");
    } finally {
      setLoadingId(null);
    }
  };

  const reorderImage = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= localImages.length) return;

    const updated = [...localImages];
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];

    await saveOrder(updated);
  };

  const handleSetPrimary = async (imageId) => {
    const image = localImages.find((img) => img._id === imageId);
    if (!image) return;

    try {
      setLoadingId(imageId);
      const response = await axios.patch(
        `${API_BASE}/image/set-primary/${imageId}`,
        {},
        { withCredentials: true },
      );

      const updated = localImages.map((img) => ({
        ...img,
        isPrimary: img._id === response.data.image._id,
      }));
      updateImages(updated);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to set primary image");
    } finally {
      setLoadingId(null);
    }
  };

  const performDelete = async (imageId) => {
    const image = localImages.find((img) => img._id === imageId);
    if (!image) return;
    setDeleteConfirmId(null);
    try {
      setLoadingId(imageId);
      await axios.delete(`${API_BASE}/image/delete-image/${imageId}`, {
        withCredentials: true,
      });

      const updated = localImages.filter((img) => img._id !== imageId);
      if (image.isPrimary && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      updateImages(updated);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to delete image");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReplace = async (imageId, index) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (event) => {
      const originalFile = event.target.files?.[0];
      const file = await compressImageFile(originalFile);
      if (!file) return;

      try {
        setLoadingId(imageId);
        const formData = new FormData();
        formData.append("image", file);

        const response = await axios.patch(
          `${API_BASE}/image/update-image/${imageId}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          },
        );

        const updated = localImages.map((img, idx) =>
          idx === index ? response.data.image : img,
        );
        updateImages(updated);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Unable to replace image");
      } finally {
        setLoadingId(null);
      }
    };

    input.click();
  };

  /* -------------- UPDATE COLOR TAG -------------- */

  const handleUpdateColorTag = async (imageId, newColorTag) => {
    try {
      setLoadingId(imageId);
      const response = await axios.patch(
        `${API_BASE}/image/meta/${imageId}`,
        { colorTag: newColorTag },
        { withCredentials: true }
      );

      if (response.data.success) {
        const updated = localImages.map((img) =>
          img._id === imageId ? { ...img, colorTag: newColorTag } : img
        );
        updateImages(updated);
      }
      setEditingColorTagId(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to update color tag");
    } finally {
      setLoadingId(null);
    }
  };

  // Distinct color tags from all images (for filter tabs).
  const distinctColors = [...new Set(
    localImages
      .map((img) => String(img.colorTag || "").trim())
      .filter(Boolean)
  )];

  const filteredImages = colorFilter === "all"
    ? localImages
    : colorFilter === "untagged"
      ? localImages.filter((img) => !img.colorTag || String(img.colorTag).trim() === "")
      : localImages.filter((img) => String(img.colorTag || "").trim().toLowerCase() === colorFilter.toLowerCase());

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        variants={modalBackdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
      <motion.div
        className="max-w-7xl w-full flex flex-col max-h-[90vh] overflow-hidden rounded-2xl bg-surface text-on-surface shadow-2xl"
        variants={modalCardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-5 bg-surface-container-low shrink-0">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-sm text-on-surface-variant">{localImages.length} image(s) available</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-outline-variant px-3 py-2 text-sm text-on-surface hover:bg-on-surface/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto" data-lenis-prevent="true">
          {error && (
            <div className="rounded-2xl border border-red-600 bg-red-600/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Color filter tabs */}
          {distinctColors.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-2">
              <button
                type="button"
                onClick={() => setColorFilter("all")}
                className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] transition ${colorFilter === "all" ? "border-[#D4AF37]/45 bg-[#D4AF37]/[0.12] text-[#D4AF37]" : "border-white/10 text-white/55 hover:border-white/20 hover:text-white"}`}
              >
                All ({localImages.length})
              </button>
              {distinctColors.map((color) => {
                const count = localImages.filter((img) => String(img.colorTag || "").trim().toLowerCase() === color.toLowerCase()).length;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setColorFilter(color)}
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] transition ${colorFilter.toLowerCase() === color.toLowerCase() ? "border-[#D4AF37]/45 bg-[#D4AF37]/[0.12] text-[#D4AF37]" : "border-white/10 text-white/55 hover:border-white/20 hover:text-white"}`}
                  >
                    {color} ({count})
                  </button>
                );
              })}
              {localImages.some((img) => !img.colorTag || String(img.colorTag).trim() === "") && (
                <button
                  type="button"
                  onClick={() => setColorFilter("untagged")}
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] transition ${colorFilter === "untagged" ? "border-[#ffb4ab]/45 bg-[#ffb4ab]/[0.12] text-[#ffb4ab]" : "border-white/10 text-white/55 hover:border-white/20 hover:text-white"}`}
                >
                  Untagged ({localImages.filter((img) => !img.colorTag || String(img.colorTag).trim() === "").length})
                </button>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredImages.map((image, index) => {
              const globalIndex = localImages.indexOf(image);
              return (
              <div key={image._id ?? `${index}-${image.url}`} className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-[#111]">
                <div className="relative">
                  <img
                    src={image.url}
                    alt={`${title} ${index + 1}`}
                    className="h-56 w-full object-contain bg-[#0a0a0a]"
                  />
                  {image.isPrimary && (
                    <span className="absolute left-3 top-3 rounded-full bg-saga-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-black">
                      Primary
                    </span>
                  )}
                  {/* Color tag badge */}
                  {image.colorTag && String(image.colorTag).trim() && (
                    <span className="absolute right-3 top-3 rounded-full border border-[#D4AF37]/40 bg-black/70 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[#D4AF37] backdrop-blur-sm">
                      {image.colorTag}
                    </span>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-2 py-1">
                      <span className="font-bold">#{globalIndex + 1}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-2 py-1">
                      {image._id ? "Saved" : "Pending"}
                    </span>
                  </div>

                  {/* Color tag editor */}
                  <div className="flex items-center gap-2">
                    {editingColorTagId === image._id ? (
                      <form
                        className="flex flex-1 items-center gap-1.5"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleUpdateColorTag(image._id, colorTagInput);
                        }}
                      >
                        <input
                          type="text"
                          value={colorTagInput}
                          onChange={(e) => setColorTagInput(e.target.value)}
                          placeholder="e.g. Black"
                          className="flex-1 rounded-lg border border-white/15 bg-black/40 px-2.5 py-1.5 text-xs text-white outline-none transition focus:border-[#D4AF37]/40"
                          autoFocus
                        />
                        <button type="submit" className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-[10px] font-bold text-emerald-300 transition hover:bg-emerald-500/20">
                          Save
                        </button>
                        <button type="button" onClick={() => setEditingColorTagId(null)} className="rounded-lg border border-white/10 px-2 py-1.5 text-[10px] text-white/50 transition hover:text-white">
                          ✕
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        disabled={!image._id}
                        onClick={() => {
                          setEditingColorTagId(image._id);
                          setColorTagInput(image.colorTag || "");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white/60 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37] disabled:opacity-40"
                      >
                        🏷️ {image.colorTag ? `Color: ${image.colorTag}` : "Set color tag"}
                      </button>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <button
                      type="button"
                      disabled={!image._id || loadingId === image._id}
                      onClick={() => handleSetPrimary(image._id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-surface-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface transition hover:border-saga-primary hover:text-saga-primary disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Star className="h-4 w-4" />
                      Set primary
                    </button>

                    <button
                      type="button"
                      disabled={!image._id || loadingId === image._id}
                      onClick={() => handleReplace(image._id, index)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-surface-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface transition hover:border-saga-primary hover:text-saga-primary disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Upload className="h-4 w-4" />
                      Replace
                    </button>

                    <button
                      type="button"
                      disabled={!image._id || loadingId === image._id}
                      onClick={() =>
                        setDeleteConfirmId((id) => (id === image._id ? null : image._id))
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-600 bg-red-600/10 px-3 py-2 text-sm text-red-200 transition hover:bg-red-600/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>

                    <ConfirmInline
                      show={!!image._id && deleteConfirmId === image._id}
                      message="Delete this image?"
                      onCancel={() => setDeleteConfirmId(null)}
                      onConfirm={() => performDelete(image._id)}
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={globalIndex === 0 || loadingId === "reorder"}
                        onClick={() => reorderImage(globalIndex, -1)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-surface-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface transition hover:border-saga-primary hover:text-saga-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronUp className="h-4 w-4" />
                        Up
                      </button>
                      <button
                        type="button"
                        disabled={globalIndex === localImages.length - 1 || loadingId === "reorder"}
                        onClick={() => reorderImage(globalIndex, 1)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-surface-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface transition hover:border-saga-primary hover:text-saga-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronDown className="h-4 w-4" />
                        Down
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageGalleryModal;
