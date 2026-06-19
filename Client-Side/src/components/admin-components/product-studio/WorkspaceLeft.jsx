import React from 'react';
import { OverviewSection } from './OverviewSection';
import { MediaStudio } from './MediaStudio';
import { VariantStudio } from './VariantStudio';
import { PricingInventorySection } from './PricingInventorySection';
import { CategorySEOSection } from './CategorySEOSection';

export const WorkspaceLeft = ({ categoryTree, drops, activeTab, onOpenGallery, isEditing }) => {
  return (
    <div className="pb-32">
      {activeTab === 'basic-info' && <OverviewSection drops={drops} />}
      {activeTab === 'media' && (
        <MediaStudio onOpenGallery={onOpenGallery} isEditing={isEditing} />
      )}
      {activeTab === 'variants' && <VariantStudio />}
      {activeTab === 'pricing' && <PricingInventorySection />}
      {(activeTab === 'category' || activeTab === 'tags') && (
        <CategorySEOSection categoryTree={categoryTree} />
      )}
    </div>
  );
};
