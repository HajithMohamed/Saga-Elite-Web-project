/* Client-Side/src/components/admin-components/ImageUpload.jsx */
import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import axios from 'axios'; // Added import for axios

// Added props for backend integration: refId, refModel, type (optional for system images)
const ImageUpload = ({ 
  images = [], 
  setImages, 
  isMultiple = true, 
  className,
  refId, // Required for non-system images (e.g., product/drop ID)
  refModel, // e.g., "Product", "Drop", "System"
  type // Optional, required for "System" refModel (e.g., "hero", "ad", "logo")
}) => {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false); // Added for loading state
  const [uploadError, setUploadError] = useState(null); // Added for error handling

  const handleImageFileChange = (event) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const newImages = Array.from(selectedFiles).map(file => ({
        file,
        url: URL.createObjectURL(file), // Local preview
        isUploaded: false // Track if uploaded to server
      }));
      
      if (isMultiple) {
        setImages(prev => [...prev, ...newImages]);
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
      const newImages = Array.from(droppedFiles).map(file => ({
        file,
        url: URL.createObjectURL(file),
        isUploaded: false
      }));

      if (isMultiple) {
        setImages(prev => [...prev, ...newImages]);
      } else {
        setImages(newImages);
      }
    }
  };

  const removeImage = (indexToRemove) => {
    const imageToRemove = images[indexToRemove];
    if (imageToRemove && !imageToRemove.isUploaded) {
      URL.revokeObjectURL(imageToRemove.url); // Clean up local URL
    }
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  // Updated your uploadToCloudinary function (renamed for clarity)
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

    // Add only non-uploaded images
    const filesToUpload = images.filter(img => !img.isUploaded && img.file);
    filesToUpload.forEach(img => formData.append('images', img.file));

    if (filesToUpload.length === 0) {
      setUploadError('No new images to upload');
      setIsUploading(false);
      return;
    }

    try {
      // Fixed URL (adjust port/host as needed, e.g., http://localhost:3000/api/upload-image)
      const apiResponse = await axios.post('http://localhost:3000/api/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true, // If auth is needed
      });

      if (apiResponse.data.success) {
        // Replace local images with server-returned ones
        const uploadedImages = apiResponse.data.images.map(serverImg => ({
          ...serverImg,
          isUploaded: true
        }));

        // Clean up local URLs and merge
        images.forEach(img => {
          if (!img.isUploaded) URL.revokeObjectURL(img.url);
        });
        setImages(uploadedImages);
      } else {
        setUploadError('Upload failed: ' + (apiResponse.data.message || 'Unknown error'));
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Upload failed';
      setUploadError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  }

  // Removed auto-upload useEffect to avoid loops; call manually via button

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

      {/* Added upload button and error display */}
      {images && images.length > 0 && (
        <>
          <Button 
            onClick={uploadImages} 
            disabled={isUploading || images.every(img => img.isUploaded)}
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
            <div key={index} className="relative group aspect-square bg-black/40 rounded-lg overflow-hidden border border-gray-800 hover:border-[#D4AF37]/50 transition-all">
              <img 
                src={img.url} 
                alt={`Preview ${index}`} 
                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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