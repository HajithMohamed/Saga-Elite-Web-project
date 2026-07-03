import React from "react";
import { Link } from "react-router-dom";
import { Package, Search, Heart, ShoppingBag, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";

const iconMap = {
  package: Package,
  search: Search,
  heart: Heart,
  cart: ShoppingBag,
  folder: FolderOpen
};

const EmptyState = ({ 
  iconType = "package", 
  title = "No Items Found", 
  description = "There are currently no items to display here.", 
  actionLabel = "Continue Shopping", 
  actionTo = "/shopping/product-list" 
}) => {
  const Icon = iconMap[iconType] || Package;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col items-center justify-center p-12 lg:p-24 bg-[#1A1A1A] border border-white/5 rounded-[24px] text-center"
    >
      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-[#99907c]">
        <Icon className="w-10 h-10" />
      </div>
      
      <h2 className="se-serif text-2xl lg:text-3xl text-[#fafafa] mb-3">{title}</h2>
      
      <p className="se-body text-[15px] text-[#99907c] max-w-md mx-auto mb-8">
        {description}
      </p>
      
      {actionLabel && actionTo && (
        <Link 
          to={actionTo}
          className="se-btn se-btn-primary"
        >
          {actionLabel}
        </Link>
      )}
    </motion.div>
  );
};

export default EmptyState;
