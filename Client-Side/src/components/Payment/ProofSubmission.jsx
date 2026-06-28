import React, { useEffect, useState, useRef } from "react";
import { FileImage, Loader2, UploadCloud, X, CheckCircle2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { compressImageFile } from "@/lib/image-compression";
import { cn } from "@/lib/utils";

const ProofSubmission = ({ onSubmitProof, isSubmitting, title = "Upload Transfer Receipt", description = "Choose the bank receipt image or PDF that matches your payment." }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const processFile = async (rawFile) => {
    if (!rawFile) return;

    if (rawFile.size > 5 * 1024 * 1024) {
      setLocalError("File size must be 5MB or smaller.");
      return;
    }

    try {
      const file = await compressImageFile(rawFile);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setLocalError(null);
    } catch (err) {
      setLocalError("Error processing file. Please try a different image.");
    }
  };

  const handleFileChange = (event) => {
    processFile(event.target.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const clearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setLocalError("Select a proof file first.");
      return;
    }

    try {
      setLocalError(null);
      await onSubmitProof(selectedFile);
      clearFile();
    } catch (error) {
      const message =
        typeof error === "string"
          ? error
          : error?.response?.data?.message || error?.message || "Failed to submit proof.";
      setLocalError(message);
    }
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onSubmit={handleSubmit} 
      className="overflow-hidden rounded-[2rem] border border-[#f2ca50]/10 bg-[#0d0d0d] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <p className="se-label text-[10px] tracking-[0.28em] text-[#99907c]">Verification</p>
              <div className="flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-sky-300">
                <ShieldCheck className="h-3 w-3" /> Auto-verification active
              </div>
            </div>
            <h2 className="se-serif mt-3 text-2xl text-[#e5e2e1]">{title}</h2>
            <p className="se-body mt-2 text-sm leading-6 text-[#99907c]">{description}</p>
          </div>
        </div>

        <div 
          className={cn(
            "mt-8 overflow-hidden rounded-[24px] border border-dashed transition-all duration-300",
            isDragging ? "scale-[1.02] border-[#f2ca50] bg-[#f2ca50]/5 shadow-[0_0_30px_rgba(242,202,80,0.15)]" : "border-[#4d4635]/60 bg-[#0a0a0a] hover:border-[#f2ca50]/40"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label className="flex w-full cursor-pointer flex-col items-center justify-center p-6 sm:p-10">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
            />
            
            <AnimatePresence mode="wait">
              {previewUrl ? (
                <motion.div 
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full"
                >
                  <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/5 bg-[#131313] px-4 py-3">
                    <div className="flex items-center gap-3 text-left">
                      <FileImage className="h-5 w-5 text-[#f2ca50]" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#e5e2e1]">{selectedFile?.name}</p>
                        <p className="text-[10px] text-[#574500] uppercase tracking-wider">{selectedFile?.type?.replace('image/', '') || "file"} • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button type="button" onClick={(e) => { e.preventDefault(); clearFile(); }} className="rounded-full border border-white/5 bg-[#0a0a0a] p-2 text-[#99907c] transition hover:text-[#e5e2e1] hover:border-white/20">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {selectedFile?.type?.startsWith("image/") ? (
                    <div className="relative flex justify-center">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10" />
                      <img src={previewUrl} alt="Proof preview" className="max-h-56 rounded-xl border border-white/5 object-contain" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-[#131313] py-12 text-sm text-[#99907c]">
                      <FileImage className="mb-3 h-8 w-8 opacity-40" />
                      PDF Selected
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className={cn(
                    "mb-5 flex h-16 w-16 items-center justify-center rounded-full transition-colors duration-300",
                    isDragging ? "bg-[#f2ca50]/20 text-[#f2ca50]" : "bg-[#f2ca50]/5 border border-[#f2ca50]/20 text-[#f2ca50]/70"
                  )}>
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <p className="se-body text-sm text-[#e5e2e1]">
                    <span className="font-semibold text-[#f2ca50]">Click to browse</span> or drag and drop
                  </p>
                  <p className="se-label mt-2 text-[9px] tracking-[0.25em] text-[#574500]">JPG, PNG, WEBP or PDF (MAX 5MB)</p>
                </motion.div>
              )}
            </AnimatePresence>
          </label>
        </div>

        {!selectedFile && !isDragging && (
          <div className="mt-6 flex flex-col items-center border-t border-white/5 pt-6">
            <p className="se-label mb-3 text-[9px] tracking-[0.25em] text-[#574500]">For fast auto-verification ensure</p>
            <div className="flex flex-wrap justify-center gap-4">
              {["Reference visible", "Amount visible", "Date visible"].map((hint) => (
                <div key={hint} className="flex items-center gap-1.5 text-xs text-[#99907c]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/70" />
                  {hint}
                </div>
              ))}
            </div>
          </div>
        )}

        {localError && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {localError}
          </motion.div>
        )}
      </div>

      <div className="border-t border-white/5 bg-black/20 p-6 sm:px-8">
        <button
          type="submit"
          disabled={isSubmitting || !selectedFile}
          className="se-label relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-[#f2ca50] px-5 py-4 text-[11px] uppercase tracking-[0.25em] text-[#0a0a0a] transition hover:bg-[#ffe088] disabled:cursor-not-allowed disabled:bg-[#f2ca50]/50 disabled:text-[#0a0a0a]/50"
        >
          {isSubmitting && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#f2ca50]">
              <Loader2 className="h-5 w-5 animate-spin text-[#0a0a0a]" />
            </div>
          )}
          <span className={cn(isSubmitting ? "opacity-0" : "opacity-100", "flex items-center gap-2 transition-opacity")}>
            {selectedFile ? "Submit Transfer Proof" : "Select File to Continue"}
          </span>
        </button>
      </div>
    </motion.form>
  );
};

export default ProofSubmission;

