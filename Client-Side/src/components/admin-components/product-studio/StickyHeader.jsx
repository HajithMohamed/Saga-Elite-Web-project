import React from 'react';
import { ChevronLeft, MoreVertical, Check, Loader2, Sparkles } from 'lucide-react';
import { useProductForm } from './ProductFormContext';

export const StickyHeader = ({ onBack, onSaveDraft, onPublish }) => {
  const { formData, isSaving, healthScore } = useProductForm();
  const isDraft = !formData.isActive;
  
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.08] bg-black/60 px-6 py-4 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-white">
              {formData.name || 'Untitled Product'}
            </h1>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${isDraft ? 'bg-zinc-500/20 text-zinc-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {isDraft ? 'Draft' : 'Active'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span>{formData.artNo || 'No Article No'}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#D4AF37]" />
              Health: {healthScore}%
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={onSaveDraft}
          disabled={isSaving}
          className="rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Draft'}
        </button>
        
        <button 
          onClick={onPublish}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Publish
        </button>
        
        <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/70 hover:bg-white/5 hover:text-white">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
