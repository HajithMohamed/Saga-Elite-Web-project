import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
  GripVertical,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Monitor,
  Grid3X3,
  Users,
  Edit3,
} from "lucide-react";
import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { AdminPage, AdminPanel } from "@/components/admin-components/AdminUI";
import ImageUpload from "@/components/admin-components/ImageUpload";

/* ─────────────────────────────────────────────────────────────────────────────
   Homepage Image Manager
   ─────────────────────────────────────────────────────────────────────────────
   Admin page for managing all images that appear on the storefront homepage.
   Organized into 3 zones:
     1. Hero Slider – full-width banner images
     2. Category Covers – Ladies / Gents / Unisex cover images
     3. Community Gallery – social-proof / UGC images

   All zones use the existing server endpoints:
     POST   /image/upload-image        (with type + refModel=System)
     GET    /image/get-hero-images
     GET    /image/get-category-logo-images
     GET    /image/get-ad-images
     PATCH  /image/meta/:id
     PATCH  /image/reorder-images
     DELETE /image/delete-image/:id
   ────────────────────────────────────────────────────────────────────────── */

// ── Shared Image Card ────────────────────────────────────────────────────────
const ManagedImageCard = ({ image, onDelete, onUpdateLabel, deleting }) => {
  const [editing, setEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(image.label || "");

  const handleSaveLabel = () => {
    onUpdateLabel(image._id, labelValue.trim());
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative rounded-xl overflow-hidden border border-ink/10 bg-page"
    >
      {/* Image */}
      <div className="aspect-[16/10] relative overflow-hidden bg-panel">
        <img
          src={image.url}
          alt={image.label || "Homepage image"}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src =
              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjMTMxMzEzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNGQ0NjM1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPkJyb2tlbiBJbWFnZTwvdGV4dD4KPC9zdmc+";
          }}
        />
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
          <button
            onClick={() => onDelete(image._id)}
            disabled={deleting}
            className="w-9 h-9 rounded-full bg-red-500/90 hover:bg-red-500 flex items-center justify-center text-ink transition-colors disabled:opacity-50"
            title="Delete image"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="w-9 h-9 rounded-full bg-ink/20 hover:bg-ink/30 flex items-center justify-center text-ink transition-colors backdrop-blur-sm"
            title="Edit label"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Label */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2 min-h-[40px]">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveLabel();
            }}
            className="flex items-center gap-2 w-full"
          >
            <input
              type="text"
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              placeholder="Image label..."
              className="flex-1 bg-card border border-line rounded px-2 py-1 text-xs text-ink-2 placeholder:text-line outline-none focus:border-gold-ink2 transition-colors"
              autoFocus
            />
            <button
              type="submit"
              className="text-success hover:text-[#2db84d] transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setLabelValue(image.label || "");
              }}
              className="text-muted hover:text-ink-2 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <span className="text-[11px] text-muted truncate">
            {image.label || "No label"}
          </span>
        )}
        {image.order !== undefined && !editing && (
          <span className="text-[10px] text-line tabular-nums shrink-0">
            #{image.order}
          </span>
        )}
      </div>
    </motion.div>
  );
};

