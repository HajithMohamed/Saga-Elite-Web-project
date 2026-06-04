import React from 'react';
import { ChevronLeft, MoreVertical, Check, Loader2, Sparkles } from 'lucide-react';
import { useProductForm } from './ProductFormContext';

export const StickyHeader = ({ onBack, onSaveDraft, onPublish }) => {
  const { formData, isSaving, healthScore } = useProductForm();
  const isDraft = !formData.isActive;
  
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.04] bg-[#0a0a0a]/80 px-8 py-5 backdrop-blur-xl">
      <div className="flex items-center gap-5">
        <button 
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#111111] text-white/70 shadow-sm transition-all hover:bg-white/5 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold tracking-tight text-white/90">
              {formData.name || 'Untitled Product'}
            </h1>
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${isDraft ? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
              {isDraft ? 'Draft' : 'Active'}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[13px] text-white/40 font-medium">
            <span>{formData.artNo || 'No Article No'}</span>
            <span className="h-1 w-1 rounded-full bg-white/20"></span>
            <span className="flex items-center gap-1.5 text-white/60">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
              Health: <span className="text-white/80">{healthScore}%</span>
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={onSaveDraft}
          disabled={isSaving}
          className="rounded-xl border border-white/10 bg-[#111111] px-5 py-2.5 text-[13px] font-semibold tracking-wide text-white transition-all hover:bg-white/5 hover:text-white disabled:opacity-50 shadow-sm"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Draft'}
        </button>
        
        <button 
          onClick={onPublish}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-[13px] font-bold text-black transition-all hover:bg-gray-100 disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Publish
        </button>
        
        <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#111111] text-white/70 shadow-sm transition-all hover:bg-white/5 hover:text-white">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
