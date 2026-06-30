import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";
import ProductCard from "@/components/shopping-components/ProductCard";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { addToCartAction, removeFromWishlistAction } from "@/store/cart-slice";
import { toast } from "@/hooks/use-toast";
import { Heart } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

const Wishlist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wishlistItems = useSelector((state) => state.cart.wishlist?.items ?? []);

  const handleRemove = (id) => {
    dispatch(removeFromWishlistAction(id))
      .unwrap()
      .then(() => toast({ title: "Removed from Wishlist" }))
      .catch(() => toast({ title: "Removed from Wishlist" }));
  };

  const handleAddToCart = (item) => {
    dispatch(addToCartAction({ productId: item.id, quantity: 1 }))
      .unwrap()
      .then(() => toast({ title: "Added to cart", description: `${item.name} added successfully.`, variant: "success" }))
      .catch(() => {
        toast({ title: "Please select details", description: "Redirecting to product page to choose variants.", variant: "destructive" });
        navigate(`/shopping/product/${item.slug}`);
      });
  };

  const [recommendedProducts, setRecommendedProducts] = useState([]);
  useEffect(() => {
    axios.get(`${API_BASE}/products/get-all-products?limit=4&sort=-createdAt`)
      .then(res => setRecommendedProducts(res.data?.data || []))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-8 pb-12 font-sans">
      
      {/* ── HEADER & SUMMARY ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
         <div>
            <h1 className="font-sans text-2xl font-bold text-[#fafafa] mb-1">My Wishlist</h1>
            <p className="se-body text-[14px] text-[#99907c]">Save your favorite products and purchase them whenever you're ready.</p>
         </div>
         
         <div className="flex items-center gap-4 bg-[#1A1A1A] border border-white/5 px-4 py-2 rounded-full">
            <span className="text-[14px] font-sans font-bold text-[#F2CA50]">{wishlistItems.length}</span>
            <span className="text-[10px] uppercase tracking-widest text-[#99907c]">Saved</span>
            <div className="w-[1px] h-4 bg-white/10" />
            <span className="text-[14px] font-sans font-bold text-white">{wishlistItems.filter(item => (item.totalStock ?? 1) > 0).length}</span>
            <span className="text-[10px] uppercase tracking-widest text-[#99907c]">Available</span>
         </div>
      </div>

      {/* ── WISHLIST ITEMS ── */}
      {wishlistItems.length === 0 ? (
        <EmptyState 
          iconType="heart" 
          title="Your wishlist is empty" 
          description="Discover the latest luxury collections and save your favorites here." 
          actionLabel="Start Exploring"
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {wishlistItems.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              handleGetProductDetails={() => navigate(`/shopping/product/${item.slug}`)}
              handleAddtoCart={() => handleAddToCart(item)}
              showRemoveFromWishlist={true}
              onRemoveFromWishlist={() => handleRemove(item.id)}
            />
          ))}
        </div>
      )}

      {/* ── RECOMMENDED ── */}
      {recommendedProducts.length > 0 && (
        <div className="mt-16 pt-12 border-t border-white/5">
           <h2 className="font-sans font-bold text-xl text-[#fafafa] mb-8">Recommended For You</h2>
           <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {recommendedProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  handleGetProductDetails={() => navigate(`/shopping/product/${product.slug}`)}
                  handleAddtoCart={() => {
                     dispatch(addToCartAction({ productId: product._id, quantity: 1 }))
                       .unwrap()
                       .then(() => toast({ title: "Added to cart", variant: "success" }))
                       .catch(() => navigate(`/shopping/product/${product.slug}`));
                  }}
                />
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
