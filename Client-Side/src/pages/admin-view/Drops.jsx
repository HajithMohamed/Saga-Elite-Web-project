import React, { Fragment, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/admin-components/ImageUpload";
import {
  Package,
  Calendar,
  Archive,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";
import {
  getAllDrops,
  updateDrop,
  deleteDrop,
  archiveDrop,
  createDrop,
} from "@/store/admin/drop-slice";
import { useToast } from "@/hooks/use-toast";

const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMTMxMzEzIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjZDBjNWFmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=';

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

  const dispatch = useDispatch();
  const { drops, isLoading, error } = useSelector((state) => state.drop);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(getAllDrops());
  }, [dispatch]);

  function onSubmit(event) {
    event.preventDefault();

    if (currentEditedSlug) {
      dispatch(updateDrop({ slug: currentEditedSlug, dropData: formData })).then(
        (data) => {
          if (data.meta.requestStatus === "fulfilled") {
            dispatch(getAllDrops());
            toast({
              title: "Drop updated successfully",
              className: "bg-black border border-[#D4AF37] text-[#D4AF37]",
            });
            setShowForm(false);
            setFormData(initialFormData);
            setCurrentEditedSlug(null);
            setCurrentEditedId(null);
          } else {
            toast({
              title: "Failed to update Drop",
              variant: "destructive",
            });
          }
        }
      );
    } else {
      dispatch(createDrop(formData)).then((data) => {
        if (data.meta.requestStatus === "fulfilled") {
          dispatch(getAllDrops());
          toast({
            title: "Drop created successfully",
            className: "bg-black border border-[#D4AF37] text-[#D4AF37]",
          });
          setCurrentEditedId(data.payload._id);
          setCurrentEditedSlug(data.payload.slug);
          setFormData({
            name: data.payload.name,
            description: data.payload.description,
            releaseDate: data.payload.releaseDate.split("T")[0],
            endDate: data.payload.endDate ? data.payload.endDate.split("T")[0] : "",
            isPublished: data.payload.isPublished,
            isArchived: data.payload.isArchived,
          });
        } else {
          toast({
            title: "Failed to create Drop",
            variant: "destructive",
          });
        }
      });
    }
  }

  function handleDelete(slug) {
    if (window.confirm("Are you sure you want to delete this Drop?")) {
      dispatch(deleteDrop(slug)).then((data) => {
        if (data.meta.requestStatus === "fulfilled") {
          toast({
            title: "Drop deleted successfully",
            className: "bg-black border border-[#D4AF37] text-[#D4AF37]",
          });
        } else {
          toast({
            title: "Failed to delete Drop",
            description: data.payload.message,
            variant: "destructive",
          });
        }
      });
    }
  }

  function handleArchive(slug, isArchived) {
    dispatch(archiveDrop({ slug, isArchived: !isArchived })).then((data) => {
      if (data.meta.requestStatus === "fulfilled") {
        toast({
          title: `Drop ${
            !isArchived ? "archived" : "unarchived"
          } successfully`,
          className: "bg-black border border-[#D4AF37] text-[#D4AF37]",
        });
      } else {
        toast({
          title: "Failed to toggle archive status",
          variant: "destructive",
        });
      }
    });
  }

  if (showForm) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-[#131313] text-[#e2e2e2] font-['Manrope'] p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <header className="mb-12">
            <button
              onClick={() => {
                setShowForm(false);
                setFormData(initialFormData);
                setCurrentEditedSlug(null);
                setCurrentEditedId(null);
                setDropImages([]);
              }}
              className="flex items-center text-[#d0c5af] hover:text-[#f2ca50] transition-colors mb-6 text-sm uppercase tracking-wider font-bold"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Catalogue
            </button>

            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-8 h-[2px] bg-[#f2ca50]"></span>
              <span className="text-[#f2ca50] font-['Manrope'] text-[10px] tracking-[0.3em] uppercase font-bold">
                Catalogue Expansion
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
              {currentEditedSlug ? "Edit Drop" : "Create New Drop"}
            </h1>
            <p className="text-[#d0c5af] font-sans text-lg">
              {currentEditedSlug
                ? "Update details and curate the launch experience."
                : "Schedule a new product release and curate the launch experience."}
            </p>
          </header>

          {/* Form Grid */}
          <form className="space-y-8" onSubmit={onSubmit}>
            {/* Section: General Details */}
            <div className="bg-[#1b1b1b] p-8 md:p-12 border-l-2 border-[#d4af37] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#f2ca50]/5 blur-3xl pointer-events-none"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[10px] font-bold tracking-[0.15em] text-[#d0c5af] uppercase">
                    Drop Name
                  </label>
                  <input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-[#353535] border-0 py-4 px-6 text-[#e2e2e2] focus:ring-1 focus:ring-[#f2ca50] placeholder:text-[#d0c5af]/40 transition-all font-sans"
                    placeholder="e.g. Winter Solstice 2024"
                    type="text"
                    required
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[10px] font-bold tracking-[0.15em] text-[#d0c5af] uppercase">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full bg-[#353535] border-0 py-4 px-6 text-[#e2e2e2] focus:ring-1 focus:ring-[#f2ca50] placeholder:text-[#d0c5af]/40 transition-all font-sans custom-scrollbar resize-none"
                    placeholder="Describe the concept and items included in this release..."
                    rows="4"
                  ></textarea>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold tracking-[0.15em] text-[#d0c5af] uppercase">
                    Release Date
                  </label>
                  <input
                    value={formData.releaseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, releaseDate: e.target.value })
                    }
                    className="w-full bg-[#353535] border-0 py-4 px-6 text-[#e2e2e2] focus:ring-1 focus:ring-[#f2ca50] transition-all font-sans [color-scheme:dark]"
                    type="date"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold tracking-[0.15em] text-[#d0c5af] uppercase">
                    End Date
                  </label>
                  <input
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full bg-[#353535] border-0 py-4 px-6 text-[#e2e2e2] focus:ring-1 focus:ring-[#f2ca50] transition-all font-sans [color-scheme:dark]"
                    type="date"
                  />
                </div>
              </div>
            </div>

            {/* Section: Visual Assets & Toggles */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Image Upload Area */}
              <div className="lg:col-span-2 bg-[#1b1b1b] p-8 space-y-6">
                <label className="block text-[10px] font-bold tracking-[0.15em] text-[#d0c5af] uppercase">
                  Campaign Assets
                </label>
                {currentEditedSlug === null ? (
                  <div className="p-8 text-center border-2 border-dashed border-[#4d4635] text-[#d0c5af] bg-[#131313]">
                    <p className="text-sm font-bold uppercase tracking-wider mb-2 text-[#f2ca50]">
                      Drop Creation Required
                    </p>
                    <p className="text-xs">
                      Save this drop first before uploading campaign images.
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#131313] p-4 border border-[#353535]">
                    <ImageUpload
                      images={dropImages}
                      setImages={setDropImages}
                      refModel="Drop"
                      refId={currentEditedId}
                      type="drop"
                    />
                  </div>
                )}
              </div>

              {/* Status Configuration */}
              <div className="bg-[#1b1b1b] p-8 space-y-10">
                <label className="block text-[10px] font-bold tracking-[0.15em] text-[#d0c5af] uppercase">
                  Configuration
                </label>
                {/* Published Toggle */}
                <div className="flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#e2e2e2]">
                      Published
                    </span>
                    <span className="text-[10px] text-[#d0c5af] uppercase tracking-tighter">
                      Visible to clients
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      checked={formData.isPublished}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isPublished: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                      type="checkbox"
                    />
                    <div className="w-11 h-6 bg-[#353535] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d4af37]"></div>
                  </label>
                </div>
                {/* Archived Toggle */}
                <div className="flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#e2e2e2]">
                      Archived
                    </span>
                    <span className="text-[10px] text-[#d0c5af] uppercase tracking-tighter">
                      Internal records only
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      checked={formData.isArchived}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isArchived: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                      type="checkbox"
                    />
                    <div className="w-11 h-6 bg-[#353535] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d4af37]"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <footer className="flex flex-col md:flex-row items-center gap-8 pt-8 border-t border-[#4d4635]/20">
              <button
                className="w-full md:w-auto px-12 py-5 bg-gradient-to-br from-[#f2ca50] to-[#d4af37] text-[#241a00] font-['Manrope'] font-black text-xs uppercase tracking-[0.2em] shadow-[0px_0px_12px_rgba(242,202,80,0.2)] hover:shadow-[0px_0px_24px_rgba(242,202,80,0.3)] transition-all active:scale-[0.98]"
                type="submit"
              >
                {currentEditedSlug ? "Update Drop" : "Create Drop"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData(initialFormData);
                  setCurrentEditedSlug(null);
                  setCurrentEditedId(null);
                  setDropImages([]);
                }}
                className="font-['Manrope'] font-bold text-[10px] text-[#f2ca50] uppercase tracking-[0.2em] hover:text-white transition-colors underline decoration-[#f2ca50]/30 underline-offset-8"
              >
                Cancel
              </button>
            </footer>
          </form>
        </div>
      </div>
    );
  }

  // --- CATALOGUE LIST VIEW ---
  return (
    <Fragment>
      <div className="mb-8 flex w-full justify-between items-center px-4 sm:px-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-serif font-bold text-[#D4AF37]">
            Drop Management
          </h1>
          <p className="text-gray-400 text-sm tracking-wide uppercase font-sans">
            Manage your limited release drops
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setCurrentEditedSlug(null);
            setCurrentEditedId(null);
            setFormData(initialFormData);
          }}
          className="bg-[#D4AF37] text-black hover:bg-[#b5952f] font-bold tracking-wide"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Drop
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>Error: {error.message}</p>
        ) : drops && drops.length > 0 ? (
          drops.map((drop) => (
            <div
              key={drop._id}
              className="group relative overflow-hidden bg-[#1b1b1b]/80 border border-[#353535] rounded-none p-6 hover:border-[#D4AF37]/50 transition-all duration-500"
            >
              {drop.images && drop.images.length > 0 && (
                <div className="absolute top-0 left-0 w-full h-full opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                  <img
                    src={drop.images[0].url}
                    alt={drop.name}
                    className="w-full h-full object-cover mix-blend-overlay"
                    onError={(e) => e.target.src = placeholder}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#131313]/90" />
                </div>
              )}

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-[#131313] rounded-sm border border-[#353535] group-hover:bg-[#D4AF37]/10 group-hover:border-[#D4AF37]/30 transition-colors">
                    <Package className="h-6 w-6 text-gray-400 group-hover:text-[#D4AF37] transition-colors" />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span
                      className={`px-2 py-1 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1 ${
                        drop.isPublished
                          ? "border border-green-500/30 bg-green-500/10 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                          : "border border-yellow-500/30 bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {drop.isPublished && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      )}
                      {drop.isPublished ? "Live" : "Draft"}
                    </span>
                    {drop.isArchived && (
                      <span className="px-2 py-1 text-[10px] uppercase font-bold tracking-widest border border-gray-500/30 bg-gray-500/10 text-[#d0c5af]">
                        Archived
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-serif font-bold text-[#e2e2e2] mb-2 group-hover:text-[#D4AF37] transition-colors">
                  {drop.name}
                </h3>
                <p className="text-sm text-[#d0c5af] mb-6 line-clamp-2 flex-grow font-sans">
                  {drop.description || "No description provided."}
                </p>

                <div className="space-y-2 mt-auto text-xs text-[#d0c5af]/70 font-medium uppercase tracking-widest border-t border-[#353535] pt-4 mb-4 font-sans">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-[#f2ca50]" />
                    <span>
                      Starts: {new Date(drop.releaseDate).toLocaleDateString()}
                    </span>
                  </div>
                  {drop.endDate && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-[#f2ca50]" />
                      <span>
                        Ends: {new Date(drop.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-t from-[#131313] via-[#131313]/90 to-transparent flex justify-end gap-2 z-20">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 bg-[#1b1b1b] border-[#353535] hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] text-white rounded-none"
                    title="Edit"
                    onClick={() => {
                      setShowForm(true);
                      setCurrentEditedId(drop._id);
                      setCurrentEditedSlug(drop.slug);
                      setFormData({
                        name: drop.name,
                        description: drop.description,
                        releaseDate: drop.releaseDate.split("T")[0],
                        endDate: drop.endDate ? drop.endDate.split("T")[0] : "",
                        isPublished: drop.isPublished,
                        isArchived: drop.isArchived,
                      });
                      setDropImages(drop.images || []);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 bg-[#1b1b1b] border-[#353535] hover:border-gray-400 hover:bg-gray-400/10 hover:text-gray-300 text-white rounded-none"
                    title="Toggle Archive"
                    onClick={() => handleArchive(drop.slug, drop.isArchived)}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 bg-[#1b1b1b] border-[#353535] hover:border-red-500 hover:bg-red-500/10 hover:text-red-500 text-white rounded-none"
                    title="Delete"
                    onClick={() => handleDelete(drop.slug)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-12 border border-dashed border-[#4d4635] bg-[#1b1b1b]/50 group hover:border-[#D4AF37]/50 transition-colors">
            <Package className="h-12 w-12 text-[#4d4635] mb-4 group-hover:text-[#D4AF37]/50 transition-colors" />
            <h3 className="text-lg font-serif font-bold text-[#e2e2e2] group-hover:text-white">
              No Drops Found
            </h3>
            <p className="text-sm text-[#d0c5af] mb-6 font-sans">
              Create your first drop to get started.
            </p>
            <Button
              onClick={() => {
                setShowForm(true);
                setCurrentEditedSlug(null);
                setCurrentEditedId(null);
                setFormData(initialFormData);
              }}
              variant="outline"
              className="border-[#D4AF37] text-[#D4AF37] bg-transparent hover:bg-[#D4AF37] hover:text-[#131313] font-bold tracking-widest uppercase text-xs rounded-none"
            >
              Construct Drop
            </Button>
          </div>
        )}
      </div>
    </Fragment>
  );
};

export default Drops;
