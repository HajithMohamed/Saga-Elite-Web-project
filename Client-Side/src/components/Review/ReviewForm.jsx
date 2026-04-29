import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Loader2, Upload, X } from "lucide-react";
import StarRating from "./StarRating";
import { toast } from "@/hooks/use-toast";

const API_BASE = `${import.meta.env.VITE_API_URL}/v1`;

const ReviewForm = ({ productId, orderId, onSubmit, onCancel, initialValues }) => {
  const fileInputRef = useRef(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingIds, setUploadingIds] = useState([]);

  useEffect(() => {
    if (!initialValues) return;
    setRating(initialValues.rating || 0);
    setTitle(initialValues.title || "");
    setContent(initialValues.content || "");
    if (Array.isArray(initialValues.images)) {
      const seeded = initialValues.images.map((url) => ({
        id: `seed-${url}`,
        file: null,
        preview: url,
        progress: 100,
        url,
      }));
      setImages(seeded);
    }
  }, [initialValues]);

  const canSubmit = rating > 0 && title.trim().length >= 3 && content.trim().length >= 10;

  const titleCount = title.length;
  const contentCount = content.length;

  const handleFiles = (files) => {
    const incoming = Array.from(files || []);
    const next = [...images];

    incoming.forEach((file) => {
      if (next.length >= 3) return;
      if (!file.type.startsWith("image/")) return;
      if (file.size > 2 * 1024 * 1024) return;

      next.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        url: null,
      });
    });

    setImages(next);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event) => event.preventDefault();

  const removeImage = (id) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const uploadSingle = async (imageItem) => {
    const formData = new FormData();
    formData.append("images", imageItem.file);

    setUploadingIds((prev) => [...prev, imageItem.id]);

    try {
      const response = await axios.post(`${API_BASE}/reviews/upload-images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
        onUploadProgress: (event) => {
          const progress = event.total
            ? Math.round((event.loaded / event.total) * 100)
            : 0;
          setImages((prev) =>
            prev.map((img) =>
              img.id === imageItem.id ? { ...img, progress } : img
            )
          );
        },
      });

      const url = response.data?.images?.[0];
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageItem.id ? { ...img, url, progress: 100 } : img
        )
      );
    } finally {
      setUploadingIds((prev) => prev.filter((id) => id !== imageItem.id));
    }
  };

  const uploadAllImages = async () => {
    const pending = images.filter((img) => !img.url);
    for (const item of pending) {
      await uploadSingle(item);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);
      await uploadAllImages();

      const uploadedUrls = images
        .map((img) => img.url)
        .filter(Boolean);

      await onSubmit({
        productId,
        orderId,
        rating,
        title: title.trim(),
        content: content.trim(),
        images: uploadedUrls,
      });

      toast({
        title: "Review submitted",
        description:
          "Your review has been submitted and is pending approval. We will notify you once it is live.",
      });

      setRating(0);
      setTitle("");
      setContent("");
      setImages([]);
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error?.message || "Unable to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressLabel = useMemo(() => {
    const uploadingCount = uploadingIds.length;
    if (!uploadingCount) return null;
    return `Uploading ${uploadingCount} image${uploadingCount > 1 ? "s" : ""}`;
  }, [uploadingIds]);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-white/10 bg-[#0b0b0b] p-6"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
          Rate this product
        </p>
        <div className="mt-2">
          <StarRating
            value={rating}
            readOnly={false}
            size="lg"
            onChange={setRating}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.2em] text-white/60">Title</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value.slice(0, 100))}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#D4AF37]/50 focus:outline-none"
          placeholder="Summarize your experience"
          required
        />
        <div className="text-right text-xs text-white/40">{titleCount}/100</div>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.2em] text-white/60">Review</label>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value.slice(0, 500))}
          className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#D4AF37]/50 focus:outline-none"
          placeholder="Tell us what you loved or what could be improved"
          required
        />
        <div className="text-right text-xs text-white/40">{contentCount}/500</div>
      </div>

      <div>
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/20 bg-black/20 px-6 py-10 text-center"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <Upload className="h-6 w-6 text-white/60" />
          <p className="text-sm text-white/70">
            Drag and drop up to 3 images (max 2MB each)
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70"
          >
            Browse files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />
        </div>

        {images.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {images.map((img) => (
              <div key={img.id} className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <div className="relative h-24 overflow-hidden rounded-xl">
                  <img src={img.preview} alt="Review" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#D4AF37] transition-all"
                    style={{ width: `${img.progress || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {progressLabel && (
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          {progressLabel}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={!canSubmit || isSubmitting || uploadingIds.length > 0}
          className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit review
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-white/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/70"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ReviewForm;
