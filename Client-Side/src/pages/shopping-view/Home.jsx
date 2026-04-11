import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gift, ShieldCheck, Zap } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/v1`
  : 'http://localhost:5001/api/v1';

const Home = () => {
  const [heroImage, setHeroImage] = useState(null);
  const [logoImage, setLogoImage] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const [heroResponse, logoResponse] = await Promise.all([
          axios.get(`${API_BASE}/image/get-hero-images`).catch((err) => err),
          axios.get(`${API_BASE}/image/get-logo-images`).catch((err) => err),
        ]);

        if (heroResponse?.data?.images?.length) {
          setHeroImage(heroResponse.data.images[0]);
        }

        if (logoResponse?.data?.images?.length) {
          setLogoImage(logoResponse.data.images[0]);
        }
      } catch (error) {
        console.error("Failed to load homepage images", error);
      }
    };

    fetchImages();
  }, []);

  const heroSrc = heroImage?.url || "/LOGO.png";
  const logoSrc = logoImage?.url || "/LOGO.png";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-[80vh] flex items-center justify-center bg-black overflow-hidden">
        {/* Abstract Background Elements (Dummy Visuals) */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10 hidden md:block"></div>
        <div className="absolute inset-0 opacity-40 flex items-center justify-center">
          <img src={heroSrc} alt="Hero bg" className="object-cover w-full h-full blur-sm opacity-30 saturate-200" />
        </div>
        
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
          <img
            src={logoSrc}
            alt="Saga Elite Logo"
            className="mb-6 h-16 w-auto object-contain opacity-90"
          />
          <h2 className="text-[#D4AF37] font-bold tracking-[0.3em] uppercase text-sm md:text-base mb-4">
            Unisex | Youth-Driven | Statement Style
          </h2>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 uppercase tracking-tight">
            Rare Fit <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-amber-200">Forever</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Saga Elite is a premium drop-based fashion platform. Access limited-edition collections restricted by quantity and time. Once they're gone, they're archived forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/shopping/product-list?category=drops" 
              className="bg-[#D4AF37] text-black hover:bg-amber-300 font-bold uppercase tracking-wider py-4 px-8 rounded-sm transition-all flex items-center justify-center gap-2"
            >
              Explore Latest Drop <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/auth/register" 
              className="bg-transparent border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold uppercase tracking-wider py-4 px-8 rounded-sm transition-all flex items-center justify-center"
            >
              Join Elite Club
            </Link>
          </div>
        </div>
      </section>

      {/* Exclusivity / Features Section */}
      <section className="py-20 bg-neutral-950">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-neutral-800 bg-neutral-900 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
              <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] mb-6">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wide mb-3">Limited Drops</h3>
              <p className="text-gray-400">
                Products are released in meticulously crafted drops with an underlying story. Strict stock limits guarantee exclusivity.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-neutral-800 bg-neutral-900 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
              <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] mb-6">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wide mb-3">Premium Quality</h3>
              <p className="text-gray-400">
                Engineered for the bold. High-end fabrics and statement silhouettes tailored perfectly for a youth-driven generation.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-neutral-800 bg-neutral-900 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
              <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] mb-6">
                <Gift className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wide mb-3">Surprise Rewards</h3>
              <p className="text-gray-400">
                Every confirmed order receives a tiered surprise gift. From Basic to Elite gifts, we reward loyalty and high-value orders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured/Latest Drop Placeholder */}
      <section className="py-24 bg-black border-y border-neutral-900">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-wider mb-2">Drop #001: Genesis</h2>
              <p className="text-[#D4AF37]">Available now. Limited Edition.</p>
            </div>
            <Link to="/shopping/product-list" className="hidden md:flex items-center text-gray-400 hover:text-[#D4AF37] transition-colors mt-4 md:mt-0 uppercase tracking-widest text-sm font-semibold">
              View Collection <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Dummy Product Cards */}
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="group cursor-pointer">
                <div className="relative aspect-[3/4] bg-neutral-900 rounded-sm overflow-hidden mb-4 border border-neutral-800 group-hover:border-[#D4AF37]/50 transition-colors flex items-center justify-center">
                  <span className="text-neutral-700 font-bold uppercase tracking-widest">Image {item}</span>
                  <div className="absolute top-4 right-4 bg-[#D4AF37] text-black text-xs font-bold px-2 py-1 uppercase scale-0 group-hover:scale-100 transition-transform origin-center">
                    View
                  </div>
                </div>
                <h3 className="font-bold text-lg uppercase tracking-wide text-gray-200 group-hover:text-white transition-colors">
                  Genesis Oversized Tee 0{item}
                </h3>
                <p className="text-[#D4AF37] font-medium mt-1">LKR 4,999</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gift System Call-to-action */}
      <section className="py-20 bg-gradient-to-b from-neutral-950 md:from-transparent to-black relative">
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <Gift className="w-16 h-16 mx-auto text-[#D4AF37] mb-6" />
          <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-wider mb-4">
            Unlock The Elite Gifts
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-8 text-lg">
            Spend above LKR 10,000 and upgrade your complimentary surprise reward to the Elite Tier. The bold are always rewarded.
          </p>
          <Link 
            to="/shopping/product-list" 
            className="inline-block bg-white text-black hover:bg-[#D4AF37] font-bold uppercase tracking-wider py-3 px-10 rounded-sm transition-colors"
          >
            Shop Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
