import React, { useState, useEffect } from 'react';
import { useProductForm, PRODUCT_TAG_OPTIONS } from './ProductFormContext';
import { ChevronDown, ChevronRight, Hash } from 'lucide-react';

export const CategorySEOSection = ({ categoryTree = [] }) => {
  const { formData, updateField, validationErrors } = useProductForm();
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toUpperCase();
      if (!formData.tags.includes(newTag)) {
        updateField('tags', [...formData.tags, newTag]);
      }
      setTagInput('');
    }
  };

  const toggleTag = (tag) => {
    const current = formData.tags || [];
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    updateField('tags', next);
  };

  const removeTag = (tagToRemove) => {
    updateField('tags', formData.tags.filter((t) => t !== tagToRemove));
  };

  const pathDisplay = formData.categoryPath
    ? formData.categoryPath.split('/').filter(Boolean).join(' › ')
    : null;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-md">
      <h2 className="mb-6 text-lg font-semibold text-white">Category & Tags</h2>

      <div className="grid gap-6">
        <div className="space-y-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Category Assignment</label>
          {pathDisplay && (
            <div className="rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3 py-2 text-xs text-[#D4AF37]">
              Selected: {pathDisplay}
            </div>
          )}
          {validationErrors.category && (
            <p className="text-sm text-rose-400">{validationErrors.category}</p>
          )}
          <div
            className="rounded-xl border border-white/10 bg-black/40 p-4 max-h-[400px] overflow-y-auto"
            data-lenis-prevent="true"
          >
            <p className="mb-3 text-xs text-white/40">Select the primary category for this product.</p>
            {categoryTree.length === 0 ? (
              <div className="text-sm text-white/30">Loading categories...</div>
            ) : (
              <div className="space-y-2">
                {categoryTree.map((category, index) => (
                  <CategoryNode
                    key={`${category._id}-${index}`}
                    node={category}
                    selectedId={formData.categoryId}
                    onSelect={(id, pathStr, nodePath) => {
                      const rootNode = nodePath[0];
                      const firstSub = nodePath[1];
                      const leafNode = nodePath[nodePath.length - 1];

                      updateField('categoryId', leafNode._id);
                      updateField('categoryPath', pathStr);
                      updateField('category', rootNode.name);
                      updateField('subCategory', firstSub ? firstSub.name : '');
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4" id="tags-section">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Quick Tags</label>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_TAG_OPTIONS.map((tag) => {
              const active = formData.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
                    active
                      ? 'border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#D4AF37]'
                      : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Product Tags</label>
          <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/40 p-3">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-white"
              >
                <Hash className="h-3 w-3 text-[#D4AF37]" />
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-white/50 hover:text-white">
                  &times;
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="min-w-[120px] flex-1 bg-transparent px-2 text-sm text-white placeholder-white/30 outline-none"
              placeholder="Add tag and press enter..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const nodeContainsSelected = (node, selectedId) => {
  if (!selectedId) return false;
  if (String(node._id) === String(selectedId)) return true;
  return (node.children || []).some((child) => nodeContainsSelected(child, selectedId));
};

const CategoryNode = ({ node, level = 0, selectedId, onSelect, pathStr = [], nodePath = [] }) => {
  const [expanded, setExpanded] = useState(level < 1 || nodeContainsSelected(node, selectedId));
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = String(selectedId) === String(node._id);

  useEffect(() => {
    if (nodeContainsSelected(node, selectedId)) setExpanded(true);
  }, [node, selectedId]);

  const currentPathStr = [...pathStr, node.slug];
  const currentNodePath = [...nodePath, node];

  return (
    <div className="select-none">
      <div
        className={`flex cursor-pointer items-center gap-2 rounded-lg py-1.5 px-2 transition-colors hover:bg-white/5 ${
          isSelected ? 'bg-[#D4AF37]/10' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => {
          if (hasChildren) {
            setExpanded(!expanded);
          } else {
            onSelect(node._id, currentPathStr.join('/'), currentNodePath);
          }
        }}
      >
        <div className="flex h-4 w-4 items-center justify-center text-white/40">
          {hasChildren && (expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)}
        </div>
        <span className={`text-sm ${isSelected ? 'font-bold text-[#D4AF37]' : 'text-white/80'}`}>{node.name}</span>
      </div>

      {expanded && hasChildren && (
        <div className="mt-1 space-y-1 border-l border-white/5" style={{ marginLeft: `${level * 16 + 12}px` }}>
          {node.children.map((child, index) => (
            <CategoryNode
              key={`${child._id}-${level}-${index}`}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              pathStr={currentPathStr}
              nodePath={currentNodePath}
            />
          ))}
        </div>
      )}
    </div>
  );
};
