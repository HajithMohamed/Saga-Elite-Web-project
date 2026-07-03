import React, { useRef, useState } from "react";
import axios from "axios";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { compressImageFile } from "@/lib/image-compression";
import { UploadGuidelines } from "./UploadGuidelines";

const ImagePicker = ({
  value,
  onChange,
  label = "Upload image",
  refModel = "SiteConfig",
  refId = "site_content",
  type = "logo",
  guidelines, // optional { dims, aspect, maxSize, formats } → hint under the picker
}) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const compressed = await compressImageFile(file);
      const fd = new FormData();
      fd.append("refModel", refModel);
      fd.append("refId", refId);
      fd.append("type", type);
      fd.append("images", compressed);
      const res = await axios.post(`${API_BASE}/image/upload-image`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      const url = res.data?.images?.[0]?.url || res.data?.url;
      if (!url) throw new Error("Upload returned no URL");
      onChange(url);
      toast({ title: "Image uploaded", variant: "success" });
    } catch (err) {
      toast({
        title: "Upload failed",
        description:
          err?.response?.data?.message || err?.message || "Try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-ink/10 bg-black/40">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-600">
              <ImageIcon className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md border border-gold-ink2/40 bg-gold-deep/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-ink2 transition hover:bg-gold-deep/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5" />
            )}
            {busy ? "Uploading…" : label}
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={busy}
              className="text-[10px] uppercase tracking-[0.18em] text-rose-300 hover:text-rose-200"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
      {value ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-lg border border-ink/10 bg-black/60 px-3 py-2 font-mono text-[11px] text-ink outline-none focus:border-gold-ink2/40"
        />
      ) : null}
      {guidelines ? <UploadGuidelines {...guidelines} className="mt-1" /> : null}
    </div>
  );
};

export default ImagePicker;
