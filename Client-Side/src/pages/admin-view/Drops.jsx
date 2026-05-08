import React, { Fragment, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import ImageUpload from "@/components/admin-components/ImageUpload";
import ImageGalleryModal from "@/components/admin-components/ImageGalleryModal";
import {
  Package,
  Calendar,
  Archive,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Eye,
  Bell,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  getAllDrops,
  updateDrop,
  deleteDrop,
  archiveDrop,
  createDrop,
} from "@/store/admin/drop-slice";
import { useToast } from "@/hooks/use-toast";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { AdminPage } from "@/components/admin-components/AdminUI";
import {
  pageVariants,
  containerVariants,
  itemVariants,
} from "@/components/admin-components/_shared/animations";
import { ConfirmInline } from "@/components/admin-components/_shared/ConfirmInline";
import { ToastFlash } from "@/components/admin-components/_shared/ToastFlash";
import { SkeletonGrid } from "@/components/admin-components/_shared/SkeletonCard";
import {
  AdminFormShell,
  StickyActionBar,
  FormSection,
  FormField,
  LuxuryInput,
  LuxuryTextarea,
  LuxuryDateInput,
  StatusPill,
  RightRailPanel,
  RailToggleRow,
  LivePreviewCard,
  ProgressBar,
} from "@/components/admin-components/_form";

// ── Shared helper components (matches Product page) ──────────────────────────

const PulseDot = ({ active }) =>
  active ? (
    <motion.span
      key="live"
      layout
      className="block h-2 w-2 shrink-0 rounded-full bg-saga-primary"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 16 }}
    />
  ) : (
    <motion.span
      key="draft"
      layout
      className="block h-2 w-2 shrink-0 rounded-full bg-outline-variant"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 16 }}
    />
  );

function daysUntilRelease(releaseDateStr) {
  if (!releaseDateStr) return null;
  const target = new Date(releaseDateStr);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target - now) / 86400000);
  if (diff > 0 && diff <= 999) return diff;
  return null;
}

