import React, { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderById } from '@/store/order-slice';

const OrderTracking = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { currentOrder, isLoading } = useSelector(state => state.order);

  const orderId = location.state?.orderId || searchParams.get('orderId');
  const orderReference = orderId ? `#${orderId.replace(/^#/, '')}` : '';

  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderById(orderId));
    }
  }, [dispatch, orderId]);

  if (isLoading || !currentOrder) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4AF37] border-t-transparent"></div>
          <p className="text-sm tracking-widest text-[#D4AF37]">LOADING ORDER...</p>
        </div>
      </div>
    );
  }

  const { items, shippingAddress, contactNumber, user, status, totalAmount, createdAt } = currentOrder;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const statusList = [
    { key: "pending", label: "Confirmed", icon: "check" },
    { key: "confirmed", label: "Processing", icon: "inventory_2" },
    { key: "shipped", label: "Shipped", icon: "package_2" },
    { key: "delivered", label: "Delivered", icon: "home_pin" },
  ];

  const currentStatusIndex = statusList.findIndex(s => s.key === status);

  return (
    <div className="bg-black text-white min-h-screen">
      <main className="pt-24 pb-24 px-8 max-w-screen-xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="space-y-4">
            <p className="font-label text-xs tracking-widest uppercase text-gray-400 font-medium">Tracking Narrative</p>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white">
              {status === 'delivered' ? 'Delivered.' : status === 'shipped' ? 'In Transit.' : 'Processing.'}
            </h1>
          </div>
          <div className="flex flex-col md:items-end space-y-1">
            <div className="font-label text-sm text-gray-400">Order Reference</div>
            <div className="text-2xl font-bold text-[#D4AF37]">{orderReference}</div>
            <div className="text-sm text-gray-500">Placed {formatDate(createdAt)}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-16">
            <div className="relative py-8">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-neutral-800 -translate-y-1/2"></div>
              <div 
                className="absolute top-1/2 left-0 h-[2px] bg-[#D4AF37] -translate-y-1/2 transition-all duration-1000"
                style={{ width: \`\${Math.max(0, currentStatusIndex) * 33.33}%\` }}
              ></div>
              <div className="relative flex justify-between">
                {statusList.map((s, index) => {
                  const isCompleted = currentStatusIndex >= index;
                  return (
                    <div key={s.key} className="flex flex-col items-center gap-4">
                      <div className={\`w-10 h-10 rounded-full flex items-center justify-center z-10 shadow-xl transition-colors duration-500 \${isCompleted ? 'bg-[#D4AF37] text-black shadow-[#D4AF37]/20' : 'bg-neutral-800 text-gray-500'}\`}>
                        <span className="material-symbols-outlined text-lg" data-icon={s.icon} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                      </div>
                      <span className={\`font-label text-[10px] uppercase tracking-widest font-semibold \${isCompleted ? 'text-white' : 'text-gray-500'}\`}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="w-full aspect-video rounded-xl bg-neutral-900 border border-white/10 overflow-hidden relative grayscale opacity-80 hover:grayscale-0 transition-all duration-700">
              <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHD9c51bZaKAoLseQWD9epeHAe1NhPdSA5e5E0Um-_HTmuSyF9tw4rQlfyutH81nmrAcVueWpvzaad054-ibxcSUTm6SW0_Z2G8rEfK4GyG6CkSBGThifRZJ2walCapopVcprXFeEooO4MHY2fZFYAZddxZtc4rvw9mHQw4dMGWXaSD_re7OseNALn2D2n78OiLYR6Yz4dTFhvXFYv74kQxFa0Qv2IbpSbORu2zmFqro2VgQZYrmRqzIwTYABLjdE_-mXFj67IEYs" alt="Map Tracking" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-[#D4AF37] flex items-center justify-center text-black shadow-2xl shadow-[#D4AF37]/50 animate-pulse">
                  <span className="material-symbols-outlined" data-icon="near_me">near_me</span>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="bg-neutral-900/50 backdrop-blur-md p-10 rounded-xl space-y-12 sticky top-32 border border-white/5">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#D4AF37]" data-icon="location_on">location_on</span>
                  <h4 className="font-label text-[10px] uppercase tracking-widest font-bold text-gray-400">Shipping Destination</h4>
                </div>
                <div className="text-lg font-medium leading-relaxed text-white">
                  {user?.email}<br />
                  <span className="text-gray-300">{shippingAddress}</span><br />
                  <span className="text-gray-400 text-sm mt-2 block">{contactNumber}</span>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#D4AF37]" data-icon="list_alt">list_alt</span>
                  <h4 className="font-label text-[10px] uppercase tracking-widest font-bold text-gray-400">Consignment Items</h4>
                </div>
                <div className="space-y-8">
                  {items.map((item, idx) => {
                    const productImg = item.product?.images?.[0]?.url || item.product?.primaryImage || "https://placehold.co/400x500/111/444.png?text=Product";
                    return (
                      <div key={idx} className="flex gap-4 items-center">
                        <div className="w-20 h-24 bg-neutral-800 rounded border border-white/10 overflow-hidden flex-shrink-0">
                          <img className="w-full h-full object-cover" src={productImg} alt={item.productName} />
                        </div>
                        <div className="flex-grow">
                          <h5 className="text-sm font-bold text-white">{item.productName}</h5>
                          <p className="text-xs text-gray-400 mt-1">{item.color} / {item.size}</p>
                          <div className="flex justify-between items-end mt-3">
                            <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                            <span className="text-sm font-semibold text-[#D4AF37]">LKR {item.totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="pt-8 space-y-4 border-t border-white/10">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">LKR {totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Premium Shipping</span>
                  <span className="text-[#D4AF37] font-medium">Complimentary</span>
                </div>
                <div className="flex justify-between pt-4 text-xl font-black text-white">
                  <span>Total</span>
                  <span>LKR {totalAmount.toFixed(2)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button className="bg-[#D4AF37] text-black py-4 rounded-lg font-label text-xs uppercase tracking-widest font-bold hover:bg-[#eadd99] transition-colors" onClick={() => window.location.href = 'mailto:support@sagaelite.com'}>
                  Need Help?
                </button>
                <button className="bg-neutral-800 text-white py-4 rounded-lg font-label text-xs uppercase tracking-widest font-bold hover:bg-neutral-700 border border-white/5 transition-colors">
                  Invoice PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderTracking;
