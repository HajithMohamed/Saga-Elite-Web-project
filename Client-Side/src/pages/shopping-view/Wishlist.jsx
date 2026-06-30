import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";
import ProductCard from "@/components/shopping-components/ProductCard";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { addToCartAction, removeFromWishlistAction } from "@/store/cart-slice";
import { toast } from "@/hooks/use-toast";
import { Trash2, Loader2, ShoppingBag, ArrowRight, Heart } from "lucide-react";

const Wishlist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wishlistItems = useSelector((state) => state.cart.wishlist?.items ?? []);

  const handleRemove = (id) => {
    dispatch(removeFromWishlistAction(id))
      .unwrap()
      .then(() => {
        toast({ title: "Removed from Wishlist" });
      })
      .catch(() => {
        toast({ title: "Removed from Wishlist" });
      });
  };

  const handleAddToCart = (item) => {
    dispatch(
      addToCartAction({
        productId: item.id,
        quantity: 1,
      })
    )
      .unwrap()
      .then(() => {
        toast({
          title: "Added to cart",
          description: `${item.name} added successfully.`,
          variant: "success",
        });
      })
      .catch(() => {
        toast({
          title: "Please select details",
          description: "Redirecting to product page to choose variants.",
          variant: "destructive",
        });
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
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e2e1] pt-24 pb-32">
      {/* 1. Breadcrumb */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 mb-6">
        <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-[11px] uppercase tracking-widest text-[#99907c]">
          <Link to="/" className="hover:text-[#f2ca50] transition-colors">Home</Link>
          <span className="text-[#4d4635]">{'>'}</span>
          <span className="text-[#f2ca50] font-bold">My Wishlist</span>
        </div>
      </div>

      {/* 2. Page Hero */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 mb-8">
        <div className="h-[160px] md:h-[180px] lg:h-[220px] bg-[#131313] rounded-3xl border border-[#1c1b1b] flex flex-col justify-center px-6 md:px-12 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <h1 className="font-sans text-3xl md:text-5xl font-bold tracking-tight text-white relative z-10">
            My Wishlist
          </h1>
          <p className="mt-3 text-sm md:text-base text-[#d0c5af] relative z-10">
            Save your favorite products and purchase them whenever you're ready.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-[#4d4635] w-max relative z-10">
            <span className="text-xs uppercase tracking-widest text-[#f2ca50] font-bold">
              {wishlistItems.length} {wishlistItems.length === 1 ? "Saved Product" : "Saved Products"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Wishlist Summary */}
      {wishlistItems.length > 0 && (
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 mb-12">
          <div className="flex flex-wrap items-center gap-4 md:gap-8 border-y border-[#4d4635]/40 py-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-sans font-bold text-[#f2ca50]">{wishlistItems.length}</span>
              <span className="text-[10px] uppercase tracking-widest text-[#99907c]">Saved</span>
            </div>
            <div className="w-[1px] h-6 bg-[#4d4635]/40 hidden md:block"></div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-sans font-bold text-white">
                {wishlistItems.filter(item => (item.totalStock ?? 1) > 0).length}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#99907c]">Available</span>
            </div>
            <div className="w-[1px] h-6 bg-[#4d4635]/40 hidden md:block"></div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-sans font-bold text-red-400">
                {wishlistItems.filter(item => (item.totalStock ?? 1) === 0).length}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#99907c]">Out of Stock</span>
            </div>
            <div className="w-[1px] h-6 bg-[#4d4635]/40 hidden md:block"></div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-sans font-bold text-green-400">
                {wishlistItems.filter(item => (item.discountPercent || 0) > 0).length}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#99907c]">Price Drops</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        {wishlistItems && wishlistItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {wishlistItems.map((item) => {
              const price = item.basePrice * (1 - (item.discountPercent || 0) / 100);
              const isOutOfStock = (item.totalStock ?? 1) === 0;

              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col bg-[#131313] border border-[#1c1b1b] rounded-2xl overflow-hidden hover:border-[#4d4635] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(242,202,80,0.05)] transition-all duration-500"
                >
                  {/* Image */}
                  <Link to={`/shopping/product/${item.slug}`} className="relative aspect-square w-full bg-black block overflow-hidden">
                    <img
                      src={item.image || "/placeholder.jpg"}
                      className="h-full w-full object-contain p-2 transition-transform duration-700 group-hover:scale-105"
                      alt={item.name}
                    />
                    
                    {/* Badges */}
                    {item.discountPercent > 0 && (
                      <div className="absolute top-3 left-3 bg-[#f2ca50] text-[#0a0a0a] px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest">
                        Save {item.discountPercent}%
                      </div>
                    )}

                    {/* Stock Status */}
                    <div className="absolute bottom-3 left-3 right-3">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center w-full justify-center gap-1.5 px-3 py-1.5 rounded bg-black/80 backdrop-blur-md text-[10px] uppercase tracking-widest text-red-400 font-bold border border-red-500/20">
                          ✖ Out of Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center w-max gap-1.5 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md text-[10px] uppercase tracking-widest text-green-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          ✔ In Stock
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex flex-col flex-1 p-4 md:p-5">
                    <div className="text-[9px] tracking-[0.25em] text-[#99907c] uppercase mb-1 truncate">
                      {item.brand?.name || "Saga Elite"} · {item.category || "Apparel"}
                    </div>
                    <Link to={`/shopping/product/${item.slug}`}>
                      <h3 className="font-sans font-bold text-sm md:text-base text-[#e5e2e1] line-clamp-2 hover:text-[#f2ca50] transition-colors mb-2">
                        {item.name}
                      </h3>
                    </Link>

                    {/* Pricing */}
                    <div className="mt-auto pt-2 flex flex-col">
                      <div className="flex items-end gap-2">
                        <span className="text-[#f2ca50] font-sans font-bold text-lg">
                          LKR {price.toLocaleString()}
                        </span>
                        {item.discountPercent > 0 && item.basePrice && (
                          <span className="text-[#99907c] text-xs line-through pb-0.5">
                            LKR {item.basePrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {item.discountPercent > 0 && item.basePrice && (
                        <span className="text-[10px] text-green-400 uppercase tracking-widest font-bold mt-1">
                          Price Dropped by LKR {(item.basePrice - price).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                      <button
                        onClick={(e) => { e.preventDefault(); handleAddToCart(item); }}
                        disabled={isOutOfStock}
                        className="h-10 bg-[#f2ca50] text-[#0a0a0a] rounded-xl font-bold uppercase tracking-widest text-[10px] hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag size={14} /> Move to Cart
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); handleRemove(item.id); }}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-transparent border border-[#4d4635] text-[#99907c] hover:border-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="relative w-full h-[60vh] min-h-[400px] flex items-center justify-center rounded-3xl border border-[#1c1b1b] bg-[#131313] overflow-hidden">
            <div className="absolute inset-0 bg-black/60 z-[1] pointer-events-none" />
            <div className="relative z-10 text-center max-w-md px-4 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-[#0a0a0a] border border-[#2a2a2a] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(242,202,80,0.1)]">
                <Heart className="w-8 h-8 text-[#f2ca50]" />
              </div>
              <h2 className="text-3xl font-sans font-bold text-white mb-3">Your Wishlist is Empty</h2>
              <p className="text-[#99907c] text-sm leading-relaxed mb-8">
                Save your favorite products to purchase them later. Discover premium collections tailored just for you.
              </p>
              <div className="flex flex-col w-full gap-3">
                <Link to="/shopping/product-list" className="w-full h-12 flex items-center justify-center bg-[#f2ca50] text-black rounded-xl font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all">
                  Browse Products
                </Link>
                <Link to="/" className="w-full h-12 flex items-center justify-center bg-transparent border border-[#4d4635] text-[#d0c5af] rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-all">
                  View New Arrivals
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* RELATED PRODUCTS */}
        <div className="mt-32 border-t border-[#4d4635]/40 pt-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#f2ca50] font-bold">Because You Saved These</span>
              <h2 className="text-[32px] font-sans font-bold text-white mt-2">Recommended For You</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {recommendedProducts && recommendedProducts.length > 0 ? (
              recommendedProducts.slice(0, 4).map(product => (
                <ProductCard key={product._id || product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full h-40 flex items-center justify-center border border-[#1c1b1b] rounded-2xl bg-[#131313]">
                <Loader2 className="animate-spin text-[#99907c]" />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Wishlist;
