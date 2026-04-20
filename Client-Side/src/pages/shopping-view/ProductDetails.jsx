import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCartAction, addToWishlistAction, removeFromWishlistAction } from "@/store/cart-slice";
import { toast } from "@/hooks/use-toast";
import { Heart, Loader2, ArrowLeft, ShieldCheck, Truck, RefreshCcw } from "lucide-react";

const API_BASE = `${import.meta.env.VITE_API_URL}/v1`;

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const wishlistItems = useSelector((state) => state.cart.wishlist?.items ?? []);
  const cartItems = useSelector((state) => state.cart.cart.items);

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariantSku, setSelectedVariantSku] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showBuyNowModal, setShowBuyNowModal] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const { data } = await axios.get(`${API_BASE}/products/get-single-product/${slug}`);
        setProduct(data.product);
        if (data.product?.variants?.length > 0) {
          setSelectedVariantSku(data.product.variants[0].sku);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load product");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#060606] flex flex-col items-center justify-center text-white">
        <p className="text-xl text-red-500 mb-6">{error || "Product not found"}</p>
        <Link to="/shopping/product-list" className="bg-white/10 px-6 py-3 rounded-full hover:bg-white/20">
          Back to Shop
        </Link>
      </div>
    );
  }

  const selectedVariant = product.variants.find(v => v.sku === selectedVariantSku);
  const basePrice = product.basePrice + (selectedVariant?.priceAdjustment || 0);
  const price = basePrice * (1 - (product.discountPercent || 0) / 100);
  const inWishlist = wishlistItems.some(i => i.id === product._id);

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    dispatch(addToCartAction({ productId: product._id, variantId: selectedVariant._id, quantity }))
      .unwrap()
      .then(() => toast({ title: "In the bag", description: `${product.name} added.`, variant: "success" }))
      .catch(err => toast({ title: "Error", description: err, variant: "destructive" }));
  };

  const handleBuyNow = () => {
    const selectedVariant = product.variants.find(v => v.sku === selectedVariantSku);
    if (!selectedVariant) return;

    const isInCart = cartItems.some(item => 
      item.product.id === product._id && item.variant.sku === selectedVariant.sku
    );

    if (isInCart) {
      setShowBuyNowModal(true);
    } else {
      navigate("/shopping/checkout", { state: { buyNowItem: { product, variant: selectedVariant, quantity } } });
    }
  };

  const handleViewCartSummary = () => {
    setShowBuyNowModal(false);
    navigate("/shopping/cart");
  };

  const handleProceedWithItem = () => {
    setShowBuyNowModal(false);
    const selectedVariant = product.variants.find(v => v.sku === selectedVariantSku);
    navigate("/shopping/checkout", { state: { buyNowItem: { product, variant: selectedVariant, quantity } } });
  };

  const toggleWishlist = () => {
    if (inWishlist) {
      dispatch(removeFromWishlistAction(product._id));
      toast({ title: "Removed from Wishlist" });
    } else {
      dispatch(addToWishlistAction({ productId: product._id }));
      toast({ title: "Saved to Wishlist", variant: "success" });
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] text-white pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white uppercase tracking-widest mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Images */}
          <div className="flex flex-col-reverse lg:flex-row gap-4 lg:gap-6 lg:h-[70vh]">
            <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto no-scrollbar pb-2 lg:pb-0 lg:w-24 shrink-0">
              {product.images?.map((img, i) => (
                <button
                  key={img._id}
                  onClick={() => setActiveImageIndex(i)}
                  className={`relative shrink-0 rounded-xl overflow-hidden border-2 w-20 lg:w-24 aspect-[4/5] ${activeImageIndex === i ? 'border-[#D4AF37]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                >
                  <img src={img.url} alt={`View ${i+1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="flex-1 relative rounded-[2rem] overflow-hidden bg-[#111] aspect-[4/5] lg:aspect-auto">
              <img src={product.images?.[activeImageIndex]?.url || "/placeholder.jpg"} className="w-full h-full object-cover" alt={product.name} />
              <button
                onClick={toggleWishlist}
                className="absolute top-6 right-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-black/40 backdrop-blur-xl transition hover:bg-black/80"
              >
                <Heart className={`w-6 h-6 ${inWishlist ? "fill-[#D4AF37] text-[#D4AF37]" : "text-white"}`} />
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center py-4">
            <p className="text-[#D4AF37] font-bold uppercase tracking-[0.2em] text-sm mb-3">
              {product.category} {product.isLimited && "• Limited Drop"}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">{product.name}</h1>
            <p className="text-gray-500 uppercase tracking-widest text-xs mb-8">Art No. {product.artNo}</p>

            <div className="flex items-baseline gap-4 mb-10">
              <span className="text-3xl font-semibold">LKR {price.toLocaleString()}</span>
              {product.discountPercent > 0 && <span className="text-xl text-gray-500 line-through">LKR {basePrice.toLocaleString()}</span>}
            </div>

            <div className="space-y-6 mb-10">
              <div>
                <div className="flex justify-between mb-3 text-sm font-semibold uppercase tracking-widest text-gray-400">
                  <span>Size & Color</span>
                  <span>Stock: {selectedVariant?.stock || 0}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {product.variants.map((v) => (
                    <button
                      key={v.sku}
                      onClick={() => setSelectedVariantSku(v.sku)}
                      disabled={v.stock === 0}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium tracking-wide transition-all
                        ${v.stock === 0 ? 'opacity-30 cursor-not-allowed border-gray-800' :
                        selectedVariantSku === v.sku ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white' : 'border-gray-800 hover:border-gray-500 text-gray-400'}`}
                    >
                      {v.size} - {v.color}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-3 text-sm font-semibold uppercase tracking-widest text-gray-400">Quantity</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-800 rounded-full bg-[#111] w-32 h-12">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex-1 text-xl text-gray-400 hover:text-white">−</button>
                    <span className="font-semibold">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(selectedVariant?.stock || 1, quantity + 1))} className="flex-1 text-xl text-gray-400 hover:text-white">+</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || selectedVariant.stock === 0}
                className="flex-1 h-14 rounded-full bg-white/10 hover:bg-white/20 transition-colors uppercase tracking-widest text-sm font-bold disabled:opacity-50"
              >
                Add To Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!selectedVariant || selectedVariant.stock === 0}
                className="flex-1 h-14 rounded-full bg-[#D4AF37] hover:bg-[#F2CA50] text-black transition-colors uppercase tracking-widest text-sm font-bold disabled:opacity-50"
              >
                Buy Now
              </button>
            </div>

            <p className="text-gray-400 leading-relaxed mb-10">
              {product.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-gray-800/50">
              <div className="flex flex-col items-center text-center gap-2 text-gray-400">
                <Truck className="w-6 h-6 text-[#D4AF37]" />
                <span className="text-xs uppercase tracking-widest">Fast Delivery</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 text-gray-400">
                <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
                <span className="text-xs uppercase tracking-widest">Secure Checkout</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 text-gray-400">
                <RefreshCcw className="w-6 h-6 text-[#D4AF37]" />
                <span className="text-xs uppercase tracking-widest">Free Returns</span>
              </div>
            </div>

          </div>
        </div>

        {/* Buy Now Modal */}
        {showBuyNowModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#111] rounded-xl p-6 border border-gray-800 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Product Already in Cart</h3>
              <p className="text-gray-400 mb-6">
                This product is already in your cart. Would you like to view your cart summary or proceed with purchasing this item only?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleViewCartSummary}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold transition-colors"
                >
                  View Cart Summary
                </button>
                <button
                  onClick={handleProceedWithItem}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#F2CA50] text-black py-3 rounded-lg font-bold transition-colors"
                >
                  Buy This Item
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductDetails;
