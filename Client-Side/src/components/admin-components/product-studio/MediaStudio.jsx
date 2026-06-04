import React, { useRef } from 'react';
import { useProductForm } from './ProductFormContext';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export const MediaStudio = () => {
  const { images, setImages } = useProductForm();
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const newImages = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
      colorTag: '',
      isUploaded: false
    }));
    
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (targetId) => {
    setImages(prev => prev.filter(img => (img.id || img._id) !== targetId));
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-md">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Media Studio</h2>
        <span className="text-xs text-white/50">{images.length} assets</span>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {/* Upload Zone */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/10 bg-black/20 text-white/50 transition-colors hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 hover:text-[#D4AF37]"
        >
          <Upload className="h-6 w-6 transition-transform group-hover:-translate-y-1" />
          <span className="text-xs font-semibold uppercase tracking-wider">Upload Media</span>
          <input 
            ref={fileInputRef}
            type="file" 
            multiple 
            accept="image/*"
            className="hidden" 
            onChange={handleFileChange}
          />
        </div>

        {/* Gallery */}
        {images.map((img) => {
          const imgKey = img.id || img._id;
          return (
          <div key={imgKey} className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-white/10 bg-black/40">
            <img 
              src={img.url} 
              alt="Product media" 
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
            
            <button 
              onClick={() => removeImage(imgKey)}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white/70 opacity-0 backdrop-blur-md transition-all hover:bg-red-500 hover:text-white group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="absolute bottom-2 left-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
              <input 
                type="text" 
                value={img.colorTag}
                onChange={(e) => {
                  const val = e.target.value;
                  setImages(prev => prev.map(i => (i.id || i._id) === imgKey ? { ...i, colorTag: val } : i));
                }}
                placeholder="Variant Color (e.g. Black)"
                className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-md focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>
        )})}
      </div>
    </div>
  );
};