// ── Image Zone (reusable section) ────────────────────────────────────────────
const ImageZone = ({
  title,
  description,
  icon: Icon,
  fetchUrl,
  uploadType,
  uploadLabel,
  aspectHint,
  maxImages = 10,
}) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [stagedImages, setStagedImages] = useState([]);

  // Fetch images on mount
  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}${fetchUrl}`, {
        withCredentials: true,
      });
      const imgs = Array.isArray(res?.data?.images) ? res.data.images : [];
      setImages(imgs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    } catch (err) {
      console.error(`Failed to fetch ${title} images:`, err);
      toast({
        title: "Failed to load images",
        description: `Could not fetch ${title.toLowerCase()} images.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchUrl, title]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Delete an image
  const handleDelete = async (id) => {
    if (!id) return;
    setDeletingId(id);
    try {
      const res = await axios.delete(`${API_BASE}/image/delete-image/${id}`, {
        withCredentials: true,
      });
      if (res.data?.success) {
        setImages((prev) => prev.filter((img) => img._id !== id));
        toast({
          title: "Image deleted",
          variant: "success",
        });
      }
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err.response?.data?.message || "Could not delete image.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Update image label/meta
  const handleUpdateLabel = async (id, newLabel) => {
    if (!id) return;
    try {
      await axios.patch(
        `${API_BASE}/image/meta/${id}`,
        { label: newLabel },
        { withCredentials: true }
      );
      setImages((prev) =>
        prev.map((img) =>
          img._id === id ? { ...img, label: newLabel } : img
        )
      );
      toast({
        title: "Label updated",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Update failed",
        description: err.response?.data?.message || "Could not update label.",
        variant: "destructive",
      });
    }
  };

  // On upload success — refresh from server
  const handleUploadSuccess = () => {
    setStagedImages([]);
    fetchImages();
    toast({
      title: "Images uploaded",
      description: `${title} images have been updated.`,
      variant: "success",
    });
  };

  return (
    <AdminPanel
      title={
        <span className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gold-deep/10 border border-gold-ink2/20 flex items-center justify-center">
            <Icon className="w-4.5 h-4.5 text-gold-ink2" />
          </div>
          <div>
            <span className="text-ink-2">{title}</span>
            <span className="block text-[11px] text-muted font-normal tracking-normal normal-case mt-0.5">
              {description}
            </span>
          </div>
        </span>
      }
      className="mb-6"
    >
      {/* Aspect ratio hint */}
      {aspectHint && (
        <div className="mb-4 flex items-center gap-2 text-[11px] text-muted bg-panel border border-line/30 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 text-gold-ink2 shrink-0" />
          <span>
            Recommended: <strong className="text-cream">{aspectHint}</strong>
          </span>
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <div className="mb-5">
          <ImageUpload
            images={stagedImages}
            setImages={setStagedImages}
            isMultiple={true}
            refModel="System"
            type={uploadType}
            label={uploadLabel || ""}
            onUploadSuccess={handleUploadSuccess}
          />
        </div>
      )}

      {images.length >= maxImages && (
        <div className="mb-4 flex items-center gap-2 text-[11px] text-urgent bg-urgent/10 border border-urgent/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Maximum of {maxImages} images reached. Delete some to upload more.
        </div>
      )}

      {/* Existing Images Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted">
          <Loader2 className="w-5 h-5 animate-spin text-gold-ink2 mr-3" />
          Loading images…
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 text-line text-sm">
          <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
          No images uploaded yet
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {images.map((img) => (
              <ManagedImageCard
                key={img._id}
                image={img}
                onDelete={handleDelete}
                onUpdateLabel={handleUpdateLabel}
                deleting={deletingId === img._id}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Refresh button */}
      {!loading && images.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={fetchImages}
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted hover:text-gold-ink2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      )}
    </AdminPanel>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const HomepageImageManager = () => {
  return (
    <AdminPage
      eyebrow="Content Management"
      title="Homepage Images"
      description="Manage the images displayed across the storefront homepage — hero banners, category covers, and community gallery."
    >
      <div className="space-y-2 mt-6">
        {/* Zone 1: Hero Slider */}
        <ImageZone
          title="Hero Slider"
          description="Full-width banner images at the top of the homepage. Auto-rotates every 6 seconds."
          icon={Monitor}
          fetchUrl="/image/get-hero-images"
          uploadType="hero"
          aspectHint="1920×720px or wider (16:6 ratio). Use high-quality landscape images."
          maxImages={8}
        />

        {/* Zone 2: Category Covers */}
        <ImageZone
          title="Category Covers"
          description="Cover images for the Ladies, Gents, and Unisex category grid. Use the label to assign each image to its category."
          icon={Grid3X3}
          fetchUrl="/image/get-category-logo-images"
          uploadType="category-logo"
          uploadLabel=""
          aspectHint="800×1000px (4:5 portrait ratio). Set labels like 'Ladies', 'Gents', 'Unisex'."
          maxImages={12}
        />

        {/* Zone 3: Community / Social Gallery */}
        <ImageZone
          title="Community Gallery"
          description="Social proof and UGC (user-generated content) images shown in the community feed section."
          icon={Users}
          fetchUrl="/image/get-ad-images"
          uploadType="ad"
          aspectHint="Square or portrait. Mix of aspect ratios works best for the masonry grid."
          maxImages={12}
        />
      </div>
    </AdminPage>
  );
};

export default HomepageImageManager;
