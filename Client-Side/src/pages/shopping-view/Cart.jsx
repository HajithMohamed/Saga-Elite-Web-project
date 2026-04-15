import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  fetchCartAction,
  updateCartItemAction,
  removeFromCartAction,
} from "@/store/cart-slice";
import { toast } from "@/hooks/use-toast";
import { Loader2, Minus, Plus, Trash2, ArrowRight } from "lucide-react";

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items = [], totalPrice = 0, totalQuantity = 0, isLoading } =
    useSelector((state) => state.cart.cart);

  useEffect(() => {
    dispatch(fetchCartAction());
  }, [dispatch]);

  const handleQuantityChange = async (item, quantity) => {
    try {
      if (quantity < 1) return;

      await dispatch(
        updateCartItemAction({
          itemId: item.id,
          quantity,
        })
      ).unwrap();
    } catch (err) {
      toast({
        title: "Update failed",
        description: err?.message || "Unable to update quantity.",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await dispatch(removeFromCartAction(itemId)).unwrap();

      toast({
        title: "Removed",
        description: "Item removed from cart.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Remove failed",
        description: err?.message || "Unable to remove item.",
        variant: "destructive",
      });
    }
  };

  const handleProceedToCheckout = () => {
    if (items.length === 0) return;
    
    navigate("/shopping/checkout", { 
      state: { 
        cartItems: items, 
        cartTotal: totalPrice 
      } 
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-[#111] rounded-full flex items-center justify-center">
            <Trash2 className="w-12 h-12 text-gray-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-gray-400">Add some items to get started</p>
          </div>
          <Link
            to="/shopping/home"
            className="inline-flex items-center gap-2 bg-[#D4AF37] text-black px-6 py-3 rounded-full font-bold hover:bg-[#F2CA50] transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <span className="text-gray-400">{totalQuantity} items</span>
        </div>

        {/* Cart Items */}
        <div className="space-y-6 mb-8">
          {items.map((item) => (
            <div key={item.id} className="flex gap-6 items-center bg-[#111] rounded-xl p-6 border border-gray-800">
              <div className="w-24 h-24 bg-[#0a0a0a] rounded-lg overflow-hidden flex-shrink-0 border border-gray-800">
                <img
                  src={item.product.image || "/LOGO.png"}
                  className="w-full h-full object-cover"
                  alt={item.product.name}
                />
              </div>
              
              <div className="flex-1 space-y-2">
                <h3 className="font-bold text-lg">{item.product.name}</h3>
                <p className="text-sm text-gray-400">
                  {item.variant.size} • {item.variant.color}
                </p>
                <p className="font-bold text-[#D4AF37]">LKR {item.unitPrice}</p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleQuantityChange(item, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="w-8 h-8 rounded-full bg-[#222] hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold">{item.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-[#222] hover:bg-[#333] flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right min-w-[100px]">
                <p className="font-bold text-lg text-[#D4AF37]">LKR {item.subTotal}</p>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => handleRemove(item.id)}
                className="w-8 h-8 rounded-full bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Total & Checkout */}
        <div className="bg-[#111] rounded-xl p-6 border border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xl font-bold">Total</span>
            <span className="text-2xl font-extrabold text-[#D4AF37]">LKR {totalPrice}</span>
          </div>
          
          <button
            onClick={handleProceedToCheckout}
            className="w-full bg-[#D4AF37] hover:bg-[#F2CA50] text-black font-bold py-4 rounded-full transition-colors flex items-center justify-center gap-2 text-lg"
          >
            Proceed to Checkout
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;