import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-16 text-white">
      <div className="max-w-xl rounded-[2rem] border border-white/10 bg-[#0b0b0b] p-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#D4AF37]">404</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight">Page not found</h1>
        <p className="mt-4 text-sm text-white/65">
          The page you tried to open is missing, moved, or no longer available.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/shopping/home"
            className="rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#e3c45f]"
          >
            Go to Home
          </Link>
          <Link
            to="/contact"
            className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
