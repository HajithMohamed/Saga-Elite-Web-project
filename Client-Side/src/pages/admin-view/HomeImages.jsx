import React, { useEffect, useState } from "react";
import axios from "axios";
// eslint-disable-next-line no-unused-vars -- motion JSX
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/admin-components/ImageUpload";
import { RefreshCw, Star, Trash2, ArrowUpRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { compressImageFile } from "@/lib/image-compression";
import { AdminPage } from "@/components/admin-components/AdminUI";
import { pageVariants, containerVariants, itemVariants } from "@/components/admin-components/_shared/animations";
import { SkeletonCard } from "@/components/admin-components/_shared/SkeletonCard";

const sectionConfig = [
  {
    key: "hero",
    label: "Hero Images",
    description: "Homepage hero background assets.",
  },
  {
    key: "ad",
    label: "Banner Images",
    description: "Homepage banner and promotional assets.",
  },
  {
    key: "logo",
    label: "Logo Images",
    description: "Brand logos used throughout the site.",
  },
  {
    key: "category-logo",
    label: "Category Logos",
    description: "Logos for specific categories (Boys, Girls, Unisex).",
    isCategorized: true,
  },
];

const useSectionState = () => {
  const [images, setImages] = useState([]);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  return { images, setImages, uploadQueue, setUploadQueue, loading, setLoading };
};

function ShimmerImageTile({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative h-44 overflow-hidden bg-neutral-950">
      {!loaded ? (
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-white/0 via-white/15 to-white/0"
          animate={{ x: ["-100%", "120%"] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
        />
      ) : null}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

const AdminHomeImages = () => {
  const hero = useSectionState();
  const banner = useSectionState();
  const logo = useSectionState();
  const categoryLogo = useSectionState();
  const [globalLoading, setGlobalLoading] = useState(false);
  const [newImageIds, setNewImageIds] = useState(() => new Set());
  const { toast } = useToast();

  const sectionState = {
    hero,
    ad: banner,
    logo,
    "category-logo": categoryLogo,
  };

  const fetchImages = async (type, setter) => {
    setter.setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/image/get-${type}-images`);
      setter.setImages(response.data.images || []);
    } catch (error) {
      if (error.response?.status === 404) {
        setter.setImages([]);
      } else {
        toast({
          title: `Failed to load ${type} images`,
          description: error.response?.data?.message || error.message || "Server error",
          variant: "destructive",
        });
      }
    } finally {
      setter.setLoading(false);
    }
  };

  const refreshAllSections = async () => {
    setGlobalLoading(true);

    await Promise.all([
      fetchImages("hero", hero),
      fetchImages("ad", banner),
      fetchImages("logo", logo),
      fetchImages("category-logo", categoryLogo),
    ]);

    setGlobalLoading(false);
  };

  useEffect(() => {
    refreshAllSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only bootstrap
  }, []);

  const getSectionSetter = (type) => sectionState[type];

  const handleUploadSuccess = (type, uploaded) => {
    const section = getSectionSetter(type);
    section.setImages((prev) => [...prev, ...uploaded]);
    section.setUploadQueue([]);
    const ids = (uploaded || []).map((u) => u._id).filter(Boolean);
    if (ids.length) {
      setNewImageIds((prev) => new Set([...prev, ...ids]));
      window.setTimeout(() => {
        setNewImageIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
      }, 1600);
    }
    toast({
      title: `${uploaded.length} ${type === "logo" ? "logo" : "image"} uploaded`,
      description: "Assets are live in the gallery.",
      variant: "success",
    });
  };

  const handleDelete = async (image, type) => {
    const section = getSectionSetter(type);
    try {
      await axios.delete(`${API_BASE}/image/delete-image/${image._id}`, {
        withCredentials: true,
      });
      section.setImages((prev) => prev.filter((item) => item._id !== image._id));
      toast({
        title: "Image deleted",
        description: "The asset was removed from this section.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error.response?.data?.message || error.message || "Unable to delete image",
        variant: "destructive",
      });
    }
  };

  const handleSetPrimary = async (image, type) => {
    const section = getSectionSetter(type);
    try {
      const response = await axios.patch(
        `${API_BASE}/image/set-primary/${image._id}`,
        {},
        {
          withCredentials: true,
        }
      );
      section.setImages((prev) =>
        prev.map((item) => ({
          ...item,
          isPrimary: item._id === response.data.image._id,
        }))
      );
      toast({
        title: `Primary ${type} image updated`,
        description: "Homepage will prefer this asset.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Failed to set primary",
        description: error.response?.data?.message || error.message || "Unable to set primary image",
        variant: "destructive",
      });
    }
  };

  const handleReplace = async (image, type) => {
    const section = getSectionSetter(type);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (event) => {
      const originalFile = event.target.files?.[0];
      const file = await compressImageFile(originalFile);
      if (!file) return;

      try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await axios.patch(
          `${API_BASE}/image/update-image/${image._id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          }
        );

        section.setImages((prev) =>
          prev.map((item) => (item._id === image._id ? response.data.image : item))
        );
        toast({
          title: "Image replaced",
          description: "The tile now shows the new file.",
          variant: "success",
        });
      } catch (error) {
        toast({
          title: "Replace failed",
          description: error.response?.data?.message || error.message || "Unable to replace image",
          variant: "destructive",
        });
      }
    };

    input.click();
  };

  return (
    <AdminPage
      eyebrow="Homepage media"
      title="Home Images"
      description="Manage hero, banner, logo, and category image assets with simple controls."
    >
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="w-full px-0 sm:px-2 lg:px-2"
      >
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-[0.35em] text-[#D4AF37]">
              Homepage Images
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Manage hero, banner/ad, and logo system images for the homepage.
            </p>
          </div>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              variant="secondary"
              onClick={refreshAllSections}
              disabled={globalLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh all
            </Button>
          </motion.div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-10"
        >
          {sectionConfig.map((section) => {
            const state = sectionState[section.key];
            return (
              <motion.section
                key={section.key}
                variants={itemVariants}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className="rounded-3xl border border-neutral-800 bg-[#111111] p-6 shadow-xl shadow-black/20"
              >
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-[#d0c5af]">
                      {section.label}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white">
                      {section.description}
                    </h2>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <span className="rounded-full border border-neutral-800 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.25em] text-[#D4AF37]">
                      {state.images.length} stored
                    </span>
                    <span className="rounded-full border border-neutral-800 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.25em] text-gray-400">
                      Primary: {state.images.find((img) => img.isPrimary) ? "selected" : "none"}
                    </span>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                  <div className="space-y-4">
                    {section.isCategorized ? (
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {["Boys", "Girls", "Unisex"].map((catLabel) => (
                          <div key={catLabel} className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                              {catLabel} Logo
                            </h3>
                            <ImageUpload
                              images={state.uploadQueue.filter((q) => q.label === catLabel)}
                              setImages={(updater) => {
                                const newQueue = typeof updater === "function" ? updater(state.uploadQueue) : updater;
                                state.setUploadQueue(
                                  newQueue.map((q) => (q.label ? q : { ...q, label: catLabel }))
                                );
                              }}
                              refModel="System"
                              type={section.key}
                              label={catLabel}
                              isMultiple={false}
                              onUploadSuccess={(images) => handleUploadSuccess(section.key, images)}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ImageUpload
                        images={state.uploadQueue}
                        setImages={state.setUploadQueue}
                        refModel="System"
                        type={section.key}
                        onUploadSuccess={(images) => handleUploadSuccess(section.key, images)}
                      />
                    )}
                    <p className="text-sm text-gray-400">
                      Upload new {section.key === "logo" ? "logo" : "hero/banner"} assets and set the primary image from the gallery.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-4">
                      <p className="text-sm uppercase tracking-[0.23em] text-[#d0c5af]">
                        Existing uploads
                      </p>
                      {state.loading ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <SkeletonCard />
                          <SkeletonCard />
                        </div>
                      ) : state.images.length === 0 ? (
                        <p className="mt-4 text-sm text-gray-400">No images uploaded yet.</p>
                      ) : (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <AnimatePresence>
                            {state.images.map((image) => (
                              <motion.div
                                key={image._id}
                                layout
                                initial={
                                  newImageIds.has(image._id)
                                    ? { scale: 0.85, opacity: 0 }
                                    : { opacity: 1, scale: 1 }
                                }
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                                whileHover={{ y: -4 }}
                                className="group overflow-hidden rounded-3xl border border-neutral-800 bg-black/50"
                              >
                                <div className="relative">
                                  <ShimmerImageTile src={image.url} alt={image.altText || section.label} />
                                  {image.isPrimary ? (
                                    <span className="absolute left-3 top-3 z-20 rounded-full bg-[#D4AF37] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-black">
                                      Primary
                                    </span>
                                  ) : null}
                                  {image.label ? (
                                    <span className="absolute right-3 top-3 z-20 rounded-full bg-black/80 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                                      {image.label}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="space-y-2 p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="truncate text-sm font-semibold text-white">{image.altText || "Uploaded image"}</p>
                                    <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-gray-400">
                                      {section.key}
                                    </span>
                                  </div>
                                  <div className="grid gap-2 sm:grid-cols-3">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => handleSetPrimary(image, section.key)}
                                      className="inline-flex items-center justify-center gap-1.5"
                                      title="Set as primary image"
                                    >
                                      <Star className="h-3.5 w-3.5" />
                                      <span className="text-[10px] font-semibold uppercase tracking-wide">Primary</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => handleReplace(image, section.key)}
                                      className="inline-flex items-center justify-center gap-1.5"
                                      title="Replace image file"
                                    >
                                      <ArrowUpRight className="h-3.5 w-3.5" />
                                      <span className="text-[10px] font-semibold uppercase tracking-wide">Replace</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDelete(image, section.key)}
                                      className="inline-flex items-center justify-center gap-1.5"
                                      title="Delete image"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span className="text-[10px] font-semibold uppercase tracking-wide">Delete</span>
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.section>
            );
          })}
        </motion.div>
      </motion.div>
    </AdminPage>
  );
};

export default AdminHomeImages;
