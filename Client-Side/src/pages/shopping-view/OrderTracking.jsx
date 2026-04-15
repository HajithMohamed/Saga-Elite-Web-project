import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const OrderTracking = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-none shadow-sm shadow-slate-200/50">
        <div className="flex justify-between items-center w-full px-8 py-6 max-w-screen-2xl mx-auto">
          <Link to="/shopping/home" className="font-manrope text-xl font-black tracking-[0.2em] text-slate-950 dark:text-white uppercase">ARCHITECT</Link>
          <div className="hidden md:flex items-center space-x-12">
            <Link className="font-manrope font-light tracking-tight text-slate-400 dark:text-slate-500 hover:text-slate-600 transition-opacity duration-300" to="/shopping/home">Collections</Link>
            <Link className="font-manrope font-light tracking-tight text-slate-400 dark:text-slate-500 hover:text-slate-600 transition-opacity duration-300" to="/shopping/home">Curated</Link>
            <Link className="font-manrope font-light tracking-tight text-slate-400 dark:text-slate-500 hover:text-slate-600 transition-opacity duration-300" to="/shopping/wishlist">Wishlist</Link>
            <Link className="font-manrope font-light tracking-tight text-slate-950 dark:text-white border-b border-slate-950 dark:border-white pb-1 transition-opacity duration-300" to="/shopping/account">Orders</Link>
          </div>
          <div className="flex items-center space-x-6">
            <button onClick={() => navigate('/shopping/cart')} className="hover:opacity-70 transition-opacity duration-300 scale-95 active:scale-100 transition-transform">
              <span className="material-symbols-outlined text-slate-950 dark:text-white" data-icon="shopping_bag">shopping_bag</span>
            </button>
            <button onClick={() => navigate('/shopping/account')} className="hover:opacity-70 transition-opacity duration-300 scale-95 active:scale-100 transition-transform">
              <span className="material-symbols-outlined text-slate-950 dark:text-white" data-icon="person">person</span>
            </button>
          </div>
        </div>
      </nav>
      <main className="pt-32 pb-24 px-8 max-w-screen-xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="space-y-4">
            <p className="font-label text-xs tracking-widest uppercase text-on-surface-variant font-medium">Tracking Narrative</p>
            <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tighter text-primary">In Transit.</h1>
          </div>
          <div className="flex flex-col md:items-end space-y-1">
            <div className="font-label text-sm text-on-surface-variant">Order Reference</div>
            <div className="font-headline text-2xl font-bold">#AM-2941-0082</div>
            <div className="font-body text-sm text-outline">Placed August 14, 2024</div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-16">
            <div className="relative py-8">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-surface-container-highest -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-0 w-3/4 h-[2px] bg-primary-container -translate-y-1/2 transition-all duration-1000"></div>
              <div className="relative flex justify-between">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center z-10 shadow-xl shadow-primary-container/20">
                    <span className="material-symbols-outlined text-lg" data-icon="check" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  </div>
                  <span className="font-label text-[10px] uppercase tracking-widest font-semibold text-on-surface">Confirmed</span>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center z-10 shadow-xl shadow-primary-container/20">
                    <span className="material-symbols-outlined text-lg" data-icon="package_2" style={{ fontVariationSettings: "'FILL' 1" }}>package_2</span>
                  </div>
                  <span className="font-label text-[10px] uppercase tracking-widest font-semibold text-on-surface">Shipped</span>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center z-10 shadow-xl shadow-primary-container/20">
                    <span className="material-symbols-outlined text-lg" data-icon="local_shipping" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                  </div>
                  <span className="font-label text-[10px] uppercase tracking-widest font-semibold text-on-surface">Transit</span>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high text-outline-variant flex items-center justify-center z-10">
                    <span className="material-symbols-outlined text-lg" data-icon="home_pin">home_pin</span>
                  </div>
                  <span className="font-label text-[10px] uppercase tracking-widest font-semibold text-outline">Delivered</span>
                </div>
              </div>
            </div>
            <div className="space-y-10">
              <h3 className="font-headline text-lg font-bold tracking-tight">Recent Activity</h3>
              <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-[1px] before:bg-surface-container-highest">
                <div className="relative pl-10">
                  <div className="absolute left-0 top-1.5 w-[24px] h-[24px] bg-surface flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary-container"></div>
                  </div>
                  <div>
                    <p className="font-body text-sm font-semibold">Out for delivery</p>
                    <p className="font-body text-xs text-on-surface-variant">The package is with your local courier and will be delivered today.</p>
                    <p className="font-label text-[10px] text-outline mt-1">Today, 8:42 AM • Seattle, WA</p>
                  </div>
                </div>
                <div className="relative pl-10">
                  <div className="absolute left-0 top-1.5 w-[24px] h-[24px] bg-surface flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-surface-container-highest"></div>
                  </div>
                  <div>
                    <p className="font-body text-sm font-medium text-on-surface-variant">Arrived at sorting facility</p>
                    <p className="font-label text-[10px] text-outline mt-1">Aug 16, 11:15 PM • Portland, OR</p>
                  </div>
                </div>
                <div className="relative pl-10 opacity-60">
                  <div className="absolute left-0 top-1.5 w-[24px] h-[24px] bg-surface flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-surface-container-highest"></div>
                  </div>
                  <div>
                    <p className="font-body text-sm font-medium text-on-surface-variant">Departed original warehouse</p>
                    <p className="font-label text-[10px] text-outline mt-1">Aug 15, 02:30 PM • San Francisco, CA</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full aspect-video rounded-xl bg-surface-container-low overflow-hidden relative grayscale opacity-80 hover:grayscale-0 transition-all duration-700">
              <img className="w-full h-full object-cover" data-alt="abstract architectural map showing city streets in a minimalist black and white topographic style" data-location="Seattle" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHD9c51bZaKAoLseQWD9epeHAe1NhPdSA5e5E0Um-_HTmuSyF9tw4rQlfyutH81nmrAcVueWpvzaad054-ibxcSUTm6SW0_Z2G8rEfK4GyG6CkSBGThifRZJ2walCapopVcprXFeEooO4MHY2fZFYAZddxZtc4rvw9mHQw4dMGWXaSD_re7OseNALn2D2n78OiLYR6Yz4dTFhvXFYv74kQxFa0Qv2IbpSbORu2zmFqro2VgQZYrmRqzIwTYABLjdE_-mXFj67IEYs" alt="Map" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-2xl">
                  <span className="material-symbols-outlined" data-icon="near_me">near_me</span>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="bg-white/80 backdrop-blur-md p-10 rounded-xl space-y-12 sticky top-32 border border-slate-100 dark:border-slate-800">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-outline" data-icon="location_on">location_on</span>
                  <h4 className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Shipping Destination</h4>
                </div>
                <div className="font-headline text-lg font-medium leading-relaxed">
                  Alexander Mercer<br />
                  1202 Architectural Plaza, Ste 400<br />
                  Seattle, WA 98101<br />
                  United States
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-outline" data-icon="list_alt">list_alt</span>
                  <h4 className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Consignment Items</h4>
                </div>
                <div className="space-y-8">
                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-24 bg-surface-container-low rounded overflow-hidden flex-shrink-0">
                      <img className="w-full h-full object-cover" data-alt="minimalist modern designer chair with clean lines in a bright white architectural studio setting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsw_4-qwXnBTu3i0xkmJIHR70SPU_zaeB80OQxNcRSimrO9dIchpziRBnaPsKE2ngWfAmiTHhU9wWQr26gZmGgVvG12hR20se7j1KSQNKJY5lW9X-pXpRok4xoMt78cSmkVP49VyY-4dLb4GB6R_rksirxbjIY6aZ2kdTWUWiwznPucv49YVouVMTdJsXYCCHrl0m7k3enZDX7JNnse_B2IChFOUjrsxZTft8w-IS1Yq5n9d-wK2knHOCQNRKkz3PUCz1_-ZmbwaE" alt="Chair" />
                    </div>
                    <div className="flex-grow">
                      <h5 className="font-headline text-sm font-bold">The Oculus Armchair</h5>
                      <p className="font-body text-xs text-on-surface-variant">Obsidian Black / Wool Blend</p>
                      <div className="flex justify-between items-end mt-2">
                        <span className="font-body text-xs text-outline">Qty: 1</span>
                        <span className="font-headline text-sm font-semibold">$1,240.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-24 bg-surface-container-low rounded overflow-hidden flex-shrink-0">
                      <img className="w-full h-full object-cover" data-alt="sleek modern glass desk lamp with architectural bronze finish and warm soft lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAB3l48cHK7h8KY14UoXq5AAxUpsU2LDhVhbKHhDtMM-xKYFZZGsg60NXMJg-LMKGF3A4uLPg25jkgVOWTV2OaL26P_L3ha0jcK-AH0BznsrsSvH-fWdREAa6LUWXXScaX-_5C3cxpeIn_-GyfOilVRM2WkMHGeBvZeHlNL45-4UCVtE3WvY9KWL-yVY-k51lf_VqUko7uY9Mbb-rc5Z09jFusKhUFzGx8e9e5OVYdXEb9iKyVhG-UuhzmEJXl5kHvs_6pRMVJF9bw" alt="Lamp" />
                    </div>
                    <div className="flex-grow">
                      <h5 className="font-headline text-sm font-bold">Beam Task Light</h5>
                      <p className="font-body text-xs text-on-surface-variant">Brushed Steel / LED</p>
                      <div className="flex justify-between items-end mt-2">
                        <span className="font-body text-xs text-outline">Qty: 2</span>
                        <span className="font-headline text-sm font-semibold">$390.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-8 space-y-4 border-t border-outline-variant/20">
                <div className="flex justify-between font-body text-sm">
                  <span className="text-on-surface-variant">Subtotal</span>
                  <span>$1,630.00</span>
                </div>
                <div className="flex justify-between font-body text-sm">
                  <span className="text-on-surface-variant">Premium Shipping</span>
                  <span className="text-on-primary-container font-medium">Complimentary</span>
                </div>
                <div className="flex justify-between pt-4 font-headline text-xl font-black">
                  <span>Total</span>
                  <span>$1,630.00</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button className="bg-primary text-on-primary py-4 rounded-lg font-label text-xs uppercase tracking-widest font-bold hover:bg-slate-800 transition-colors">
                  Need Help?
                </button>
                <button className="bg-surface-container-highest text-on-surface py-4 rounded-lg font-label text-xs uppercase tracking-widest font-bold hover:bg-surface-container-high transition-colors">
                  Invoice PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="w-full mt-24 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-16 gap-8 max-w-screen-2xl mx-auto">
          <div className="font-manrope font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">ARCHITECT</div>
          <div className="flex flex-wrap justify-center gap-8">
            <a className="font-inter text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors" href="#">Sustainability</a>
            <a className="font-inter text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors" href="#">Shipping & Returns</a>
            <a className="font-inter text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors" href="#">Privacy Policy</a>
            <a className="font-inter text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors" href="#">Contact</a>
          </div>
          <div className="font-inter text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500">
            © 2024 THE ELEVATED MERCHANT. ARCHITECTURAL FLOW.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OrderTracking;
