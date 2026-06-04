import React from 'react';
import { ProductFormProvider, useProductForm } from './ProductFormContext';
import { StickyHeader } from './StickyHeader';
import { WorkspaceLeft } from './WorkspaceLeft';
import { WorkspaceRight } from './WorkspaceRight';

export const ProductStudio = ({ 
  initialData, 
  initialImages = [],
  isDraftMode = false,
  categoryTree, 
  drops,
  onBack, 
  onSaveDraft, 
  onSubmit 
}) => {
  return (
    <ProductFormProvider initialData={initialData} initialImages={initialImages} isDraftMode={isDraftMode}>
      <ProductStudioContent 
        categoryTree={categoryTree} 
        drops={drops}
        onBack={onBack} 
        onSaveDraft={onSaveDraft} 
        onSubmit={onSubmit} 
      />
    </ProductFormProvider>
  );
};

const ProductStudioContent = ({ categoryTree, drops, onBack, onSaveDraft, onSubmit }) => {
  const { formData, images, setIsSaving } = useProductForm();
  
  const handlePublish = async () => {
    setIsSaving(true);
    try {
      await onSubmit(formData, images);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a]">
      <StickyHeader 
        onBack={onBack}
        onSaveDraft={onSaveDraft}
        onPublish={handlePublish}
      />
      
      <div className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px]">
          <WorkspaceLeft categoryTree={categoryTree} drops={drops} />
          <WorkspaceRight />
        </div>
      </div>
    </div>
  );
};
