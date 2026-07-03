import React, { useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useProductForm } from './ProductFormContext';
import { ConfirmInline } from '@/components/admin-components/_shared/ConfirmInline';

export const StickyHeader = ({ onBack, onSaveDraft, onPublish, isEditing = false, productSlug }) => {
  const { isSaving, isDirty } = useProductForm();
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const statusLabel = isSaving
    ? 'Saving…'
    : isDirty
      ? 'Unsaved changes'
      : 'All changes saved';

  const handleBack = () => {
    if (isDirty && !isSaving) {
      setShowBackConfirm(true);
      return;
    }
    onBack();
  };

  const handlePreview = () => {
    if (isEditing && productSlug) {
      window.open(`/shop/product/${productSlug}`, '_blank', 'noopener,noreferrer');
      return;
    }
  };

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.04] bg-[#0a0a0a]/80 px-8 py-5 backdrop-blur-xl">
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={handleBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#111111] text-white/70 shadow-sm transition-all hover:bg-white/5 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${
              isSaving ? 'animate-pulse bg-[#D4AF37]' : isDirty ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
          />
          <span className={isDirty ? 'text-white/80' : 'text-white/50'}>{statusLabel}</span>
        </div>
      </div>

      {showBackConfirm && (
        <div className="absolute left-8 top-full z-50 mt-2 w-72">
          <ConfirmInline
            show
            message="Discard unsaved changes?"
            onCancel={() => setShowBackConfirm(false)}
            onConfirm={() => {
              setShowBackConfirm(false);
              onBack();
            }}
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSaving}
          className="rounded-xl border border-white/10 bg-transparent px-5 py-2.5 text-[13px] font-semibold tracking-wide text-white transition-all hover:bg-white/5 hover:text-white disabled:opacity-50 shadow-sm"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Draft'}
        </button>

        <button
          type="button"
          onClick={handlePreview}
          disabled={!isEditing || !productSlug}
          title={!isEditing ? 'Save product first to preview on storefront' : 'Open storefront preview'}
          className="rounded-xl border border-white/10 bg-transparent px-5 py-2.5 text-[13px] font-semibold tracking-wide text-white transition-all hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
        >
          Preview
        </button>

        <button
          type="button"
          onClick={onPublish}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-[#5235e8] hover:bg-[#4323d8] px-6 py-2.5 text-[13px] font-bold text-white transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(82,53,232,0.15)]"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Publish Product
        </button>
      </div>
    </div>
  );
};
