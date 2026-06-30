import React, { useEffect, useState, useRef } from "react";
import { FileImage, Loader2, UploadCloud, X, CheckCircle2, ShieldCheck, Eye, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { compressImageFile } from "@/lib/image-compression";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ProofSubmission = ({
  onSubmitProof,
  isSubmitting,
  title = "Upload Transfer Receipt",
  description = "Choose the bank receipt image or PDF that matches your payment.",
}) => {
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

    if (rawFile.size > MAX_FILE_SIZE) {
      setLocalError("File size must be 10MB or smaller.");
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
    const file = event.target.files?.[0];
    if (file) {
      if (selectedFile && file.name === selectedFile.name && file.size === selectedFile.size) {
        setLocalError("This file is already selected.");
        return;
      }
      processFile(file);
    }
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
       if (selectedFile && droppedFile.name === selectedFile.name && droppedFile.size === selectedFile.size) {
        setLocalError("This file is already selected.");
        return;
      }
      processFile(droppedFile);
    }
  };

  const clearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setLocalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setLocalError("Please select a proof file first.");
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0d0d0d] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
      aria-label="Upload payment receipt"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <p className="se-label text-[8px] tracking-[0.25em] text-[#574500]">
                Verification Step
              </p>
              <div className="flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[8px] uppercase tracking-[0.2em] text-sky-400">
                <ShieldCheck className="h-3 w-3" /> Auto-verification active
              </div>
            </div>
            <h2 className="se-serif mt-3 text-[22px] text-[#e5e2e1]">{title}</h2>
            <p className="se-body mt-2 text-sm leading-6 text-[#99907c]">
              {description}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "mt-8 overflow-hidden rounded-[20px] border border-dashed transition-all duration-300 lg:h-[320px] flex items-center justify-center",
            isDragging
              ? "scale-[1.01] border-[#F2CA50] bg-[#F2CA50]/5 shadow-[0_0_30px_rgba(242,202,80,0.15)]"
              : "border-white/20 bg-[#131313] hover:border-[#F2CA50]/40"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-6 sm:p-10">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              capture="environment"
              onChange={handleFileChange}
              disabled={isSubmitting}
            />

            <AnimatePresence mode="wait">
              {previewUrl ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex h-full w-full flex-col"
                  onClick={(e) => e.preventDefault()} // Prevent clicking preview from opening file dialog again
                >
                  <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/5 bg-[#0a0a0a] px-4 py-3">
                    <div className="flex items-center gap-3 text-left min-w-0 flex-1">
                      <FileImage className="h-5 w-5 shrink-0 text-[#F2CA50]" />
                      <div className="min-w-0 pr-4">
                        <p className="truncate text-sm font-semibold text-[#e5e2e1]">
                          {selectedFile?.name}
                        </p>
                        <p className="se-label text-[8px] tracking-wider text-[#99907c]">
                          {selectedFile?.type?.replace("image/", "")?.toUpperCase() || "FILE"}{" "}
                          • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={openFileDialog}
                        disabled={isSubmitting}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[#d0c5af] transition-colors hover:border-[#F2CA50]/50 hover:text-[#F2CA50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2CA50]"
                        title="Replace file"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={clearFile}
                        disabled={isSubmitting}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-rose-400 transition-colors hover:border-rose-500/50 hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        title="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-[#0a0a0a]">
                    {selectedFile?.type?.startsWith("image/") ? (
                      <img
                        src={previewUrl}
                        alt="Receipt preview"
                        className="max-h-full max-w-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[#574500]">
                        <FileImage className="mb-3 h-10 w-10 opacity-40" />
                        <span className="se-label text-[10px] tracking-[0.2em]">
                          PDF Document Selected
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center text-center w-full"
                >
                  <div
                    className={cn(
                      "mb-5 flex h-16 w-16 items-center justify-center rounded-full transition-colors duration-300",
                      isDragging
                        ? "bg-[#F2CA50]/20 text-[#F2CA50]"
                        : "border border-[#F2CA50]/20 bg-[#F2CA50]/5 text-[#F2CA50]/70"
                    )}
                  >
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <p className="se-body text-sm text-[#e5e2e1]">
                    <span className="font-semibold text-[#F2CA50]">
                      Click to browse
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className="se-label mt-2 text-[8px] tracking-[0.25em] text-[#574500]">
                    JPG, PNG, WEBP or PDF (MAX 10MB)
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </label>
        </div>

        {!selectedFile && !isDragging && (
          <div className="mt-6 flex flex-col items-center border-t border-white/5 pt-6">
            <p className="se-label mb-3 text-[8px] tracking-[0.25em] text-[#574500]">
              For fast auto-verification ensure
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {["Reference visible", "Amount visible", "Date visible"].map(
                (hint) => (
                  <div
                    key={hint}
                    className="flex items-center gap-1.5 text-xs text-[#99907c]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#34C759]/70" />
                    {hint}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        <AnimatePresence>
          {localError && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 20 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {localError}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Bar (Visual only, to show activity during submission) */}
      <div className="relative h-1 w-full bg-white/5">
        <motion.div
          className="absolute inset-y-0 left-0 bg-[#F2CA50]"
          initial={{ width: "0%" }}
          animate={{
            width: isSubmitting ? "90%" : selectedFile ? "0%" : "0%",
            transition: { duration: 10, ease: "easeOut" },
          }}
        />
        {isSubmitting && (
          <motion.div
            className="absolute inset-y-0 left-0 bg-white/30"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            style={{ width: "50%" }}
          />
        )}
      </div>

      <div className="bg-[#0a0a0a] p-6 sm:px-8">
        <button
          type="submit"
          disabled={isSubmitting || !selectedFile}
          className="group relative flex w-full h-[56px] items-center justify-center gap-3 overflow-hidden rounded-[16px] bg-[#F2CA50] px-5 text-[10px] uppercase tracking-[0.25em] font-semibold text-[#0E0E0E] transition-all hover:bg-[#FFD86A] disabled:cursor-not-allowed disabled:bg-[#F2CA50]/50 disabled:text-[#0a0a0a]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2CA50] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
        >
          {isSubmitting && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#F2CA50]">
              <Loader2 className="h-5 w-5 animate-spin text-[#0E0E0E]" />
              <span className="ml-3">Uploading...</span>
            </div>
          )}
          <span
            className={cn(
              isSubmitting ? "opacity-0" : "opacity-100",
              "flex items-center gap-2 transition-opacity"
            )}
          >
            {selectedFile ? "Submit Payment Verification" : "Select File to Continue"}
          </span>
        </button>
      </div>
    </motion.form>
  );
};

export default ProofSubmission;
