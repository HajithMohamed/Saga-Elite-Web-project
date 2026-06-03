/* Client-Side/src/components/admin-components/ImageUpload.jsx */

import React, { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { compressImageFile } from "@/lib/image-compression";

const placeholder =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMTMxMzEzIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjZDBjNWFmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=";

const ImageUpload = ({
  images = [],
  setImages,
  isMultiple = true,
  className,
  refId,
  refModel,
  type,
  label, // Added label prop
  colorTag, // Color tag for variant-based image grouping
  disabled = false,
  stagedOnly = false,
  onUploadSuccess,
}) => {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [updatingIndex, setUpdatingIndex] = useState(null);

  /* ---------------- FILE SELECT ---------------- */

  const handleImageFileChange = async (event) => {
    const files = event.target.files;
    if (!files?.length) return;

    const preparedFiles = await Promise.all(
      Array.from(files).map((file) => compressImageFile(file))
    );

    const newImages = preparedFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      isUploaded: false,
      label,
      colorTag: colorTag || "",
    }));

    if (isMultiple) {
      setImages((prev) => [...prev, ...newImages]);
    } else {
      setImages(newImages);
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (!files?.length) return;

    const preparedFiles = await Promise.all(
      Array.from(files).map((file) => compressImageFile(file))
    );

    const newImages = preparedFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      isUploaded: false,
      label,
      colorTag: colorTag || "",
    }));

    if (isMultiple) {
      setImages((prev) => [...prev, ...newImages]);
    } else {
      setImages(newImages);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  /* ---------------- REMOVE IMAGE ---------------- */

  const removeImage = async (index) => {
    const img = images[index];
    if (!img) return;

    // Persisted image: delete on server first so it does not reappear after refresh.
    if (img.isUploaded && img._id) {
      setIsUploading(true);
      setUploadError(null);
      try {
        const res = await axios.delete(`${API_BASE}/image/delete-image/${img._id}`, {
          withCredentials: true,
        });

        if (res.data?.success) {
          setImages((prev) => prev.filter((_, i) => i !== index));
        } else {
          setUploadError(res.data?.message || "Failed to delete image");
        }
      } catch (err) {
        setUploadError(
          err.response?.data?.message || err.message || "Failed to delete image"
        );
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Pending local image: revoke object URL and remove locally.
    if (!img.isUploaded && img.url?.startsWith("blob:")) {
      URL.revokeObjectURL(img.url);
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  /* ---------------- UPLOAD IMAGES ---------------- */

  const uploadImages = async () => {
    if (!refModel) return setUploadError("refModel is required");
    if (refModel !== "System" && !refId)
      return setUploadError("refId is required");
    if (refModel === "System" && !type)
      return setUploadError("type is required");

    const filesToUpload = images.filter((img) => !img.isUploaded && img.file);

    if (filesToUpload.length === 0) {
      return setUploadError("No new images to upload");
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("refModel", refModel);
    if (refId) formData.append("refId", refId);
    if (type) formData.append("type", type);
    if (label) formData.append("label", label); // Append label if exists
    if (colorTag) formData.append("colorTag", colorTag); // Append color tag for variant images

    filesToUpload.forEach((img) =>
      formData.append("images", img.file)
    );

    try {
      const res = await axios.post(
        `${API_BASE}/image/upload-image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        const uploaded = res.data.images.map((img) => ({
          ...img,
          isUploaded: true,
        }));

        images.forEach((img) => {
          if (!img.isUploaded) URL.revokeObjectURL(img.url);
        });

        setImages(uploaded);
        if (onUploadSuccess) {
          onUploadSuccess(uploaded);
        }
      } else {
        setUploadError(res.data.message || "Upload failed");
      }
    } catch (err) {
      setUploadError(
        err.response?.data?.message || err.message || "Upload failed"
      );
    } finally {
      setIsUploading(false);
    }
  };

  /* ---------------- UPDATE IMAGE ---------------- */

  const updateImage = (index) => {
    const image = images[index];
    if (!image?._id) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
        const originalFile = e.target.files[0];
        const file = await compressImageFile(originalFile);
        if (!file) return;

      setIsUploading(true);
      setUpdatingIndex(index);

      const formData = new FormData();
      formData.append("image", file);

      try {
        const res = await axios.patch(
          `${API_BASE}/image/update-image/${image._id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          }
        );

        if (res.data.success) {
          setImages((prev) =>
            prev.map((img, i) =>
              i === index ? { ...res.data.image, isUploaded: true } : img
            )
          );
        }
      } catch (err) {
        setUploadError("Update failed");
      } finally {
        setIsUploading(false);
        setUpdatingIndex(null);
      }
    };

    input.click();
  };

  /* ---------------- UI ---------------- */

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {label && (
        <div className="inline-flex items-center rounded-full border border-[#D4AF37]/20 bg-[#111]/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
          Upload category logo: {label}
        </div>
      )}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`border-2 border-dashed border-gray-800 rounded-lg p-6 flex flex-col items-center gap-2 ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-[#D4AF37]"
        }`}
      >
        <Input
          type="file"
          ref={inputRef}
          className="hidden"
          multiple={isMultiple}
          accept="image/*"
          onChange={handleImageFileChange}
          disabled={disabled}
        />

        <Upload className="h-6 w-6 text-gray-400" />
        <p className="text-sm text-gray-400">
          Click or Drag to upload images
        </p>
      </div>

      {images.length > 0 && (
        <>
          {!stagedOnly ? (
            <Button
              onClick={uploadImages}
              disabled={disabled || isUploading || images.every((i) => i.isUploaded)}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Images"
              )}
            </Button>
          ) : null}

          {uploadError && !stagedOnly && (
            <p className="text-red-500 text-sm">{uploadError}</p>
          )}

          <div className="grid grid-cols-3 gap-4">
            {images.map((img, i) => (
              <div key={i} className="relative group">
                <img
                  src={img.url}
                  onError={(e) => (e.target.src = placeholder)}
                  className="w-full h-32 object-cover rounded"
                />

                <div className="absolute inset-0 hidden group-hover:flex items-center justify-center gap-2 bg-black/50">
                  {img.isUploaded && (
                    <Button size="icon" onClick={() => updateImage(i)}>
                      <Upload size={14} />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    disabled={isUploading}
                    onClick={() => removeImage(i)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageUpload;
