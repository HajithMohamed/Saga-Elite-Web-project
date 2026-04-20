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
        // Fallback or optimistic UI
        toast({ title: "Removed from Wishlist" });
      });
  };

  const handleAddToCart = (item) => {
    // If the product requires a variant and none is specified, the backend might fail it.
    // In that case, we redirect the user to the details page.
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
              const price = item.basePrice * (1 - (item.discountPercent || 0) / 100);

              return (
                <div
                  key={item.id}
                  className="group relative rounded-[2rem] border border-white/5 bg-gradient-to-b from-[#0a0a0a] to-[#040404] p-5 overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[#D4AF37]/5 flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden rounded-2xl bg-[#000]">
                    <img
                      src={item.image || "/placeholder.jpg"}
                      className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                      alt={item.name}
                    />
                    
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-md transition-colors hover:bg-red-500/20 group/btn"
                      title="Remove from Wishlist"
                    >
                      <Trash2 className="h-5 w-5 text-red-500 transition-colors group-hover/btn:scale-110" />
                    </button>
                    
                    <Link
                      to={`/shopping/product/${item.slug}`}
                      className="absolute bottom-4 left-4 z-10 flex h-8 items-center gap-1 rounded-full bg-black/60 px-4 text-xs font-semibold uppercase tracking-wider backdrop-blur-md transition-colors hover:bg-[#D4AF37] hover:text-black"
                    >
                      Details <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="pt-6 space-y-4 flex flex-col flex-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <p className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest">
                          {item.category || item.brand}
                        </p>
                      </div>
                      <h2 className="mt-2 text-xl font-medium tracking-wide">
                        {item.name}
                      </h2>
                    </div>

                    <div className="pt-2 flex flex-col gap-3 mt-auto">
                      <div className="text-2xl font-semibold tracking-wide flex items-center gap-2">
                        <span>LKR {price.toLocaleString()}</span>
                        {item.discountPercent > 0 && (
                          <span className="text-sm text-gray-500 line-through">
                            LKR {item.basePrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="flex-1 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#F2CA50] flex items-center justify-center gap-2"
                        >
                          <ShoppingBag className="h-4 w-4" />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-gray-800 bg-[#111] p-16 text-center flex flex-col items-center gap-4">
            <Heart className="h-16 w-16 text-gray-600 mb-2" />
            <h2 className="text-2xl font-semibold text-white">Your wishlist is empty</h2>
            <p className="max-w-md mx-auto text-gray-400">
              Looks like you haven't added anything to your wishlist yet. Explore our dropped collections and save your favorites!
            </p>
            <Link
              to="/shopping/product-list"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-8 py-3 text-sm font-bold uppercase text-black tracking-widest hover:bg-[#F2CA50] transition-colors"
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
