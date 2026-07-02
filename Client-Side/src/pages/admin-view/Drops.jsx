import React, { Fragment, useState, useEffect } from "react";
import useBulkSelection from "@/hooks/use-bulk-selection";
import usePagination from "@/hooks/use-pagination";
import useUnsavedChanges from "@/hooks/use-unsaved-changes";
import Pagination from "@/components/common-components/Pagination";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { PrimaryButton } from "@/components/admin-components/_shared/Buttons";
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
  BarChart3,
  Film,
  Quote,
  Loader2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  getAllDrops,
  updateDrop,
  deleteDrop,
  archiveDrop,
  createDrop,
  bulkUpdateDrops,
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

const MotionSpan = motion.span;
const MotionDiv = motion.div;

const PulseDot = ({ active }) =>
  active ? (
    <MotionSpan
      key="live"
      layout
      className="block h-2 w-2 shrink-0 rounded-full bg-saga-primary"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 16 }}
    />
  ) : (
    <MotionSpan
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

const DROP_DRAFT_KEY = "saga.admin.drop.draft";

const loadDropDraft = () => {
  try {
    const raw = localStorage.getItem(DROP_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

const clearDropDraft = () => {
  try {
    localStorage.removeItem(DROP_DRAFT_KEY);
  } catch {
    /* storage disabled — silent */
  }
};

const initialFormData = {
  name: "",
  description: "",
  headline: "",
  manifesto: "",
  cinematicMode: false,
  vipEarlyAccessHours: 0,
  releaseDate: "",
  endDate: "",
  isPublished: true,
  isArchived: false,
};

const Drops = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [dropImages, setDropImages] = useState([]);
  const [bannerImages, setBannerImages] = useState([]);
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
    setBannerImages([]);
  };

  const openNewDropForm = () => {
    const draft = loadDropDraft();
    setFormData(draft ? { ...initialFormData, ...draft } : initialFormData);
    setCurrentEditedSlug(null);
    setCurrentEditedId(null);
    setDropImages([]);
    setBannerImages([]);
    setShowForm(true);
    if (draft) {
      toast({
        title: "Draft restored",
        description: "Resumed from your last unsaved drop draft.",
      });
    }
  };

  useEffect(() => {
    if (!showForm || currentEditedSlug) return undefined;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(DROP_DRAFT_KEY, JSON.stringify(formData));
      } catch {
        /* quota or disabled — silent */
      }
    }, 600);
    return () => clearTimeout(id);
  }, [formData, showForm, currentEditedSlug]);

  // Warn on tab close / refresh while the drop form is open with edits.
  const isDropFormDirty =
    showForm && JSON.stringify(formData) !== JSON.stringify(initialFormData);
  useUnsavedChanges(isDropFormDirty);

  const bulk = useBulkSelection(drops);
  const dropsPg = usePagination(drops, 10);
  const [bulkPending, setBulkPending] = useState(false);
  const [bulkPendingAction, setBulkPendingAction] = useState(null);

  const runBulkDropAction = React.useCallback(
    async (action) => {
      const slugs = bulk.selectedIds;
      if (slugs.length === 0) return;
      setBulkPending(true);
      try {
        const result = await dispatch(bulkUpdateDrops({ slugs, action })).unwrap();
        const ok = result.succeeded?.length || 0;
        const fail = result.failed?.length || 0;
        toast({
          title:
            fail === 0
              ? `Bulk ${action}: ${ok} drop${ok === 1 ? "" : "s"}`
              : `Bulk ${action}: ${ok} updated, ${fail} skipped`,
          variant: fail === 0 ? "success" : "destructive",
        });
        bulk.clear();
        dispatch(getAllDrops());
      } catch (err) {
        toast({
          title: `Bulk ${action} failed`,
          description: typeof err === "string" ? err : "Try again.",
          variant: "destructive",
        });
      } finally {
        setBulkPending(false);
      }
    },
    [bulk, dispatch, toast]
  );

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

  // 21:9 homepage banner (Image.type === "dropBanner"), kept separate from the
  // portrait campaign gallery above.
  async function uploadPendingBannerImages(refId) {
    const pending = bannerImages.filter((img) => !img.isUploaded && img.file);
    if (!pending.length || !refId) return true;

    const fd = new FormData();
    fd.append("refModel", "Drop");
    fd.append("refId", refId);
    fd.append("type", "dropBanner");
    pending.forEach((img) => fd.append("images", img.file));

    try {
      const response = await axios.post(`${API_BASE}/image/upload-image`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      if (!response.data?.success)
        throw new Error(response.data?.message || "Banner upload failed");

      setBannerImages((prev) => {
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
        title: "Drop saved but banner upload failed",
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
        await uploadPendingBannerImages(currentEditedId);
      } else {
        result = await dispatch(createDrop(formData)).unwrap();
        const newId = result._id;
        await uploadPendingDropImages(newId);
        await uploadPendingBannerImages(newId);
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
      if (!currentEditedSlug) clearDropDraft();
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
          maxLength={200}
          showCount
          value={formData.name}
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
          maxLength={2000}
          showCount
          value={formData.description}
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
              Drop-page gallery 1600×2000 (4:5) · Homepage banner 1280×420 (21:9) · JPG / PNG / WEBP · Max 5 MB
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Portrait campaign gallery — drop page */}
            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                  Drop-page gallery
                </h4>
                <span className="text-[10px] text-white/40">Portrait · 4:5 · 1600×2000</span>
              </div>
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
            </div>

            {/* 21:9 homepage banner — separate dedicated slot */}
            <div className="rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                  Homepage banner (21:9)
                </h4>
                <span className="text-[10px] text-white/40">1280×420 · Cover</span>
              </div>
              <ul className="mb-3 space-y-1 text-[11px] leading-relaxed text-white/50">
                <li>• Recommended 1280 × 420 px (21:9). Minimum 1280 × 420.</li>
                <li>• JPG / PNG / WEBP · Max 5 MB.</li>
                <li>• Keep models, logos &amp; key subjects within the centre 60% — edges get cropped on wide screens.</li>
                <li>• Don&rsquo;t bake headings or buttons into the image; the site overlays those.</li>
              </ul>
              <ImageUpload
                images={bannerImages}
                setImages={setBannerImages}
                isMultiple={false}
                refModel="Drop"
                refId={currentEditedId}
                type="dropBanner"
                requiredRatio={21 / 9}
                minWidth={1280}
                minHeight={420}
              />

              {/* Responsive preview — three 21:9 frames + centre safe-area guide */}
              {bannerImages[0]?.url && (
                <div className="mt-4">
                  <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
                    Preview across devices
                  </p>
                  <div className="flex flex-wrap items-start gap-4">
                    {[
                      { label: "Desktop", w: "w-[280px]" },
                      { label: "Tablet", w: "w-[200px]" },
                      { label: "Mobile", w: "w-[130px]" },
                    ].map((d) => (
                      <div key={d.label} className="space-y-1">
                        <div className={`${d.w} relative aspect-[1280/420] overflow-hidden rounded-lg border border-white/10 bg-black`}>
                          <img
                            src={bannerImages[0].url}
                            alt={`${d.label} banner preview`}
                            className="absolute inset-0 h-full w-full object-cover object-center"
                          />
                          {/* centre 60% safe-area guide */}
                          <div className="pointer-events-none absolute inset-y-0 left-[20%] right-[20%] border-x border-dashed border-[#D4AF37]/40" />
                        </div>
                        <p className="text-center text-[9px] uppercase tracking-wider text-white/40">{d.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </FormSection>

      <FormSection
        number="04"
        title="Story & Hype"
        description="The emotional layer customers see on the drop page. Drives anticipation and brand voice."
      >
        <FormField
          label="Headline"
          optional
          helper="One-line hook above the drop title — keeps users on the page."
          hint={`${(formData.headline || "").length} / 140`}
        >
          <LuxuryInput
            value={formData.headline || ""}
            onChange={(e) =>
              setFormData({ ...formData, headline: e.target.value.slice(0, 140) })
            }
            placeholder="The drop you've been waiting for."
          />
        </FormField>

        <FormField
          label="Manifesto"
          optional
          helper="Long-form story shown on the drop page. Set the tone — references, inspiration, why it exists."
          hint={`${(formData.manifesto || "").length} / 4000`}
        >
          <LuxuryTextarea
            rows={6}
            value={formData.manifesto || ""}
            onChange={(e) =>
              setFormData({ ...formData, manifesto: e.target.value.slice(0, 4000) })
            }
            placeholder="A few sentences that capture the spirit of this drop. Keep it raw — this is what customers will quote."
          />
        </FormField>

        <div className="rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-4">
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Film className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" />
              <div>
                <p className="text-sm font-semibold text-white">Cinematic mode</p>
                <p className="mt-1 text-xs text-white/55">
                  Renders the drop landing with a fullscreen hero + animated reveal. Best for marquee
                  releases.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={!!formData.cinematicMode}
              onChange={(e) =>
                setFormData({ ...formData, cinematicMode: e.target.checked })
              }
              className="h-4 w-4 cursor-pointer rounded border-white/30 bg-black/60 accent-[#D4AF37]"
            />
          </label>
        </div>

        <FormField
          label="VIP early access (hours)"
          optional
          helper="Customers tagged 'vip' can shop this drop this many hours before the public release. 0 = no early access."
          hint={`${Number(formData.vipEarlyAccessHours) || 0}h`}
        >
          <LuxuryInput
            type="number"
            min={0}
            max={168}
            step={1}
            value={formData.vipEarlyAccessHours ?? 0}
            onChange={(e) =>
              setFormData({
                ...formData,
                vipEarlyAccessHours: Math.max(
                  0,
                  Math.min(168, Number(e.target.value) || 0)
                ),
              })
            }
            placeholder="0"
          />
        </FormField>

        {currentEditedSlug ? (
          <Link
            to="/admin/drop-analytics"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
          >
            <BarChart3 className="h-3.5 w-3.5" /> View drop performance
          </Link>
        ) : (
          <p className="mt-4 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
            <Quote className="h-3 w-3" /> Performance analytics unlock after publishing.
          </p>
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
    <MotionDiv
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="flex-1 flex flex-col bg-surface text-on-surface rounded-3xl border border-white/10"
    >
      <div className="border-b border-white/10 px-6 py-3">
        <ToastFlash show={showDropSaved} message="Drop saved" />
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Bulk Action Bar inline for Drop Table */}
        <AnimatePresence>
          {bulk.selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between rounded-2xl bg-saga-primary/10 border border-saga-primary/30 p-3"
            >
              <div className="flex items-center gap-3 px-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-saga-primary/20 text-xs font-bold text-saga-primary">
                  {bulk.selectedIds.length}
                </span>
                <span className="text-sm font-medium text-saga-primary">Drops Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={bulkPending}
                  onClick={() => runBulkDropAction("activate")}
                  className="rounded-lg bg-black/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-saga-primary hover:text-black transition-colors disabled:opacity-50"
                >
                  Publish
                </button>
                <button
                  disabled={bulkPending}
                  onClick={() => runBulkDropAction("deactivate")}
                  className="rounded-lg bg-black/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                >
                  Unpublish
                </button>
                <button
                  disabled={bulkPending}
                  onClick={() => runBulkDropAction("archive")}
                  className="rounded-lg bg-black/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                >
                  Archive
                </button>
                <div className="h-4 w-px bg-saga-primary/30 mx-1" />
                <button
                  disabled={bulkPending}
                  onClick={() => runBulkDropAction("delete")}
                  className="rounded-lg bg-black/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-red-400 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Title + Actions */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-4 gap-8">
          <div>
            <h2 className="text-xl font-serif text-white">All Drops</h2>
            <p className="text-xs text-white/50 font-mono mt-1">
              {drops.length} drop{drops.length === 1 ? "" : "s"} total
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <PrimaryButton
              onClick={openNewDropForm}
            >
              <Plus className="w-3 h-3" />
              New Drop
            </PrimaryButton>
          </div>
        </div>

        {/* NATIVE DATA TABLE LAYOUT */}
        <div className="w-full max-w-full overflow-x-auto rounded-3xl border border-[#D4AF37]/10 bg-[#0B0B0B]/80 backdrop-blur-xl">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-white/40">
                <th className="px-6 py-5 font-semibold w-12">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/20 bg-black/40 accent-[#D4AF37] focus:ring-[#D4AF37]/50"
                    checked={bulk.isAllSelected}
                    onChange={bulk.toggleAll}
                  />
                </th>
                <th className="px-6 py-5 font-semibold">Drop</th>
                <th className="px-6 py-5 font-semibold hidden md:table-cell">Status</th>
                <th className="px-6 py-5 font-semibold hidden lg:table-cell">Release</th>
                <th className="px-6 py-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12">
                    <SkeletonGrid count={3} />
                  </td>
                </tr>
              ) : drops.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-white/40">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-mono text-xs uppercase tracking-widest">No drops found</p>
                  </td>
                </tr>
              ) : (
                dropsPg.pageItems.map((drop) => {
                  const daysAway = daysUntilRelease(drop.releaseDate);
                  return (
                  <tr
                    key={drop._id}
                    className="group transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-6 py-4 align-middle">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-white/20 bg-black/40 accent-[#D4AF37] focus:ring-[#D4AF37]/50"
                        checked={bulk.selectedIds.includes(drop.slug)}
                        onChange={() => bulk.toggle(drop.slug)}
                      />
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-white/5 border border-white/10 flex items-center justify-center">
                          {drop.images && drop.images.length > 0 ? (
                            <img
                              src={drop.images[0].url}
                              alt={drop.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-white/20" />
                          )}
                        </div>
                        <div className="max-w-[200px] lg:max-w-[300px]">
                          <p className="truncate text-sm font-semibold text-white group-hover:text-[#D4AF37] transition-colors">
                            {drop.name}
                          </p>
                          <p className="truncate text-xs text-white/40 mt-0.5">
                            {drop.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <PulseDot active={drop.isPublished} />
                        <span
                          className={`text-[10px] uppercase tracking-widest font-bold ${
                            drop.isPublished ? "text-saga-primary" : "text-white/40"
                          }`}
                        >
                          {drop.isPublished ? "Live" : "Draft"}
                        </span>
                        {drop.isArchived && (
                          <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/50">
                            Archived
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle hidden lg:table-cell">
                      <div className="flex flex-col gap-1 text-xs text-white/60 font-mono">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-[#D4AF37]" />
                          {new Date(drop.releaseDate).toLocaleDateString()}
                        </div>
                        {daysAway != null && (
                          <span className="inline-flex w-fit items-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-[#D4AF37]">
                            {daysAway} day{daysAway === 1 ? "" : "s"} away
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => openDropGallery(drop)}
                          className="p-2 text-white/40 hover:text-white transition-colors"
                          title="Gallery"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentEditedId(drop._id);
                            setCurrentEditedSlug(drop.slug);
                            setFormData({
                              name: drop.name,
                              description: drop.description || "",
                              headline: drop.headline || "",
                              manifesto: drop.manifesto || "",
                              cinematicMode: !!drop.cinematicMode,
                              vipEarlyAccessHours: Number(drop.vipEarlyAccessHours) || 0,
                              releaseDate: drop.releaseDate.split("T")[0],
                              endDate: drop.endDate ? drop.endDate.split("T")[0] : "",
                              isPublished: drop.isPublished,
                              isArchived: drop.isArchived,
                            });
                            {
                              const imgs = drop.images || [];
                              setDropImages(imgs.filter((im) => im.type !== "dropBanner"));
                              setBannerImages(imgs.filter((im) => im.type === "dropBanner"));
                            }
                            setShowForm(true);
                          }}
                          className="p-2 text-white/40 hover:text-[#D4AF37] transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmSlug((s) => (s === drop.slug ? null : drop.slug))}
                          className="p-2 text-white/40 hover:text-red-400 transition-colors relative"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                          <div className="absolute right-0 top-full z-10 mt-1">
                            <ConfirmInline
                              show={deleteConfirmSlug === drop.slug}
                              message="Delete drop permanently?"
                              onCancel={() => setDeleteConfirmSlug(null)}
                              onConfirm={() => {
                                const slug = drop.slug;
                                setDeleteConfirmSlug(null);
                                dispatch(deleteDrop(slug)).then((data) => {
                                  if (data.meta.requestStatus === "fulfilled") {
                                    dispatch(getAllDrops());
                                    toast({
                                      title: "Drop deleted",
                                      className: "bg-surface border border-primary-container text-saga-primary",
                                    });
                                  } else {
                                    toast({ title: "Failed to delete Drop", variant: "destructive" });
                                  }
                                });
                              }}
                            />
                          </div>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
          </table>
          <Pagination
            page={dropsPg.page}
            pageCount={dropsPg.pageCount}
            onPageChange={dropsPg.setPage}
            total={dropsPg.total}
            pageSize={dropsPg.pageSize}
            label="drops"
            className="px-6 pb-5"
          />
        </div>
      </div>

      {/* Gallery Modal */}
      {isDropGalleryOpen ? (
        <ImageGalleryModal
          title={dropGalleryTitle}
          images={dropGalleryImages}
          onClose={closeDropGallery}
          onImagesUpdate={handleDropGalleryImagesUpdate}
        />
      ) : null}
    </MotionDiv>
    </AdminPage>
    <AnimatePresence mode="wait">{showForm ? dropFormPanel : null}</AnimatePresence>
    </Fragment>
  );
};

export default Drops;
