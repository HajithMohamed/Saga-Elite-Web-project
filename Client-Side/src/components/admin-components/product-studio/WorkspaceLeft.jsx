import React from 'react';
import { OverviewSection } from './OverviewSection';
import { MediaStudio } from './MediaStudio';
import { VariantStudio } from './VariantStudio';
import { PricingInventorySection } from './PricingInventorySection';
import { CategorySEOSection } from './CategorySEOSection';

export const WorkspaceLeft = ({ categoryTree, drops }) => {
  return (
    <div className="space-y-8 pb-32">
      <OverviewSection drops={drops} />
      <MediaStudio />
      <VariantStudio />
      <PricingInventorySection />
      <CategorySEOSection categoryTree={categoryTree} />
    </div>
  );
};
