import React, { useState } from 'react';
import { useProductForm } from './ProductFormContext';
import { ChevronDown, ChevronRight, Hash } from 'lucide-react';

export const CategorySEOSection = ({ categoryTree = [] }) => {
  const { formData, updateField } = useProductForm();
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toUpperCase();
      if (!formData.tags.includes(newTag)) {
        updateField('tags', [...formData.tags, newTag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    updateField('tags', formData.tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-md">
      <h2 className="mb-6 text-lg font-semibold text-white">Organization & SEO</h2>
      
      <div className="grid gap-6">
        <div className="space-y-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Category Assignment</label>
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <p className="mb-3 text-xs text-white/40">Select the primary category for this product.</p>
            {categoryTree.length === 0 ? (
              <div className="text-sm text-white/30">Loading categories...</div>
            ) : (
              <div className="space-y-2">
                {categoryTree.map(category => (
                  <CategoryNode 
                    key={category._id} 
                    node={category} 
                    selectedId={formData.categoryId}
                    onSelect={(id, pathStr, nodePath) => {
                      const rootNode = nodePath[0];
                      const firstSub = nodePath[1];
                      const leafNode = nodePath[nodePath.length - 1];
                      
                      updateField('categoryId', leafNode._id);
                      updateField('categoryPath', pathStr);
                      updateField('category', rootNode.name);
                      updateField('subCategory', firstSub ? firstSub.name : "");
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Product Tags</label>
          <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/40 p-3">
            {formData.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-white">
                <Hash className="h-3 w-3 text-[#D4AF37]" />
                {tag}
                <button 
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-white/50 hover:text-white"
                >
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

const CategoryNode = ({ node, level = 0, selectedId, onSelect, pathStr = [], nodePath = [] }) => {
  const [expanded, setExpanded] = useState(level < 1);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node._id;
  
  const currentPathStr = [...pathStr, node.slug];
  const currentNodePath = [...nodePath, node];

  return (
    <div className="select-none">
      <div 
        className={`flex cursor-pointer items-center gap-2 rounded-lg py-1.5 px-2 transition-colors hover:bg-white/5 ${isSelected ? 'bg-[#D4AF37]/10' : ''}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => {
          if (hasChildren) {
            setExpanded(!expanded);
            // Optionally allow selecting non-leaf nodes
            // onSelect(node._id, currentPathStr.join('/'), currentNodePath);
          } else {
            onSelect(node._id, currentPathStr.join('/'), currentNodePath);
          }
        }}
      >
        <div className="flex h-4 w-4 items-center justify-center text-white/40">
          {hasChildren && (
            expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
          )}
        </div>
        <span className={`text-sm ${isSelected ? 'font-bold text-[#D4AF37]' : 'text-white/80'}`}>
          {node.name}
        </span>
      </div>
      
      {expanded && hasChildren && (
        <div className="mt-1 space-y-1">
          {node.children.map(child => (
            <CategoryNode 
              key={child._id} 
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
