import React, { useState } from 'react';
import { Layers, Image as ImageIcon, Box, DollarSign, FolderTree, Tag } from 'lucide-react';

export const WorkspaceNav = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'basic-info', label: 'Basic Info', icon: Layers },
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'variants', label: 'Variants', icon: Box },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'category', label: 'Category & SEO', icon: FolderTree },
    // Tags is inside CategorySEOSection in the current implementation, but the image has "Tags & Attributes"
    // We can just scroll to the same section for now
    { id: 'tags', label: 'Tags & Attributes', icon: Tag }, 
  ];

  const handleTabSelect = (id) => {
    onTabChange(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="sticky top-24 space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleTabSelect(item.id)}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
              isActive 
                ? 'bg-[#111111] text-[#D4AF37] border border-white/5' 
                : 'text-white/50 hover:bg-white/[0.02] hover:text-white'
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? 'text-[#D4AF37]' : 'text-white/40'}`} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
