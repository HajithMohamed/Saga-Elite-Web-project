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
    <div className="rounded-2xl border border-ink/[0.08] bg-ink/[0.02] p-6 backdrop-blur-md">
      <h2 className="mb-6 text-lg font-semibold text-ink">Category & Tags</h2>

      <div className="grid gap-6">
        <div className="space-y-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink/50">Category Assignment</label>
          {pathDisplay && (
            <div className="rounded-lg border border-gold-ink2/20 bg-gold-deep/5 px-3 py-2 text-xs text-gold-ink2">
              Selected: {pathDisplay}
            </div>
          )}
          {validationErrors.category && (
            <p className="text-sm text-rose-400">{validationErrors.category}</p>
          )}
          <div
            className="rounded-xl border border-ink/10 bg-black/40 p-4 max-h-[400px] overflow-y-auto"
            data-lenis-prevent="true"
          >
            <p className="mb-3 text-xs text-ink/40">Select the primary category for this product.</p>
            {categoryTree.length === 0 ? (
              <div className="text-sm text-ink/30">Loading categories...</div>
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
          <label className="text-xs font-semibold uppercase tracking-wider text-ink/50">Quick Tags</label>
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
                      ? 'border-gold-ink2/40 bg-gold-deep/15 text-gold-ink2'
                      : 'border-ink/10 bg-ink/5 text-ink/50 hover:border-ink/20 hover:text-ink'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink/50">Product Tags</label>
          <div className="flex flex-wrap gap-2 rounded-xl border border-ink/10 bg-black/40 p-3">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-lg bg-ink/10 px-2.5 py-1 text-xs font-bold text-ink"
              >
                <Hash className="h-3 w-3 text-gold-ink2" />
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-ink/50 hover:text-ink">
                  &times;
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="min-w-[120px] flex-1 bg-transparent px-2 text-sm text-ink placeholder-ink/30 outline-none"
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
        className={`flex cursor-pointer items-center gap-2 rounded-lg py-1.5 px-2 transition-colors hover:bg-ink/5 ${
          isSelected ? 'bg-gold-deep/10' : ''
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
        <div className="flex h-4 w-4 items-center justify-center text-ink/40">
          {hasChildren && (expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)}
        </div>
        <span className={`text-sm ${isSelected ? 'font-bold text-gold-ink2' : 'text-ink/80'}`}>{node.name}</span>
      </div>

      {expanded && hasChildren && (
        <div className="mt-1 space-y-1 border-l border-ink/5" style={{ marginLeft: `${level * 16 + 12}px` }}>
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
