import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { Loader2, ArrowLeft } from "lucide-react";
import { EmptyState } from "@/components/admin-components/_shared/EmptyState";
import { API_V1_URL as API_BASE } from "@/lib/api";

import usePageMeta from "@/hooks/use-page-meta";

const DropDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [drop, setDrop] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDrop = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE}/drops/get-single-drop/${slug}`);
        if (res.data?.success && res.data?.drop) {
          setDrop(res.data.drop);
          setProducts(res.data.products || []);
        } else {
          setError("Drop not found");
        }
      } catch (err) {
        console.error("Failed to fetch drop details:", err);
        setError("Failed to load drop details or the drop does not exist.");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) fetchDrop();
  }, [slug]);

  usePageMeta({ title: drop ? `${drop.name} Drop` : "Drop" });

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !drop) {
    return (
      <div className="flex flex-col h-[80vh] w-full items-center justify-center bg-background text-on-surface">
        <h2 className="text-3xl font-serif text-primary mb-4">Error</h2>
        <p className="text-outline mb-8">{error || "Drop not found"}</p>
        <button
          onClick={() => navigate("/shopping/home")}
          className="border border-outline/30 px-8 py-3 font-sans uppercase tracking-widest text-xs hover:bg-primary hover:text-on-primary transition-all duration-300"
        >
          Return Home
        </button>
      </div>
    );
  }

  const heroSrc = drop.images?.[0]?.url || "/LOGO.png"; // Fallback to logo if no image

  const getProductLabel = (product) => {
    if (product.isLimited) return "Limited 1 of 50";
    return "Limited Release";
  };

  const isExpired = drop.endDate && new Date(drop.endDate) < new Date();

  return (
    <div className="bg-background text-on-surface min-h-screen relative w-full overflow-hidden">
      <div className="grain"></div>

      {/* Hero Section */}
      <section className="relative h-[60vh] w-full flex items-center justify-center overflow-hidden border-b border-outline-variant/10">
        <div className="absolute inset-0 z-0">
          <motion.img
            src={heroSrc}
            alt={drop.name}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.6, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/40 to-transparent pointer-events-none" />
        </div>
        <div className="relative z-10 text-center px-6 max-w-4xl mt-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-serif text-5xl md:text-7xl text-primary font-bold mb-4 tracking-tighter"
          >
            {drop.name}
          </motion.h1>
          {drop.description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-sans text-on-surface-variant max-w-2xl mx-auto mb-6 leading-relaxed"
            >
              {drop.description}
            </motion.p>
          )}
          {isExpired && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-block bg-red-900/30 text-red-500 border border-red-500/20 px-4 py-2 uppercase tracking-widest text-xs font-bold"
            >
              Drop Ended
            </motion.div>
          )}
        </div>
      </section>

      {/* Action Bar */}
      <div className="bg-surface-container-lowest py-6 border-b border-outline-variant/10 px-8 md:px-12 flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary font-sans uppercase tracking-widest text-xs hover:text-on-surface transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="font-sans text-xs tracking-widest text-outline uppercase">
          {products.length} {products.length === 1 ? "Article" : "Articles"}
        </div>
      </div>

      {/* Products Grid */}
      <section className="py-24 px-8 md:px-12 max-w-[1400px] mx-auto">
        {products.length === 0 ? (
          <EmptyState
            title="No products available"
            subtitle="This drop currently has no products. Check back soon or browse the atelier."
            action={
              <Link to="/shopping/product-list" className="inline-flex">
                <button className="inline-flex rounded-md bg-[#D4AF37] px-4 py-2 text-black font-semibold">Browse products</button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <Link to={`/shopping/product/${product.slug}`} key={product._id} className="group cursor-pointer">
                <div className="relative bg-surface-container-low aspect-[3/4] mb-6 overflow-hidden">
                  <img
                    src={product.images?.[0]?.url || "/LOGO.png"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1">
                    <span className="font-sans text-[10px] tracking-widest text-primary uppercase">
                      {getProductLabel(product)}
                    </span>
                  </div>
                  {product.totalStock <= 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                      <span className="font-sans text-sm tracking-widest text-red-500 uppercase border border-red-500/30 px-6 py-2 bg-black/50">Sold Out</span>
                    </div>
                  )}
                </div>
                <h4 className="font-sans text-xs uppercase tracking-widest text-on-surface mb-1 group-hover:text-primary transition-colors">
                  {product.name}
                </h4>
                <p className="font-serif text-outline text-sm">${product.basePrice}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DropDetails;
