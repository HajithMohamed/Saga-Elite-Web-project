import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { addToCartAction, removeFromWishlistAction } from "@/store/cart-slice";
import { toast } from "@/hooks/use-toast";
import { Trash2, ShoppingBag, ArrowRight, Heart } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-[#060606] text-white py-10">
      <div className="container mx-auto px-4 md:px-8">

        {/* Header */}
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-widest">
              My Wishlist
            </h1>
            <p className="mt-2 text-sm text-gray-400 max-w-2xl">
              Your favorite items, saved for later.
            </p>
          </div>
        </div>

        {wishlistItems && wishlistItems.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {wishlistItems.map((item) => {
              const price =
                item.basePrice *
                (1 - (item.discountPercent || 0) / 100);

              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col gap-3"
                >
                  {/* Image Container */}
                  <Link to={`/shopping/product/${item.slug}`} className="relative aspect-[4/5] overflow-hidden bg-[#131313] block rounded-[1rem] border border-[#1c1b1b] transition-all duration-500 group-hover:border-[#333] group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.8)]">
                    <img
                      src={item.image || "/placeholder.jpg"}
                      className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02] group-hover:brightness-90"
                      alt={item.name}
                    />

                    {/* Remove Button */}
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(item.id); }}
                      className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#0a0a0a]/80 backdrop-blur-md transition hover:bg-red-500 hover:text-white border border-[#4d4635] text-[#d0c5af] hover:border-red-500 z-10"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    {/* Add to Cart button (Quick Action) */}
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(item); }}
                      className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37] text-black shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] transition hover:bg-[#F2CA50] hover:scale-110 z-10"
                    >
                      <ShoppingBag size={18} />
                    </button>
                  </Link>

                  {/* Metadata */}
                  <Link to={`/shopping/product/${item.slug}`} className="block transition-colors p-2 rounded-sm mt-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-[#e5e2e1] se-body max-w-[70%] leading-tight font-medium line-clamp-2">
                        {item.name}
                      </h3>
                      <div className="flex flex-col items-end shrink-0 pl-2">
                        <p className="text-[#D4AF37] se-instrument text-right tabular-nums font-semibold">
                          LKR {price.toLocaleString()}
                        </p>
                        {item.discountPercent > 0 && item.basePrice && (
                          <span className="se-instrument text-[10px] text-gray-500 line-through tabular-nums text-right mt-0.5">
                            LKR {item.basePrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-gray-800 bg-[#111] p-16 text-center flex flex-col items-center gap-4">
            <Heart className="h-16 w-16 text-gray-600 mb-2" />
            <h2 className="text-2xl font-semibold text-white">
              Your wishlist is empty
            </h2>
            <p className="max-w-md text-gray-400">
              Looks like you haven't added anything yet.
            </p>
            <Link
              to="/shopping/product-list"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-8 py-3 text-sm font-bold uppercase text-black hover:bg-[#F2CA50]"
            >
              Explore Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;