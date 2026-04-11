import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { LogOut, User as UserIcon } from "lucide-react";
import { logoutUserAction } from "../../store/auth-slice";
import { useToast } from "../../hooks/use-toast";

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  // State from redux matching ShoppingHeader integration
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const cartInfo = useSelector((state) => state.cart?.cart);
  const totalQuantity = cartInfo?.totalQuantity || 0;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logoutUserAction())
      .then((res) => {
        if (res?.payload?.success) {
          toast({ title: "Logged out successfully" });
          navigate("/auth/login");
        } else {
          toast({ title: "Logout failed", variant: "destructive" });
        }
      })
      .catch(() => {
        toast({ title: "An error occurred", variant: "destructive" });
      });
  };

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      navigate("/auth/login");
    } else {
      setDropdownOpen(!dropdownOpen);
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen dark">
      <div className="grain"></div>
      
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-[#131313]/80 backdrop-blur-xl flex justify-between items-center px-12 py-6">
        <div className="text-2xl font-serif font-bold tracking-tighter text-[#D4AF37] cursor-pointer" onClick={() => navigate("/")}>
          SAGA ELITE
        </div>
        <div className="hidden md:flex items-center gap-10">
          <a className="font-sans tracking-[0.1em] uppercase text-xs text-[#F2CA50] transition-colors duration-500" href="#">
            Current Drop
          </a>
          <a className="font-sans tracking-[0.1em] uppercase text-xs text-[#E5E2E1]/70 hover:text-[#F2CA50] transition-colors duration-500" href="#">
            Archive
          </a>
          <a className="font-sans tracking-[0.1em] uppercase text-xs text-[#E5E2E1]/70 hover:text-[#F2CA50] transition-colors duration-500" href="#">
            The Story
          </a>
        </div>
        <div className="flex items-center gap-6 text-[#D4AF37]">
          {/* Profile Section */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={handleProfileClick}
              className="hover:opacity-80 transition-opacity flex items-center justify-center"
            >
              {isAuthenticated && user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="w-6 h-6 rounded-full border border-[#D4AF37] object-cover"
                />
              ) : (
                <span className="material-symbols-outlined">person</span>
              )}
            </button>
            
            {dropdownOpen && isAuthenticated && (
              <div className="absolute right-0 mt-4 w-48 bg-[#1a1a1a] shadow-2xl border border-[#D4AF37]/30 rounded-none z-50 py-2">
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-xs text-[#E5E2E1]/70 truncate font-sans">{user?.email}</p>
                </div>
                <div className="py-1 flex flex-col items-start w-full">
                  <button
                    onClick={() => navigate("/shopping/account")}
                    className="w-full text-left px-4 py-2 text-sm text-[#F2CA50] hover:bg-[#2a2a2a] transition-colors flex flex-row items-center gap-2 font-sans uppercase tracking-widest text-[10px]"
                  >
                    <UserIcon size={14} /> My Account
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#2a2a2a] transition-colors flex flex-row items-center gap-2 font-sans uppercase tracking-widest text-[10px]"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cart Section */}
          <button 
            className="hover:opacity-80 transition-opacity relative"
            onClick={() => navigate("/shopping/checkout")}
          >
            <span className="material-symbols-outlined">shopping_bag</span>
            {totalQuantity > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#D4AF37] text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                {totalQuantity}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Cinematic Hero */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            alt="Hero background" 
            className="w-full h-full object-cover grayscale opacity-60" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD34OURzKzM9H-kYFv4iPMpgaWDJAlZpfp9SeAjSQKGCoWIe0MVvoc_i5sUB3peoLtElV9ejRivzLuZqKD75xmyC5VxwiAOgIi8J3_ioktMFxXvnp-W7INFc7em2Pz-LQipDsfVJbx-aWGmORMqPeaYnz4SZqseDC5KiR2Ac3Qsduyirhpr7cMZzceEGY9zxWIbix53W_665xoITWvAc8lrvszGBVkdaTd6_8JxAU9E-7zfQ0fS2Vy4kcuzBs6PiXmUOpLWmNPbZsM"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        </div>
        <div className="relative z-10 text-center px-6">
          <p className="font-sans tracking-[0.4em] uppercase text-primary mb-4 text-sm">The Sovereign Ledger</p>
          <h1 className="font-serif text-6xl md:text-9xl text-primary font-bold mb-8 tracking-tighter">Rare Fit Forever</h1>
          <div className="flex justify-center">
            <button className="bg-primary-container text-on-primary-container px-12 py-5 font-sans uppercase tracking-widest text-sm font-bold hover:bg-primary transition-all duration-500 shadow-xl shadow-primary/10" onClick={() => navigate("/shopping/product-list")}>
              Shop the Drop
            </button>
          </div>
        </div>
      </section>

      {/* Urgency Section: Drop Timer */}
      <section className="bg-surface-container-lowest py-16 px-12 flex flex-col md:flex-row items-center justify-between gap-8 border-y border-outline-variant/10">
        <div className="flex flex-col">
          <span className="font-sans text-xs tracking-widest text-outline uppercase mb-2">Next Ledger Entry</span>
          <h2 className="font-serif text-3xl text-on-surface">Collection 004</h2>
        </div>
        <div className="flex gap-8 items-baseline">
          <div className="flex flex-col items-center">
            <span className="font-serif text-5xl text-primary">02</span>
            <span className="font-sans text-[10px] tracking-widest text-outline uppercase">Days</span>
          </div>
          <span className="font-serif text-4xl text-outline-variant">:</span>
          <div className="flex flex-col items-center">
            <span className="font-serif text-5xl text-primary">14</span>
            <span className="font-sans text-[10px] tracking-widest text-outline uppercase">Hours</span>
          </div>
          <span className="font-serif text-4xl text-outline-variant">:</span>
          <div className="flex flex-col items-center">
            <span className="font-serif text-5xl text-primary">56</span>
            <span className="font-sans text-[10px] tracking-widest text-outline uppercase">Mins</span>
          </div>
        </div>
        <button className="border border-outline/30 px-10 py-4 font-sans uppercase tracking-widest text-xs text-primary hover:bg-primary hover:text-on-primary transition-all duration-500">
          Remind Me
        </button>
      </section>

      {/* Recent Arrivals Grid */}
      <section className="py-32 px-12 bg-background">
        <div className="flex justify-between items-end mb-20">
          <div>
            <h3 className="font-serif text-4xl text-on-surface mb-2">Recent Arrivals</h3>
            <p className="font-sans text-outline tracking-wider text-sm">Strictly limited archival releases.</p>
          </div>
          <a className="font-sans text-xs uppercase tracking-widest text-primary border-b border-primary/30 pb-1 hover:border-primary transition-all" href="#" onClick={(e) => { e.preventDefault(); navigate("/shopping/product-list"); }}>View All</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Product 1 */}
          <div className="group">
            <div className="relative bg-surface-container-low aspect-[3/4] mb-6 overflow-hidden">
              <img alt="Hoodie" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKVlDT2hrvdWBSpYmdnqK7B7pA6l_q0lgRGzgBg8b5tbYnOA4G0WJMazp_T2vi83D7tmvc1Tfvduvx2vG80V7YkOHpIquwI4-mXDFpEcHXA26L-EUr8vsXaRXNKylfO112QhHe9gK5m0edDyAV1_gRzY-rT_m9IAyj5tXUiKUoin-ruA236BsNyy0YSS7tph6DFqp75D6brzX2Ny5s8gRqroRQ7b4q7ZBHGDvpqMWz7X_JOXrUjPsMP7xG7ozZIqqkxloF4FCO8Yc"/>
              <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1">
                <span className="font-sans text-[10px] tracking-widest text-primary uppercase">Limited 1 of 50</span>
              </div>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-serif text-xl text-on-surface mb-1">Obsidian Void Hoodie</h4>
                <p className="font-sans text-xs text-outline uppercase tracking-widest">Architectural Knit</p>
              </div>
              <span className="font-sans text-lg text-primary">$450</span>
            </div>
          </div>
          {/* Product 2 */}
          <div className="group">
            <div className="relative bg-surface-container-low aspect-[3/4] mb-6 overflow-hidden">
              <img alt="Overcoat" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEETG7k476J3Tq91tYyY-a2Djv7ijnJS-KXYtRXewPvnR5ZdOqoNh-Lc5oubvW3LwJwq4ht-Ne_JoeRECFrUtSH-X1_YfAdotyhbGZi7iQHH59jLwGxFypwT8FRXZkHJdCHhF4vusueJa27niGn26BzIFqt1KQJE_teUjN64P5vbxVI43gOmCsjJ3EVmCyZat_uz7gJbbrPx4JQA_I-eoLy0dBb4avpMJK1GW7jrTQju4CwBdBgpDcpDrHqJc2au-aV_rY36HACdo"/>
              <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1">
                <span className="font-sans text-[10px] tracking-widest text-primary uppercase">Limited 1 of 50</span>
              </div>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-serif text-xl text-on-surface mb-1">Monolith Overcoat</h4>
                <p className="font-sans text-xs text-outline uppercase tracking-widest">Structural Tailoring</p>
              </div>
              <span className="font-sans text-lg text-primary">$1,200</span>
            </div>
          </div>
          {/* Product 3 */}
          <div className="group">
            <div className="relative bg-surface-container-low aspect-[3/4] mb-6 overflow-hidden">
              <img alt="Accessory" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7EThODJJ7FNprP96MVqO3oUuyzYxUhExGv6M6KuAD8Jn7H4nDwk-Yy2-Sthwq0WDypZgA2Y1iEVtFrCwM2CDB3SKLr57dxMkJ6dq_BjiYb8M8N2SeAo6G9iS5Wwzvd1A4jVpdnMTpdFO7HzpMbzV4KbcvOBF-r7Bw4i9wuLj-OOQ0HwSOnFL0KNN14JJqrpvZ8K5H8WlsH2XSDGKjvSSa--yqS6ESyL6nW048VnMVRKok_KFg_WV-wyvZrWjmYMsLLTMuoGS3FQ4"/>
              <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1">
                <span className="font-sans text-[10px] tracking-widest text-primary uppercase">Limited 1 of 50</span>
              </div>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-serif text-xl text-on-surface mb-1">Aurelian Link No. 1</h4>
                <p className="font-sans text-xs text-outline uppercase tracking-widest">Forged Hardware</p>
              </div>
              <span className="font-sans text-lg text-primary">$320</span>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 bg-surface-container-low">
        <div className="p-16 md:p-32 flex flex-col justify-center">
          <span className="font-sans text-xs tracking-[0.4em] uppercase text-primary mb-6">The Ethos</span>
          <h2 className="font-serif text-5xl md:text-6xl text-on-surface mb-10 leading-tight">The Art of Rare Fit Forever</h2>
          <p className="font-sans text-on-surface-variant leading-relaxed text-lg mb-12 max-w-lg">
            We do not follow seasons; we follow legacies. Each piece in the SAGA ELITE ecosystem is a ledger entry—a permanent record of craftsmanship. Our brutalist approach to textile ensures that longevity is not a feature, but the core identity.
          </p>
          <div>
            <button className="border-b border-primary text-primary font-sans uppercase tracking-[0.2em] text-xs pb-2 hover:opacity-70 transition-opacity" onClick={() => navigate("/shopping/product-list")}>Explore Our Atelier</button>
          </div>
        </div>
        <div className="relative min-h-[500px]">
          <img alt="Tailor" className="w-full h-full object-cover grayscale" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGCXSbpm00mQjo6CX55QVQqWpi_2jLDy6C0GXvmUAu_mBAr83V3V2XzWZzFR87noOxpcuvNZ6XPV3AZBeCm7j4tPTIrWGvzMo98j1ZuTwhW6GiB_Za4sXEe_-jfbiY4TbgFkQp5q1EXxjRsgMolZy8GPGZ17sWTkS6GZiqymQgH7Xkug6dM4BTkFY32mbfOPauha0s2hUeLTsG0vYzOObXLLYLFKq8JgFDyCWAMuYx4KZfxh_vz7WCG85HBFy7qGzHTUnqAk-d6ww"/>
        </div>
      </section>

      {/* Gift Tier Teaser */}
      <section className="py-32 px-12 bg-background relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-l from-primary to-transparent"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center mb-20">
          <h3 className="font-serif text-4xl text-on-surface mb-6 italic">The Sovereignty Rewards</h3>
          <p className="font-sans text-outline tracking-wider leading-relaxed">Membership isn't bought; it's earned through the ledger. Our tiered system rewards the permanent collector.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 flex items-center justify-center text-primary mb-8 border border-outline-variant/30">
              <span className="material-symbols-outlined text-4xl">auto_awesome</span>
            </div>
            <h4 className="font-serif text-xl mb-4">Limited Drops</h4>
            <p className="font-sans text-sm text-on-surface-variant tracking-wide leading-6">First-access priority to all ledger entries before public release.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 flex items-center justify-center text-primary mb-8 border border-outline-variant/30">
              <span className="material-symbols-outlined text-4xl">diamond</span>
            </div>
            <h4 className="font-serif text-xl mb-4">Premium Quality</h4>
            <p className="font-sans text-sm text-on-surface-variant tracking-wide leading-6">Sourced from the finest Italian and Japanese mills, built for generational wear.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 flex items-center justify-center text-primary mb-8 border border-outline-variant/30">
              <span className="material-symbols-outlined text-4xl">card_giftcard</span>
            </div>
            <h4 className="font-serif text-xl mb-4">Surprise Rewards</h4>
            <p className="font-sans text-sm text-on-surface-variant tracking-wide leading-6">Unannounced architectural accessories included in the shipments of loyal collectors.</p>
          </div>
        </div>
      </section>

      {/* Secure Your Access */}
      <section className="py-32 px-12 bg-surface-container-low flex flex-col items-center text-center">
        <h2 className="font-serif text-5xl text-on-surface mb-4">Secure Your Access</h2>
        <p className="font-sans text-outline tracking-[0.2em] uppercase text-xs mb-12">Entry into the Sovereign Ledger is limited.</p>
        <form className="w-full max-w-md flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
          <div className="relative">
            <input 
              className="w-full bg-transparent border-0 border-b border-outline-variant/50 py-4 font-sans text-xs tracking-widest text-on-surface placeholder:text-outline-variant focus:ring-0 focus:border-primary transition-all text-center" 
              placeholder="ENTER EMAIL ADDRESS" 
              type="email"
            />
          </div>
          <button className="bg-primary-container text-on-primary-container py-5 font-sans uppercase tracking-[0.3em] text-xs font-bold hover:bg-primary transition-all duration-500">
            Join the Elite
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="w-full py-20 px-12 bg-[#0E0E0E] flex flex-col items-center gap-12 text-center">
        <div className="text-[#D4AF37] font-serif text-xl tracking-widest uppercase">SAGA ELITE</div>
        <div className="flex flex-wrap justify-center gap-12">
          <a className="font-sans tracking-widest text-xs uppercase text-[#99907C] hover:text-[#D4AF37] transition-all" href="#">Membership</a>
          <a className="font-sans tracking-widest text-xs uppercase text-[#99907C] hover:text-[#D4AF37] transition-all" href="#">Privacy</a>
          <a className="font-sans tracking-widest text-xs uppercase text-[#99907C] hover:text-[#D4AF37] transition-all" href="#">Terms</a>
          <a className="font-sans tracking-widest text-xs uppercase text-[#99907C] hover:text-[#D4AF37] transition-all" href="#">Contact</a>
        </div>
        <div className="font-sans tracking-widest text-[10px] uppercase text-[#99907C]/50 mt-8">
            © 2024 SAGA ELITE. ARCHITECTURAL BRUTALISM IN TEXTILE.
        </div>
      </footer>
    </div>
  );
};

export default Home;
