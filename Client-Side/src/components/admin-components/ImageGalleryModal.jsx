import React, { useEffect, useState } from "react";
import axios from "axios";
import { Star, Trash2, Upload, ChevronUp, ChevronDown, X } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/v1`
  : "http://localhost:5001/api/v1";

const ImageGalleryModal = ({ title, images = [], onClose, onImagesUpdate }) => {
  const [localImages, setLocalImages] = useState(images);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState(null);

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

  const handleDelete = async (imageId) => {
    const image = localImages.find((img) => img._id === imageId);
    if (!image) return;

    if (!window.confirm("Delete this image?")) return;

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
      const file = event.target.files?.[0];
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-w-6xl w-full overflow-hidden rounded-3xl bg-surface text-on-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-5 bg-surface-container-low">
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

        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-2xl border border-red-600 bg-red-600/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {localImages.map((image, index) => (
              <div key={image._id ?? `${index}-${image.url}`} className="overflow-hidden rounded-3xl border border-outline-variant/20 bg-[#111]">
                <div className="relative">
                  <img
                    src={image.url}
                    alt={`${title} ${index + 1}`}
                    className="h-48 w-full object-cover"
                  />
                  {image.isPrimary && (
                    <span className="absolute left-3 top-3 rounded-full bg-saga-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-black">
                      Primary
                    </span>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-2 py-1">
                      <span className="font-bold">#{index + 1}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-2 py-1">
                      {image._id ? "Saved" : "Pending"}
                    </span>
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
                      onClick={() => handleDelete(image._id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-600 bg-red-600/10 px-3 py-2 text-sm text-red-200 transition hover:bg-red-600/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={index === 0 || loadingId === "reorder"}
                        onClick={() => reorderImage(index, -1)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-surface-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface transition hover:border-saga-primary hover:text-saga-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronUp className="h-4 w-4" />
                        Up
                      </button>
                      <button
                        type="button"
                        disabled={index === localImages.length - 1 || loadingId === "reorder"}
                        onClick={() => reorderImage(index, 1)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-surface-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface transition hover:border-saga-primary hover:text-saga-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronDown className="h-4 w-4" />
                        Down
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGalleryModal;
