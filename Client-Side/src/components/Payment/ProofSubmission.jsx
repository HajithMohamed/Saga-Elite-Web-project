import React, { useEffect, useState } from "react";
import { FileImage, Loader2, UploadCloud, X } from "lucide-react";
import { compressImageFile } from "@/lib/image-compression";

const ProofSubmission = ({ onSubmitProof, isSubmitting, title = "Submit payment proof", description = "Upload a receipt image or PDF after completing your transfer." }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = async (event) => {
    const rawFile = event.target.files?.[0];

    if (!rawFile) {
      return;
    }

    if (rawFile.size > 5 * 1024 * 1024) {
      setLocalError("File size must be 5MB or smaller.");
      return;
    }

    const file = await compressImageFile(rawFile);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setLocalError(null);
  };

  const clearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);
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
      setLocalError(error?.message || "Failed to submit proof.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[26px] border border-white/10 bg-[#0a0a0a] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500">Receipt Upload</p>
          <h2 className="mt-3 text-2xl font-bold text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
        </div>
        <div className="rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
          <UploadCloud className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-5 transition hover:border-[#D4AF37]/30">
        <label className="flex cursor-pointer flex-col items-center gap-4 text-center">
          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
          />
          {previewUrl ? (
            <div className="w-full max-w-md space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                <div className="flex items-center gap-3 text-left">
                  <FileImage className="h-5 w-5 text-[#D4AF37]" />
                  <div>
                    <p className="text-sm font-semibold text-white">{selectedFile?.name}</p>
                    <p className="text-xs text-gray-500">{selectedFile?.type || "file"}</p>
                  </div>
                </div>
                <button type="button" onClick={clearFile} className="rounded-full border border-white/10 p-2 text-gray-400 transition hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {selectedFile?.type?.startsWith("image/") ? (
                <img src={previewUrl} alt="Proof preview" className="mx-auto max-h-64 rounded-2xl border border-white/10 object-contain" />
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-10 text-sm text-gray-300">
                  PDF selected. Preview will not be rendered in-browser.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 py-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
                <UploadCloud className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Click to browse or drag and drop</p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-gray-500">JPG, PNG, WEBP or PDF up to 5MB</p>
              </div>
            </div>
          )}
        </label>
      </div>

      {localError ? (
        <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {localError}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#D4AF37] px-5 py-4 text-sm font-black uppercase tracking-[0.22em] text-black transition hover:bg-[#c09a2c] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isSubmitting ? "Submitting proof" : "Submit proof"}
      </button>
    </form>
  );
};

export default ProofSubmission;
