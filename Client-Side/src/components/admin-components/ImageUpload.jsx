/* Client-Side/src/components/admin-components/ImageUpload.jsx */
import React, { useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

const ImageUpload = ({ images = [], setImages, isMultiple = true, className }) => {
    const inputRef = useRef(null)

    const handleImageFileChange = (event) => {
        const selectedFiles = event.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            const newImages = Array.from(selectedFiles).map(file => ({
                file,
                url: URL.createObjectURL(file)
            }));
            
            if (isMultiple) {
                setImages(prev => [...prev, ...newImages]);
            } else {
                setImages(newImages);
            }
        }
    }

    const handleDragOver = (event) => {
        event.preventDefault();
    }

    const handleDrop = (event) => {
        event.preventDefault();
        const droppedFiles = event.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
             const newImages = Array.from(droppedFiles).map(file => ({
                file,
                url: URL.createObjectURL(file)
            }));

            if (isMultiple) {
                setImages(prev => [...prev, ...newImages]);
            } else {
                setImages(newImages);
            }
        }
    }

    const removeImage = (indexToRemove) => {
        setImages(images.filter((_, index) => index !== indexToRemove));
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
    )
}

export default ImageUpload