const ToggleSwitch = ({
  checked,
  onChange,
  activeColor = "bg-primary-container",
  activeThumb = "bg-on-primary-container",
}) => (
  <div
    onClick={onChange}
    className={`w-10 h-5 ${
      checked ? activeColor : "bg-surface-variant"
    } relative cursor-pointer transition-colors duration-300`}
  >
    <div
      className={`absolute top-0 w-5 h-5 transition-transform duration-300 ${
        checked ? `right-0 ${activeThumb}` : "left-0 bg-outline-variant"
      }`}
    />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

const initialFormData = {
  name: "",
  description: "",
  releaseDate: "",
  endDate: "",
  isPublished: true,
  isArchived: false,
};

const Drops = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [dropImages, setDropImages] = useState([]);
  const [currentEditedSlug, setCurrentEditedSlug] = useState(null);
  const [currentEditedId, setCurrentEditedId] = useState(null);
  const [dropGalleryImages, setDropGalleryImages] = useState([]);
  const [dropGalleryTitle, setDropGalleryTitle] = useState("");
  const [isDropGalleryOpen, setIsDropGalleryOpen] = useState(false);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState(null);
  const [showDropSaved, setShowDropSaved] = useState(false);

  const dispatch = useDispatch();
  const { drops = [], isLoading = false } =
    useSelector((state) => state.drop) || {};
  const { toast } = useToast();

  useEffect(() => {
    dispatch(getAllDrops());
  }, [dispatch]);

  useEffect(() => {
    if (!showDropSaved) return undefined;
    const t = setTimeout(() => setShowDropSaved(false), 2800);
    return () => clearTimeout(t);
  }, [showDropSaved]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setShowForm(false);
    setFormData(initialFormData);
    setCurrentEditedSlug(null);
    setCurrentEditedId(null);
    setDropImages([]);
  };

  async function uploadPendingDropImages(refId) {
    const pendingImages = dropImages.filter((img) => !img.isUploaded && img.file);
    if (!pendingImages.length || !refId) return true;

    const fd = new FormData();
    fd.append("refModel", "Drop");
    fd.append("refId", refId);
    fd.append("type", "drop");
    pendingImages.forEach((img) => fd.append("images", img.file));

    try {
      const response = await axios.post(`${API_BASE}/image/upload-image`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      if (!response.data?.success)
        throw new Error(response.data?.message || "Image upload failed");

      setDropImages((prev) => {
        const existing = prev.filter((img) => !img.file);
        const uploaded = (response.data.images || []).map((img) => ({
          ...img,
          isUploaded: true,
        }));
        return [...existing, ...uploaded];
      });
      return true;
    } catch (error) {
      toast({
        title: "Drop saved but image upload failed",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
      return false;
    }
  }

  const fetchDropImages = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/image/get-drop-images/${id}`);
      const images = res.data.images || [];
      setDropImages(images);
      return images;
    } catch (error) {
      console.error("Failed to fetch drop images", error);
      toast({
        title: "Unable to load drop images",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
      setDropImages([]);
      return [];
    }
  };

  const openDropGallery = async (drop) => {
    setDropGalleryTitle(drop.name || "Drop Images");
    let imagesToShow = [];
    if (drop.images && drop.images.length > 0) {
      imagesToShow = drop.images.filter((img) => img._id);
    } else {
      imagesToShow = await fetchDropImages(drop._id);
    }
    setDropGalleryImages(imagesToShow);
    setIsDropGalleryOpen(true);
  };

  const closeDropGallery = () => setIsDropGalleryOpen(false);

  const handleDropGalleryImagesUpdate = (updatedImages) => {
    setDropGalleryImages(updatedImages);
    setDropImages((prev) => {
      const pending = prev.filter((img) => !img._id);
      return [...updatedImages, ...pending];
    });
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  function validateDropForm() {
    const name = formData.name.trim();
    if (name.length < 3) {
      return "Drop name must be at least 3 characters.";
    }
    if (name.length > 200) {
      return "Drop name must be 200 characters or fewer.";
    }
    if (!formData.releaseDate) {
      return "Release date is required.";
    }
    if (formData.endDate) {
      const release = new Date(formData.releaseDate);
      const end = new Date(formData.endDate);
      if (Number.isNaN(release.getTime()) || Number.isNaN(end.getTime())) {
        return "Invalid date selection.";
      }
      if (end <= release) {
        return "End date must be strictly after the release date.";
      }
    }
    return null;
  }

  async function onSubmit() {
    const validationError = validateDropForm();
    if (validationError) {
      toast({
        title: "Check the form",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    try {
      let result;
      if (currentEditedSlug) {
        result = await dispatch(
          updateDrop({ slug: currentEditedSlug, formData })
        ).unwrap();
        await uploadPendingDropImages(currentEditedId);
      } else {
        result = await dispatch(createDrop(formData)).unwrap();
        const newId = result._id;
        await uploadPendingDropImages(newId);
        setCurrentEditedId(newId);
        setCurrentEditedSlug(result.slug);
      }

      dispatch(getAllDrops());
      toast({
        title: currentEditedSlug
          ? "Drop updated successfully"
          : "Drop created successfully",
        className:
          "bg-surface border border-primary-container text-saga-primary",
      });
      setShowDropSaved(true);
      resetForm();
    } catch (e) {
      // Thunk rejects with a string; older callers may pass an object — handle both.
      const description =
        typeof e === "string"
          ? e
          : e?.message || e?.error || "Something went wrong while saving.";
      toast({
        title: "Failed to save drop",
        description,
        variant: "destructive",
      });
    }
  }

  function handleArchive(slug, isArchived) {
    dispatch(archiveDrop(slug)).then((data) => {
      if (data.meta.requestStatus === "fulfilled") {
        dispatch(getAllDrops());
        toast({
          title: `Drop ${!isArchived ? "archived" : "unarchived"} successfully`,
          className:
            "bg-surface border border-primary-container text-saga-primary",
        });
      } else {
        toast({
          title: "Failed to toggle archive status",
          variant: "destructive",
        });
      }
    });
  }

  // ── FORM VIEW (Luxury Control Panel) ───────────────────────────────────────

  // Compute the displayed status pill from the form state.
  const computedStatus = (() => {
    if (formData.isArchived) return "archived";
    if (!formData.isPublished) return "draft";
    if (formData.releaseDate) {
      const release = new Date(formData.releaseDate);
      if (!Number.isNaN(release.getTime()) && release > new Date()) {
        return "scheduled";
      }
    }
    return "published";
  })();

  // Completion progress: name + releaseDate are required; description, endDate, image are bonus.
  const completedCount = [
    formData.name?.trim().length >= 3,
    Boolean(formData.releaseDate),
    formData.description?.trim().length > 0,
    Boolean(formData.endDate),
    dropImages.length > 0,
  ].filter(Boolean).length;
  const progressValue = completedCount / 5;

  const heroImageUrl = dropImages[0]?.url || null;
  const releaseCountdown = (() => {
    if (!formData.releaseDate) return null;
    const days = daysUntilRelease(formData.releaseDate);
    if (days == null) return "Live now";
    if (days === 0) return "Drops today";
    return `${days} day${days === 1 ? "" : "s"} away`;
  })();

  const dropFormPanel = (
    <AdminFormShell
      onClose={resetForm}
      header={
        <StickyActionBar
          eyebrow={currentEditedSlug ? "Drop Atelier · Editing" : "Drop Atelier · New Release"}
          title={formData.name?.trim() || (currentEditedSlug ? "Untitled drop" : "New Drop")}
          subtitle={
            formData.releaseDate
              ? `Release ${new Date(formData.releaseDate).toLocaleDateString()}`
              : "Set a release date to schedule"
          }
          onCancel={resetForm}
          onPublish={onSubmit}
          publishLabel={currentEditedSlug ? "Update Drop" : "Publish Drop"}
          cancelLabel="Cancel"
        />
      }
      rightRail={
        <>
          <RightRailPanel
            tone="accent"
            title="Live Preview"
            description="What your customers will see on the storefront."
          >
            <LivePreviewCard
              image={heroImageUrl}
              eyebrow="Drop"
              title={formData.name?.trim() || "Untitled drop"}
              status={computedStatus}
              meta={[
                {
                  label: "Release",
                  value: formData.releaseDate
                    ? new Date(formData.releaseDate).toLocaleDateString()
                    : "Not set",
                },
                ...(formData.endDate
                  ? [{ label: "Ends", value: new Date(formData.endDate).toLocaleDateString() }]
                  : []),
                ...(releaseCountdown
                  ? [{ label: "Countdown", value: releaseCountdown }]
                  : []),
              ]}
            />
          </RightRailPanel>

          <RightRailPanel title="Status & Visibility">
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3">
              <span className="text-xs font-semibold text-white/80">Current state</span>
              <StatusPill status={computedStatus} size="md" />
            </div>
            <RailToggleRow
              label="Published"
              helper="Visible on the public storefront."
              checked={formData.isPublished}
              onChange={(v) => setFormData({ ...formData, isPublished: v })}
            />
            <RailToggleRow
              label="Archived"
              helper="Hide from customers; keep internal record."
              checked={formData.isArchived}
              onChange={(v) => setFormData({ ...formData, isArchived: v })}
            />
          </RightRailPanel>

          <RightRailPanel title="Setup Progress">
            <ProgressBar
              label="Drop completion"
              value={progressValue}
              segments={5}
              filledCount={completedCount}
            />
            <p className="mt-2 text-[11px] leading-relaxed text-white/40">
              Required: name and release date. Add a description, end date, and hero
              imagery for a stronger campaign.
            </p>
          </RightRailPanel>

          <RightRailPanel title="Tips">
            <ul className="space-y-2 text-[11px] leading-relaxed text-white/50">
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#D4AF37]" />
                Keep drop names under 40 characters for cleaner storefront layout.
              </li>
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#D4AF37]" />
                Hero imagery looks best at 1600×2000 (4:5).
              </li>
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#D4AF37]" />
                Schedule a release date in the future to auto-publish later.
              </li>
            </ul>
          </RightRailPanel>
        </>
      }
    >
      <FormSection
        number="01"
        title="General Details"
        description="Basic information shown to customers on the homepage and drop page."
      >
        <FormField
          label="Drop Name"
          required
          helper="Shown on the homepage, drop page, and notifications. Keep it under 40 characters."
          hint={`${formData.name.length} / 200`}
        >
          <LuxuryInput
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Winter Solstice 2025"
            maxLength={200}
          />
        </FormField>

        <FormField
          label="Description"
          optional
          helper="A short narrative for the drop hero. Supports plain text."
          hint={`${formData.description.length} / 2000`}
        >
          <LuxuryTextarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the concept, mood, and pieces in this release…"
            maxLength={2000}
            rows={5}
          />
        </FormField>
      </FormSection>

      <FormSection
        number="02"
        title="Release Schedule"
        description="Customers can view the drop after the release time. Optionally set an end date for a limited window."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField
            label="Release Date"
            required
            helper="Goes live on the storefront from this date."
          >
            <LuxuryDateInput
              value={formData.releaseDate}
              onChange={(e) =>
                setFormData({ ...formData, releaseDate: e.target.value })
              }
            />
          </FormField>

          <FormField
            label="End Date"
            optional
            helper="Optional. Drop will be archived from the storefront after this date."
          >
            <LuxuryDateInput
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        number="03"
        title="Campaign Assets"
        description="Hero and supporting imagery shown across the storefront."
      >
        {currentEditedSlug === null ? (
          <div className="rounded-2xl border border-dashed border-white/[0.08] bg-black/30 p-8 text-center">
            <Package className="mx-auto mb-3 h-8 w-8 text-white/20" />
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#D4AF37]">
              Save the drop to upload images
            </p>
            <p className="mt-2 text-[11px] text-white/40">
              Recommended hero size: 1600×2000 · JPG / WEBP · Max 5 MB
            </p>
          </div>
        ) : (
          <>
            <ImageUpload
              images={dropImages}
              setImages={setDropImages}
              isMultiple
              refModel="Drop"
              refId={currentEditedId}
              type="drop"
            />
            {dropImages.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  openDropGallery({
                    name: formData.name,
                    _id: currentEditedId,
                    images: dropImages,
                  })
                }
                className="mt-3 inline-flex items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#D4AF37] hover:bg-[#D4AF37]/[0.16] transition"
              >
                View all images
              </button>
            )}
          </>
        )}
      </FormSection>
    </AdminFormShell>
  );

  // ── LIST VIEW ──────────────────────────────────────────────────────────────

  return (
    <Fragment>
    <AdminPage
      eyebrow="Drop management"
      title="Drop Ledger"
      description="Create, schedule, publish, archive, and monitor collection drops."
    >
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="flex-1 flex flex-col overflow-hidden bg-surface min-h-[calc(100vh-80px)] text-on-surface rounded-3xl border border-white/10"
    >
      <div className="border-b border-white/10 px-6 py-3">
        <ToastFlash show={showDropSaved} message="Drop saved" />
      </div>
      {/* List Header */}
      <header className="flex flex-col md:flex-row justify-between items-center w-full px-8 md:px-16 py-6 bg-surface-dim z-10 gap-6">
        <div className="flex items-center gap-8 w-full md:w-auto">
          {/* intentionally left empty to mirror Product page spacing */}
        </div>
        <div className="flex items-center gap-6 self-end md:self-auto">
          <button className="hover:text-saga-primary transition-colors text-on-surface-variant relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-saga-primary rounded-full" />
          </button>
          <button className="hover:text-saga-primary transition-colors text-on-surface-variant">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 md:px-16 py-12 scroll-smooth">
        {/* Title + Actions */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
          <div className="max-w-2xl">
            <span
              className="text-[10px] uppercase tracking-[0.3em] text-saga-primary mb-3 block font-bold"
              style={{ textShadow: "0px 0px 12px rgba(242, 202, 80, 0.2)" }}
            >
              Release Registry
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black font-serif tracking-tighter text-white leading-none mb-4">
              Drop Ledger
            </h2>
            <p className="text-on-surface-variant text-sm max-w-lg leading-relaxed font-sans">
              Orchestrate your limited releases. Schedule launches, manage
              availability, and archive past collections.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-surface-container-highest border border-outline-variant/30 px-6 py-2 text-[10px] uppercase tracking-widest text-saga-primary flex items-center gap-2 hover:bg-surface-bright transition-colors font-bold shadow-[0_0_10px_rgba(242,202,80,0.1)]"
            >
              <Plus className="w-3 h-3" />
              New Drop
            </button>
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 mb-4 py-4 bg-surface-container-low text-[10px] uppercase tracking-[0.2em] text-outline-variant font-bold border border-outline-variant/10">
          <div className="col-span-4">Drop Details</div>
          <div className="col-span-3">Description</div>
          <div className="col-span-2">Schedule</div>
          <div className="col-span-1">Products</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Drop Rows */}
        <motion.div
          className="space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {isLoading ? <SkeletonGrid count={5} /> : null}

          {!isLoading &&
            drops.map((drop) => {
              const daysAway = daysUntilRelease(drop.releaseDate);
              return (
              <motion.div
                key={drop._id}
                variants={itemVariants}
                whileHover={{ y: -3, borderColor: "rgba(212,175,55,0.35)" }}
                transition={{ duration: 0.2 }}
                className="group relative grid grid-cols-1 md:grid-cols-12 gap-4 items-center rounded-[28px] border border-outline-variant/5 bg-surface-container/30 p-6 transition-colors hover:bg-surface-bright/80"
              >
                {/* Left accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px] origin-top scale-y-0 bg-saga-primary transition-transform duration-300 group-hover:scale-y-100" />

                {/* Drop image + name */}
                <div className="col-span-1 md:col-span-4 flex items-center gap-6">
                  <div className="w-16 h-16 bg-surface-container-highest shrink-0 overflow-hidden ring-1 ring-outline-variant/20 flex items-center justify-center">
                    {drop.images && drop.images.length > 0 ? (
                      <img
                        className="w-full h-full object-cover"
                        src={drop.images[0].url}
                        alt={drop.name}
                      />
                    ) : (
                      <Package className="w-6 h-6 text-outline-variant/50" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-serif font-bold text-lg leading-tight group-hover:text-saga-primary transition-colors">
                      {drop.name}
                    </h4>
                    <p className="text-xs text-on-surface-variant opacity-60 mt-1 uppercase font-mono">
                      {drop.isArchived ? "Archived" : "Active Drop"}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="col-span-1 md:col-span-3">
                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                    {drop.description || "No description provided."}
                  </p>
                </div>

                {/* Schedule */}
                <div className="col-span-1 md:col-span-2">
                  <div className="flex flex-col gap-1 text-xs text-on-surface-variant font-mono">
                    <div className="flex flex-wrap items-center gap-2">
                      <Calendar className="w-3 h-3 shrink-0 text-saga-primary" />
                      <span>
                        {new Date(drop.releaseDate).toLocaleDateString()}
                      </span>
                      {daysAway != null ? (
                        <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                          {daysAway} day{daysAway === 1 ? "" : "s"} away
                        </span>
                      ) : null}
                    </div>
                    {drop.endDate && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 text-saga-primary shrink-0" />
                        <span>
                          {new Date(drop.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product count */}
                <div className="col-span-1 md:col-span-1">
                  <span className="text-sm text-on-surface">
                    {drop.products?.length ?? 0} Items
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-1 md:col-span-1">
                  <div className="flex items-center gap-2">
                    <PulseDot active={drop.isPublished} />
                    <span
                      className={`text-[10px] uppercase tracking-widest font-bold ${
                        drop.isPublished
                          ? "text-saga-primary"
                          : "text-outline-variant"
                      }`}
                    >
                      {drop.isPublished ? "Live" : "Draft"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex flex-wrap justify-end gap-3 md:col-span-1">
                  <button
                    type="button"
                    onClick={() => openDropGallery(drop)}
                    className="hover:text-saga-primary transition-colors text-on-surface-variant bg-surface-container-high p-2"
                    title="View images"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentEditedId(drop._id);
                      setCurrentEditedSlug(drop.slug);
                      setFormData({
                        name: drop.name,
                        description: drop.description,
                        releaseDate: drop.releaseDate.split("T")[0],
                        endDate: drop.endDate
                          ? drop.endDate.split("T")[0]
                          : "",
                        isPublished: drop.isPublished,
                        isArchived: drop.isArchived,
                      });
                      setDropImages(drop.images || []);
                      setShowForm(true);
                    }}
                    className="hover:text-saga-primary transition-colors text-on-surface-variant bg-surface-container-high p-2"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArchive(drop.slug, drop.isArchived)}
                    className="hover:text-saga-primary transition-colors text-on-surface-variant bg-surface-container-high p-2"
                    title="Toggle Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteConfirmSlug((s) => (s === drop.slug ? null : drop.slug))
                    }
                    className="hover:text-saga-error transition-colors text-on-surface-variant bg-surface-container-high p-2"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="col-span-1 md:col-span-12">
                  <ConfirmInline
                    show={deleteConfirmSlug === drop.slug}
                    message="Delete this drop permanently?"
                    onCancel={() => setDeleteConfirmSlug(null)}
                    onConfirm={() => {
                      const slug = drop.slug;
                      setDeleteConfirmSlug(null);
                      dispatch(deleteDrop(slug)).then((data) => {
                        if (data.meta.requestStatus === "fulfilled") {
                          dispatch(getAllDrops());
                          toast({
                            title: "Drop deleted successfully",
                            className:
                              "bg-surface border border-primary-container text-saga-primary",
                          });
                        } else {
                          toast({
                            title: "Failed to delete Drop",
                            description: data?.payload?.message,
                            variant: "destructive",
                          });
                        }
                      });
                    }}
                  />
                </div>
              </motion.div>
            );
            })}

          {!isLoading && drops.length === 0 && (
            <div className="py-20 text-center border border-dashed border-outline-variant/30 text-on-surface-variant font-sans">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No drops found in the ledger.</p>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="mt-6 border border-saga-primary/40 px-8 py-3 text-[10px] uppercase tracking-widest font-bold text-saga-primary hover:bg-saga-primary hover:text-surface transition-all duration-300"
              >
                Construct First Drop
              </button>
            </div>
          )}
        </motion.div>
      </main>

      {/* Gallery Modal */}
      {isDropGalleryOpen ? (
        <ImageGalleryModal
          title={dropGalleryTitle}
          images={dropGalleryImages}
          onClose={closeDropGallery}
          onImagesUpdate={handleDropGalleryImagesUpdate}
        />
      ) : null}
    </motion.div>
    </AdminPage>
    <AnimatePresence mode="wait">{showForm ? dropFormPanel : null}</AnimatePresence>
    </Fragment>
  );
};

export default Drops;
