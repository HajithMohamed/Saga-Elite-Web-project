import React from 'react';
import { ChevronLeft, Check, Loader2 } from 'lucide-react';
import { useProductForm } from './ProductFormContext';

export const StickyHeader = ({ onBack, onSaveDraft, onPublish }) => {
  const { formData, isSaving, healthScore } = useProductForm();
  
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.04] bg-[#0a0a0a]/80 px-8 py-5 backdrop-blur-xl">
      <div className="flex items-center gap-5">
        <button 
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#111111] text-white/70 shadow-sm transition-all hover:bg-white/5 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 text-sm text-white/60">
          <span className="text-white/40">+</span>
          <span>Unsaved changes</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={onSaveDraft}
          disabled={isSaving}
          className="rounded-xl border border-white/10 bg-transparent px-5 py-2.5 text-[13px] font-semibold tracking-wide text-white transition-all hover:bg-white/5 hover:text-white disabled:opacity-50 shadow-sm"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Draft'}
        </button>
        
        <button 
          onClick={() => alert('Preview mode is coming soon! For now, save draft to preview on the storefront.')}
          className="rounded-xl border border-white/10 bg-transparent px-5 py-2.5 text-[13px] font-semibold tracking-wide text-white transition-all hover:bg-white/5 hover:text-white shadow-sm"
        >
          Preview
        </button>

        <button 
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
