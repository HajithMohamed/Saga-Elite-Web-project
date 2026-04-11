import React, { Fragment, useState, useEffect } from "react";
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
  ChevronLeft,
  Eye,
  Bell,
  Settings,
} from "lucide-react";
import {
  getAllDrops,
  updateDrop,
  deleteDrop,
  archiveDrop,
  createDrop,
} from "@/store/admin/drop-slice";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/v1`
  : "http://localhost:5001/api/v1";

// ── Shared helper components (matches Product page) ──────────────────────────

const PulseDot = ({ active }) => (
  <span
    className={`w-2 h-2 shrink-0 ${
      active ? "bg-saga-primary animate-pulse" : "bg-outline-variant"
    }`}
  />
);

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
  isPublished: false,
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

  const dispatch = useDispatch();
  const { drops = [], isLoading = false } =
    useSelector((state) => state.drop) || {};
  const { toast } = useToast();

  useEffect(() => {
    dispatch(getAllDrops());
  }, [dispatch]);

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
    } catch {
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

  async function onSubmit() {
    try {
      let result;
      if (currentEditedSlug) {
        result = await dispatch(
          updateDrop({ slug: currentEditedSlug, formData })
        ).unwrap();
        await uploadPendingDropImages(currentEditedId);
      } else {
        result = await dispatch(createDrop(formData)).unwrap();
        const newId = result.drop._id;
        await uploadPendingDropImages(newId);
        setCurrentEditedId(newId);
        setCurrentEditedSlug(result.drop.slug);
      }

      dispatch(getAllDrops());
      toast({
        title: currentEditedSlug
          ? "Drop updated successfully"
          : "Drop created successfully",
        className:
          "bg-surface border border-primary-container text-saga-primary",
      });
      resetForm();
    } catch (e) {
      toast({
        title: "Failed to save drop",
        description: e?.message,
        variant: "destructive",
      });
    }
  }

  function handleDelete(slug) {
    if (window.confirm("Are you sure you want to delete this Drop?")) {
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

  // ── FORM VIEW ──────────────────────────────────────────────────────────────

  if (showForm) {
    return (
      <div className="flex min-h-screen bg-surface text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden !w-full fixed inset-0 z-50">
        <main className="flex-1 w-full flex flex-col overflow-y-auto">
          {/* Header */}
          <header className="bg-surface-container-low flex justify-between items-center w-full px-8 md:px-16 py-6 border-b border-outline-variant/10 sticky top-0 z-10">
            <div className="flex flex-col">
              <h1 className="font-serif text-3xl font-bold tracking-tighter text-saga-primary">
                Saga Elite
              </h1>
              <p className="text-[10px] uppercase tracking-[0.1em] text-on-surface-variant opacity-70 mt-1">
                Drop Atelier / Release Studio
              </p>
            </div>
            <div className="flex items-center gap-8">
              <button
                onClick={resetForm}
                className="text-sm uppercase tracking-[0.1em] text-on-surface hover:text-saga-primary transition-colors duration-300"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                className="bg-primary-container text-on-primary-container px-8 py-3 text-sm uppercase font-extrabold tracking-widest hover:brightness-110 transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)]"
              >
                {currentEditedSlug ? "Update Drop" : "Save Drop"}
              </button>
            </div>
          </header>

          <div className="max-w-7xl mx-auto w-full px-8 md:px-16 py-12 grid grid-cols-1 md:grid-cols-12 gap-12">
            {/* Left Column: Media & Visibility */}
            <div className="col-span-1 md:col-span-4 space-y-12">
              {/* Campaign Assets */}
              <section>
                <h2 className="font-serif text-xl mb-6 text-on-surface">
                  Campaign Assets
                </h2>
                <div className="bg-surface-container-low p-4">
                  {currentEditedSlug === null ? (
                    <div className="p-8 text-center border-2 border-dashed border-outline-variant/30 text-on-surface-variant bg-surface">
                      <p className="text-xs uppercase font-bold tracking-widest mb-2 text-saga-primary">
                        Drop Creation Required
                      </p>
                      <p className="text-xs opacity-60">
                        Save this drop first before uploading campaign images.
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
                          className="mt-3 inline-flex items-center justify-center rounded-full border border-saga-primary px-4 py-2 text-sm font-semibold text-saga-primary hover:bg-saga-primary/10 transition"
                        >
                          View all images
                        </button>
                      )}
                    </>
                  )}
                </div>
              </section>

              {/* Status & Visibility */}
              <section className="bg-surface-container-low p-8 space-y-6 border border-outline-variant/10">
                <h2 className="font-serif text-xl text-on-surface">
                  Status &amp; Visibility
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-surface-container-high border-l-2 border-saga-primary">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-saga-primary font-bold">
                        Published
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Visible to clients
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={formData.isPublished}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          isPublished: !formData.isPublished,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-surface-container-high">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-saga-primary font-bold">
                        Archived
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Internal records only
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={formData.isArchived}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          isArchived: !formData.isArchived,
                        })
                      }
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Form Fields */}
            <div className="col-span-1 md:col-span-8 space-y-12">
              {/* General Details */}
              <section className="bg-surface-container-low p-8 md:p-12 border border-outline-variant/10">
                <div className="flex items-baseline gap-4 mb-10">
                  <span className="font-serif text-4xl text-saga-primary opacity-20">
                    01
                  </span>
                  <h2 className="font-serif text-2xl text-on-surface">
                    General Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] uppercase tracking-[0.1em] text-saga-primary font-bold block mb-3">
                      Drop Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full bg-surface-container-highest border-none p-4 text-on-surface focus:ring-1 focus:ring-saga-primary placeholder:text-on-surface-variant/30"
                      placeholder="e.g. Winter Solstice 2025"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] uppercase tracking-[0.1em] text-saga-primary font-bold block mb-3">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-surface-container-highest border-none p-4 text-on-surface focus:ring-1 focus:ring-saga-primary placeholder:text-on-surface-variant/30 min-h-[100px] resize-y"
                      placeholder="Describe the concept and items in this release..."
                    />
                  </div>
                </div>
              </section>

              {/* Schedule */}
              <section className="bg-surface-container-low p-8 md:p-12 border border-outline-variant/10">
                <div className="flex items-baseline gap-4 mb-10">
                  <span className="font-serif text-4xl text-saga-primary opacity-20">
                    02
                  </span>
                  <h2 className="font-serif text-2xl text-on-surface">
                    Release Schedule
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.1em] text-saga-primary font-bold block mb-3">
                      Release Date
                    </label>
                    <input
                      type="date"
                      value={formData.releaseDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          releaseDate: e.target.value,
                        })
                      }
                      className="w-full bg-surface-container-highest border-none p-4 text-on-surface focus:ring-1 focus:ring-saga-primary [color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.1em] text-saga-primary font-bold block mb-3">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full bg-surface-container-highest border-none p-4 text-on-surface focus:ring-1 focus:ring-saga-primary [color-scheme:dark]"
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface min-h-[calc(100vh-80px)] text-on-surface">
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
        <div className="space-y-3">
          {isLoading && (
            <div className="py-20 text-center text-on-surface-variant font-sans text-sm tracking-widest uppercase">
              Loading drops…
            </div>
          )}

          {!isLoading &&
            drops.map((drop) => (
              <div
                key={drop._id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-surface-container/30 hover:bg-surface-bright transition-all duration-300 group p-6 relative border border-outline-variant/5"
              >
                {/* Left accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-saga-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />

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
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-saga-primary shrink-0" />
                      <span>
                        {new Date(drop.releaseDate).toLocaleDateString()}
                      </span>
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
                <div className="col-span-1 md:col-span-1 flex justify-end gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => openDropGallery(drop)}
                    className="hover:text-saga-primary transition-colors text-on-surface-variant bg-surface-container-high p-2"
                    title="View images"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
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
                    onClick={() => handleArchive(drop.slug, drop.isArchived)}
                    className="hover:text-saga-primary transition-colors text-on-surface-variant bg-surface-container-high p-2"
                    title="Toggle Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(drop.slug)}
                    className="hover:text-saga-error transition-colors text-on-surface-variant bg-surface-container-high p-2"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

          {!isLoading && drops.length === 0 && (
            <div className="py-20 text-center border border-dashed border-outline-variant/30 text-on-surface-variant font-sans">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No drops found in the ledger.</p>
              <button
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
        </div>
      </main>

      {/* Gallery Modal */}
      {isDropGalleryOpen && (
        <ImageGalleryModal
          title={dropGalleryTitle}
          images={dropGalleryImages}
          onClose={closeDropGallery}
          onImagesUpdate={handleDropGalleryImagesUpdate}
        />
      )}
    </div>
  );
};

export default Drops;