import React from 'react';
import { ProductFormProvider, useProductForm } from './ProductFormContext';
import { StickyHeader } from './StickyHeader';
import { WorkspaceLeft } from './WorkspaceLeft';
import { WorkspaceRight } from './WorkspaceRight';
import { motion } from 'framer-motion';

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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="fixed inset-0 z-[100] bg-[#0a0a0a] overflow-x-hidden overflow-y-auto"
    >
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
    </motion.div>
  );
};
