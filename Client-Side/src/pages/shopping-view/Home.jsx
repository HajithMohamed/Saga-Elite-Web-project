import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { LogOut, User as UserIcon, ArrowRight, Gift, ShieldCheck, Zap } from "lucide-react";
import { logoutUserAction } from "../../store/auth-slice";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/v1`
  : "http://localhost:5001/api/v1";

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toast } = useToast();

  // Auth state
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const cartInfo = useSelector((state) => state.cart?.cart);
  const totalQuantity = cartInfo?.totalQuantity || 0;

  // Dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Images
  const [heroImage, setHeroImage] = useState(null);
  const [logoImage, setLogoImage] = useState(null);

  // Close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch images
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const [heroRes, logoRes] = await Promise.all([
          axios.get(`${API_BASE}/image/get-hero-images`).catch(() => null),
          axios.get(`${API_BASE}/image/get-logo-images`).catch(() => null),
        ]);

        if (heroRes?.data?.images?.length) {
          setHeroImage(heroRes.data.images[0]);
        }

        if (logoRes?.data?.images?.length) {
          setLogoImage(logoRes.data.images[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchImages();
  }, []);

  const heroSrc = heroImage?.url || "/LOGO.png";
  const logoSrc = logoImage?.url || "/LOGO.png";

  // Logout
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
        toast({ title: "Error occurred", variant: "destructive" });
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
    <div className="bg-black text-white min-h-screen">

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl flex justify-between items-center px-12 py-6">
        <div
          className="text-2xl font-bold text-[#D4AF37] cursor-pointer"
          onClick={() => navigate("/")}
        >
          SAGA ELITE
        </div>

        <div className="flex items-center gap-6 text-[#D4AF37]">
          {/* PROFILE */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={handleProfileClick}>
              {isAuthenticated && user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="profile"
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <span className="material-symbols-outlined">person</span>
              )}
            </button>

            {dropdownOpen && isAuthenticated && (
              <div className="absolute right-0 mt-4 w-48 bg-[#1a1a1a] border border-[#D4AF37]/30">
                <div className="px-4 py-2 text-xs">{user?.email}</div>
                <button
                  onClick={() => navigate("/shopping/account")}
                  className="block w-full text-left px-4 py-2 hover:bg-[#2a2a2a]"
                >
                  <UserIcon size={14} /> My Account
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-red-400 hover:bg-[#2a2a2a]"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>

          {/* CART */}
          <button onClick={() => navigate("/shopping/checkout")} className="relative">
            🛒
            {totalQuantity > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs px-1 rounded">
                {totalQuantity}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="h-screen flex items-center justify-center text-center relative">
        <img
          src={heroSrc}
          className="absolute w-full h-full object-cover opacity-30"
          alt="hero"
        />

        <div className="relative z-10">
          <img src={logoSrc} className="h-16 mx-auto mb-6" />
          <h1 className="text-6xl font-bold mb-6">
            Rare Fit <span className="text-[#D4AF37]">Forever</span>
          </h1>

          <Link
            to="/shopping/product-list"
            className="bg-[#D4AF37] text-black px-8 py-4 font-bold"
          >
            Shop Now <ArrowRight className="inline ml-2" />
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 grid md:grid-cols-3 gap-10 px-12">
        <div className="text-center">
          <Zap className="mx-auto text-[#D4AF37]" />
          <h3 className="text-xl mt-4">Limited Drops</h3>
        </div>
        <div className="text-center">
          <ShieldCheck className="mx-auto text-[#D4AF37]" />
          <h3 className="text-xl mt-4">Premium Quality</h3>
        </div>
        <div className="text-center">
          <Gift className="mx-auto text-[#D4AF37]" />
          <h3 className="text-xl mt-4">Rewards</h3>
        </div>
      </section>
    </div>
  );
};

export default Home;