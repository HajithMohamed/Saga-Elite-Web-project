import React from 'react';
import { ProductFormProvider, useProductForm } from './ProductFormContext';
import { StickyHeader } from './StickyHeader';
import { WorkspaceNav } from './WorkspaceNav';
import { WorkspaceLeft } from './WorkspaceLeft';
import { WorkspaceRight } from './WorkspaceRight';
import { motion } from 'framer-motion';
import useUnsavedChanges from '@/hooks/use-unsaved-changes';

export const ProductStudio = ({
  initialData,
  initialImages = [],
  isDraftMode = false,
  categoryTree,
  drops,
  productId = null,
  productSlug = null,
  isEditing = false,
  onBack,
  onSaveDraft,
  onSubmit,
  onOpenGallery,
}) => {
  return (
    <ProductFormProvider initialData={initialData} initialImages={initialImages} isDraftMode={isDraftMode}>
      <ProductStudioContent
        categoryTree={categoryTree}
        drops={drops}
        productId={productId}
        productSlug={productSlug}
        isEditing={isEditing}
        onBack={onBack}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
        onOpenGallery={onOpenGallery}
      />
    </ProductFormProvider>
  );
};

const ProductStudioContent = ({
  categoryTree,
  drops,
  productId,
  productSlug,
  isEditing,
  onBack,
  onSaveDraft,
  onSubmit,
  onOpenGallery,
}) => {
  const { formData, images, setIsSaving, setValidationErrors, isDirty, isSaving } = useProductForm();
  const [activeTab, setActiveTab] = React.useState('basic-info');

  // Warn on tab close / refresh while the form has unsaved edits.
  useUnsavedChanges(isDirty && !isSaving);

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      await onSubmit(formData, images, setValidationErrors);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="fixed inset-0 z-[100] bg-[#0a0a0a] overflow-x-hidden overflow-y-auto"
    >
      <StickyHeader
        onBack={onBack}
        onSaveDraft={() => onSaveDraft(formData, images)}
        onPublish={handlePublish}
        isEditing={isEditing}
        productSlug={productSlug}
      />

      <div className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="grid items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)_320px] xl:grid-cols-[240px_minmax(0,1fr)_360px]">
          <WorkspaceNav activeTab={activeTab} onTabChange={setActiveTab} />
          <WorkspaceLeft
            categoryTree={categoryTree}
            drops={drops}
            activeTab={activeTab}
            onOpenGallery={onOpenGallery}
            isEditing={isEditing}
          />
          <WorkspaceRight productId={productId} productSlug={productSlug} isEditing={isEditing} />
        </div>
      </div>
    </motion.div>
  );
};
