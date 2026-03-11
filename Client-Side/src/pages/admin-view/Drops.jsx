/* Client-Side/src/pages/admin-view/Drops.jsx */
import React, { Fragment, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import CommonForm from "@/components/common-components/CommonForm";
import { dropFormControls } from "@/config";
import ImageUpload from "@/components/admin-components/ImageUpload";
import {
  Package,
  Calendar,
  Tag,
  CheckCircle,
  Archive,
  Plus,
} from "lucide-react";

const initialFormData = {
  name: "",
  description: "",
  releaseDate: "",
  endDate: "",
  isPublished: false,
  isArchived: false,
};

const Drops = () => {
  const [openCreateDropDialog, setOpenCreateDialog] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [dropImages, setDropImages] = useState([]); // Store image objects {file, url}
  const [dropList, setDropList] = useState([]);

  function onSubmit(event) {
    event.preventDefault();

    // Include images in the drop data
    const newDrop = {
      ...formData,
      images: dropImages,
      id: Date.now(),
    };

    setDropList([...dropList, newDrop]);
    setOpenCreateDialog(false);
    setFormData(initialFormData);
    setDropImages([]);
    console.log("Submit logic executed", newDrop);
  }

  return (
    <Fragment>
      <div className="mb-8 flex w-full justify-between items-center px-4 sm:px-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-serif font-bold text-[#D4AF37]">
            Drop Management
          </h1>
          <p className="text-gray-400 text-sm tracking-wide uppercase">
            Manage your limited release drops
          </p>
        </div>
        <Button
          onClick={() => setOpenCreateDialog(true)}
          className="bg-[#D4AF37] text-black hover:bg-[#b5952f] font-bold tracking-wide"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Drop
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dropList && dropList.length > 0 ? (
          dropList.map((drop) => (
            <div
              key={drop.id}
              className="group relative overflow-hidden bg-black/40 border border-gray-800 rounded-xl p-6 hover:border-[#D4AF37]/50 transition-all duration-300"
            >
              {/* Image Preview if available */}
              {drop.images && drop.images.length > 0 && (
                <div className="absolute top-0 left-0 w-full h-32 opacity-20 group-hover:opacity-30 transition-opacity">
                  <img
                    src={drop.images[0].url}
                    alt={drop.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#080808]" />
                </div>
              )}

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-gray-900 rounded-lg group-hover:bg-[#D4AF37]/10 transition-colors">
                    <Package className="h-6 w-6 text-gray-400 group-hover:text-[#D4AF37] transition-colors" />
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${drop.isPublished ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}
                    >
                      {drop.isPublished ? "Live" : "Draft"}
                    </span>
                    {drop.isArchived && (
                      <span className="px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-gray-500/10 text-gray-400">
                        Archived
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#D4AF37] transition-colors">
                  {drop.name}
                </h3>
                <p className="text-sm text-gray-400 mb-6 line-clamp-2 flex-grow">
                  {drop.description || "No description provided."}
                </p>

                <div className="space-y-2 mt-auto text-xs text-gray-500 font-medium uppercase tracking-wider border-t border-gray-800 pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Starts: {new Date(drop.releaseDate).toLocaleDateString()}
                    </span>
                  </div>
                  {drop.endDate && (
                    <div className="flex items-center gap-2">
                      <Archive className="h-3 w-3" />
                      <span>
                        Ends: {new Date(drop.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-10 border border-dashed border-gray-800 rounded-xl bg-black/20">
            <Package className="h-10 w-10 text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-400">No Drops Found</h3>
            <p className="text-sm text-gray-600 mb-6">
              Create your first drop to get started.
            </p>
            <Button
              onClick={() => setOpenCreateDialog(true)}
              variant="outline"
              className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
            >
              Create Drop
            </Button>
          </div>
        )}
      </div>

      <Sheet
        open={openCreateDropDialog}
        onOpenChange={(isOpen) => {
          setOpenCreateDropDialog(isOpen);
          if (!isOpen) {
            setFormData(initialFormData);
            setDropImages([]);
          }
        }}
      >
        <SheetContent className="overflow-y-auto bg-[#080808] border-l-gray-800 w-full max-w-md sm:max-w-lg">
          <SheetHeader className="mb-6 space-y-1 text-left">
            <SheetTitle className="text-2xl font-serif font-bold text-[#D4AF37]">
              Create New Drop
            </SheetTitle>
            <p className="text-sm text-gray-400 font-medium">
              Fill in the details below to schedule a new product drop.
            </p>
          </SheetHeader>

          <div className="space-y-8 mt-4">
            {/* Image Upload Section */}
            <div className="space-y-3">
              <label className="text-sm font-semibold tracking-wide text-gray-200 uppercase">
                Drop Images
              </label>
              <div className="rounded-lg border border-dashed border-gray-800 p-1">
                <ImageUpload
                  images={images}
                  setImages={setImages}
                  refModel="Product"
                  refId="some-product-id"
                  // type="hero" // Only for System
                />
              </div>
            </div>

            {/* Form Section */}
            <div className="relative pb-10">
              <CommonForm
                formControls={dropFormControls}
                formData={formData}
                setFormData={setFormData}
                buttonText="Create Drop"
                onSubmit={onSubmit}
                inputClass="bg-black/40 border-gray-800 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-white placeholder:text-gray-600 rounded-md transition-all duration-200"
                labelClass="text-gray-400 font-medium mb-1"
                buttonClass="bg-[#D4AF37] text-black hover:bg-[#b5952f] font-bold w-full py-6 text-lg tracking-wider transition-all duration-300 shadow-lg shadow-gold/20"
              />

              <button
                onClick={() => setOpenCreateDropDialog(false)}
                className="w-full mt-4 text-gray-500 hover:text-white text-sm font-medium transition-colors py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </Fragment>
  );
};

export default Drops;
