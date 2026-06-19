import React, { useRef } from 'react';
import axios from 'axios';
import { useProductForm } from './ProductFormContext';
import { Upload, X, Star, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { API_V1_URL as API_BASE } from '@/lib/api';

export const MediaStudio = ({ onOpenGallery, isEditing = false }) => {
  const { images, setImages } = useProductForm();
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newImages = files.map((file, i) => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
      colorTag: '',
      isUploaded: false,
      isPrimary: images.length === 0 && i === 0,
    }));

    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (targetId) => {
    setImages((prev) => {
      const next = prev.filter((img) => (img.id || img._id) !== targetId);
      if (next.length > 0 && !next.some((img) => img.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  };

  const reorderImage = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const updated = [...images];
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];

    const hasServerIds = updated.every((img) => img._id);
    if (hasServerIds && isEditing) {
      const imageOrders = updated
        .filter((img) => img._id)
        .map((img, i) => ({ imageId: img._id, order: i }));
      try {
        await axios.patch(
          `${API_BASE}/image/reorder-images`,
          { imageOrders },
          { withCredentials: true }
        );
      } catch {
        /* keep local order on failure */
      }
    }

    setImages(updated);
  };

  const setPrimary = async (imageId) => {
    const image = images.find((img) => (img.id || img._id) === imageId);
    if (!image) return;

    if (image._id && isEditing) {
      try {
        await axios.patch(
          `${API_BASE}/image/set-primary/${image._id}`,
          {},
          { withCredentials: true }
        );
      } catch {
        return;
      }
    }

    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: (img.id || img._id) === imageId,
      }))
    );
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-md">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Media Studio</h2>
          <p className="mt-1 text-xs text-white/50">Upload images and tag by variant color for storefront switching.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/50">{images.length} assets</span>
          {isEditing && onOpenGallery && (
            <button
              type="button"
              onClick={onOpenGallery}
              className="flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
            >
              <ExternalLink className="h-3 w-3" />
              Manage in Gallery
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/10 bg-black/20 text-white/50 transition-colors hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 hover:text-[#D4AF37]"
        >
          <Upload className="h-6 w-6 transition-transform group-hover:-translate-y-1" />
          <span className="text-xs font-semibold uppercase tracking-wider">Upload Media</span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {images.map((img, index) => {
          const imgKey = img.id || img._id;
          const isPrimary = img.isPrimary || (index === 0 && !images.some((i) => i.isPrimary));

          return (
            <div
              key={imgKey}
              className={`group relative aspect-[4/5] overflow-hidden rounded-xl border bg-black/40 ${
                isPrimary ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30' : 'border-white/10'
              }`}
            >
              <img
                src={img.url}
                alt="Product media"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />

              {isPrimary && (
                <span className="absolute left-2 top-2 rounded-full bg-[#D4AF37] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                  Primary
                </span>
              )}

              <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setPrimary(imgKey)}
                  className={`rounded-full p-1.5 backdrop-blur-md transition ${
                    isPrimary
                      ? 'bg-[#D4AF37] text-black'
                      : 'bg-black/60 text-white/70 hover:bg-[#D4AF37]/80 hover:text-black'
                  }`}
                  title="Set as primary"
                >
                  <Star className="h-3.5 w-3.5" fill={isPrimary ? 'currentColor' : 'none'} />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(imgKey)}
                  className="rounded-full bg-black/60 p-1.5 text-white/70 backdrop-blur-md transition hover:bg-red-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="absolute bottom-10 left-2 flex flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => reorderImage(index, -1)}
                  disabled={index === 0}
                  className="rounded bg-black/60 p-1 text-white/70 backdrop-blur-md hover:text-white disabled:opacity-30"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => reorderImage(index, 1)}
                  disabled={index === images.length - 1}
                  className="rounded bg-black/60 p-1 text-white/70 backdrop-blur-md hover:text-white disabled:opacity-30"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              <div className="absolute bottom-2 left-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                <input
                  type="text"
                  value={img.colorTag || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setImages((prev) =>
                      prev.map((i) => ((i.id || i._id) === imgKey ? { ...i, colorTag: val } : i))
                    );
                  }}
                  placeholder="Variant Color (e.g. Black)"
                  className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-md focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
