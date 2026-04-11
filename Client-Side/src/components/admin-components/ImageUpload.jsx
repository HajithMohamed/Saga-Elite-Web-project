/* Client-Side/src/components/admin-components/ImageUpload.jsx */
import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/v1`
  : 'http://localhost:5001/api/v1';

const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMTMxMzEzIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjZDBjNWFmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=';

const ImageUpload = ({
  images = [],
  setImages,
  isMultiple = true,
  className,
  refId,
  refModel,
  type,
}) => {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [updatingIndex, setUpdatingIndex] = useState(null);

  const handleImageFileChange = (event) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const newImages = Array.from(selectedFiles).map((file) => ({
        file,
        url: URL.createObjectURL(file),
        isUploaded: false,
      }));

      if (isMultiple) {
        setImages((prev) => [...prev, ...newImages]);
      } else {
        setImages(newImages);
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const newImages = Array.from(droppedFiles).map((file) => ({
        file,
        url: URL.createObjectURL(file),
        isUploaded: false,
      }));

      if (isMultiple) {
        setImages((prev) => [...prev, ...newImages]);
      } else {
        setImages(newImages);
      }
    }
  };

  const removeImage = (indexToRemove) => {
    const imageToRemove = images[indexToRemove];
    if (imageToRemove && !imageToRemove.isUploaded) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  async function uploadImages() {
    if (!refModel) {
      setUploadError('refModel is required');
      return;
    }
    if (refModel !== 'System' && !refId) {
      setUploadError('refId is required for non-System images');
      return;
    }
    if (refModel === 'System' && !type) {
      setUploadError('type is required for System images');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('refModel', refModel);
    if (refId) formData.append('refId', refId);
    if (type) formData.append('type', type);

    const filesToUpload = images.filter((img) => !img.isUploaded && img.file);
    filesToUpload.forEach((img) => formData.append('images', img.file));

    if (filesToUpload.length === 0) {
      setUploadError('No new images to upload');
      setIsUploading(false);
      return;
    }

    try {
      const apiResponse = await axios.post(
        `${API_BASE}/image/upload-image`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        }
      );

      if (apiResponse.data.success) {
        const uploadedImages = apiResponse.data.images.map((serverImg) => ({
          ...serverImg,
          isUploaded: true,
        }));

        images.forEach((img) => {
          if (!img.isUploaded) URL.revokeObjectURL(img.url);
        });

        setImages(uploadedImages);
      } else {
        setUploadError(
          'Upload failed: ' + (apiResponse.data.message || 'Unknown error')
        );
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || error.message || 'Upload failed';
      setUploadError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  }

  async function updateImage(index) {
    const image = images[index];
    if (!image || !image.isUploaded || !image._id) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setIsUploading(true);
      setUploadError(null);
      setUpdatingIndex(index);

      const formData = new FormData();
      formData.append('image', file);

      try {
        const apiResponse = await axios.patch(
          `${API_BASE}/image/update-image/${image._id}`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true,
          }
        );

        if (apiResponse.data.success) {
          // Update the image in state
          const updatedImage = apiResponse.data.image;
          setImages((prev) =>
            prev.map((img, i) =>
              i === index ? { ...updatedImage, isUploaded: true } : img
            )
          );
        } else {
          setUploadError(
            'Update failed: ' + (apiResponse.data.message || 'Unknown error')
          );
        }
      } catch (error) {
        const errorMsg =
          error.response?.data?.message || error.message || 'Update failed';
        setUploadError(errorMsg);
      } finally {
        setIsUploading(false);
        setUpdatingIndex(null);
      }
    };
    input.click();
  }

  return (
    <div className={`w-full space-y-4 ${className}`}>
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-800 hover:border-[#D4AF37] rounded-lg p-6 bg-black/40 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 group"
        onClick={() => inputRef.current?.click()}
      >
        <Input
          id="image-upload"
          type="file"
          className="hidden"
          ref={inputRef}
          onChange={handleImageFileChange}
          multiple={isMultiple}
          accept="image/*"
        />
        <div className="bg-gray-900 group-hover:bg-[#D4AF37]/10 p-4 rounded-full transition-colors">
          <Upload className="h-6 w-6 text-gray-400 group-hover:text-[#D4AF37] transition-colors" />
        </div>
        <p className="text-sm font-medium text-gray-400 group-hover:text-[#D4AF37] transition-colors">
          Click or Drag to upload images
        </p>
      </div>

      {images && images.length > 0 && (
        <>
          <Button
            onClick={uploadImages}
            disabled={isUploading || images.every((img) => img.isUploaded)}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Images'
            )}
          </Button>
          {uploadError && (
            <p className="text-red-500 text-sm">{uploadError}</p>
          )}
        </>
      )}

      {images && images.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-4">
          {images.map((img, index) => (
            <div
              key={index}
              className="relative group aspect-square bg-black/40 rounded-lg overflow-hidden border border-gray-800 hover:border-[#D4AF37]/50 transition-all"
            >
              <img
                src={img.url}
                alt={`Preview ${index}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => (e.target.src = placeholder)}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {img.isUploaded && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateImage(index);
                    }}
                    disabled={isUploading}
                    className="h-8 w-8 rounded-full"
                    title="Replace image"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;