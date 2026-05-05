import React, { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Eyebrow, Hairline, Wordmark } from "@/components/ui/editorial";

const HEADER_MARQUEE = [
  "Free island-wide delivery",
  "Members enter first",
  "Rare fit, forever",
  "Made in Sri Lanka",
  "New chapter every fortnight",
];

// ─────────────────────────────────────────────────────────────────────────────
// Planet components — small, restrained visuals
// ─────────────────────────────────────────────────────────────────────────────
const Dot = ({ size = 4, color = "#f2ca50", glow = false }) => (
  <span
    className="block rounded-full"
    style={{
      width: size,
      height: size,
      background: color,
      boxShadow: glow ? `0 0 ${size * 2}px ${color}80` : "none",
    }}
  />
);

const RingedPlanet = ({ size = 9, color = "#d4af37" }) => (
  <span
    className="relative block rounded-full"
    style={{ width: size, height: size, background: color }}
  >
    <span
      className="absolute rounded-full"
      style={{
        width: size * 2.2,
        height: size * 0.45,
        border: "1px solid rgba(242,202,80,0.35)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%) rotate(-22deg)",
      }}
    />
  </span>
);

const SaturnPlanet = ({ size = 10 }) => (
  <span
    className="relative block rounded-full"
    style={{
      width: size,
      height: size,
      background:
        "radial-gradient(circle at 30% 30%, #ffe088 0%, #f2ca50 45%, #d4af37 100%)",
      boxShadow: "0 0 8px rgba(242,202,80,0.4)",
    }}
  >
    <span
      className="absolute rounded-full"
      style={{
        width: size * 2.6,
        height: size * 0.6,
        border: "1px solid rgba(242,202,80,0.55)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%) rotate(-18deg)",
      }}
    />
    <span
      className="absolute rounded-full"
      style={{
        width: size * 3.0,
        height: size * 0.7,
        border: "1px solid rgba(242,202,80,0.18)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%) rotate(-18deg)",
      }}
    />
  </span>
);

const EarthWithMoon = ({ planetSize = 6, moonOrbit = 14 }) => (
  <span className="relative block" style={{ width: planetSize, height: planetSize }}>
    <span
      className="block rounded-full"
      style={{
        width: planetSize,
        height: planetSize,
        background:
          "radial-gradient(circle at 30% 30%, #ffe088 0%, #d4af37 60%, #735c00 100%)",
      }}
    />
    {/* Moon orbits around Earth */}
    <motion.span
      className="absolute"
      style={{ top: "50%", left: "50%", width: 0, height: 0 }}
      animate={{ rotate: 360 }}
      transition={{ duration: 4, ease: "linear", repeat: Infinity }}
    >
      <span
        className="block rounded-full bg-white/85 absolute"
        style={{
          width: 2,
          height: 2,
          left: moonOrbit,
          top: 0,
          transform: "translate(-50%, -50%)",
        }}
      />
    </motion.span>
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// Orbit — renders the orbital path ring + a rotating planet at its radius
// ─────────────────────────────────────────────────────────────────────────────
const Orbit = ({
  radius,
  duration,
  reverse = false,
  pathOpacity = 0.10,
  dashed = true,
  startAngle = 0,
  counterRotate = false,
  children,
}) => (
  <>
    {/* Orbit path */}
    <div
      className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
      style={{
        width: radius * 2,
        height: radius * 2,
        marginLeft: -radius,
        marginTop: -radius,
        border: `1px ${dashed ? "dashed" : "solid"} rgba(242, 202, 80, ${pathOpacity})`,
      }}
    />
    {/* Rotating wrapper — width/height 0 so rotation pivots on its (0,0) */}
    <motion.div
      className="absolute top-1/2 left-1/2"
      style={{ width: 0, height: 0 }}
      initial={{ rotate: startAngle }}
      animate={{ rotate: startAngle + (reverse ? -360 : 360) }}
      transition={{ duration, ease: "linear", repeat: Infinity }}
    >
      <div
        className="absolute"
        style={{
          left: radius,
          top: 0,
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Optional counter-rotation so planet contents (e.g. Saturn rings) stay still */}
        {counterRotate ? (
          <motion.div
            initial={{ rotate: -startAngle }}
            animate={{ rotate: -startAngle - (reverse ? -360 : 360) }}
            transition={{ duration, ease: "linear", repeat: Infinity }}
          >
            {children}
          </motion.div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// Asteroid belt — many tiny dots scattered around an orbit
// ─────────────────────────────────────────────────────────────────────────────
const AsteroidBelt = ({ radius, duration = 80, count = 28 }) => {
  const asteroids = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 360 + (i % 3) * 7;
    const wobble = (i % 5) - 2;
    return { angle, wobble };
  });
  return (
    <motion.div
      className="absolute top-1/2 left-1/2"
      style={{ width: 0, height: 0 }}
      animate={{ rotate: 360 }}
      transition={{ duration, ease: "linear", repeat: Infinity }}
    >
      {asteroids.map((a, i) => {
        const r = radius + a.wobble;
        const rad = (a.angle * Math.PI) / 180;
        const x = Math.cos(rad) * r;
        const y = Math.sin(rad) * r;
        const sz = (i % 4 === 0) ? 1.5 : 1;
        return (
          <span
            key={i}
            className="absolute rounded-full bg-[#99907c]/55"
            style={{
              width: sz,
              height: sz,
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Comet — periodic streak across the system
// ─────────────────────────────────────────────────────────────────────────────
const Comet = ({ size = 280 }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{
      top: "50%",
      left: "50%",
      width: size * 1.6,
      height: 1,
      transformOrigin: "left center",
      background:
        "linear-gradient(90deg, transparent 0%, rgba(242,202,80,0.0) 30%, rgba(242,202,80,0.45) 75%, rgba(255,224,136,0.95) 100%)",
    }}
    initial={{ opacity: 0, x: -size * 0.9, y: -size * 0.7, rotate: 28 }}
    animate={{
      opacity: [0, 0, 0.8, 0.8, 0],
      x: [-size * 0.9, -size * 0.9, size * 0.4, size * 0.9, size * 0.9],
      y: [-size * 0.7, -size * 0.7, size * 0.2, size * 0.7, size * 0.7],
    }}
    transition={{
      duration: 22,
      times: [0, 0.7, 0.85, 0.95, 1],
      ease: "linear",
      repeat: Infinity,
    }}
  >
    <span
      className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ffe088]"
      style={{ boxShadow: "0 0 12px 2px rgba(255,224,136,0.6)" }}
    />
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SolarSystem — the orchestrated layer (orbits + planets + belt + comet)
// ─────────────────────────────────────────────────────────────────────────────
const SolarSystem = ({ diameter, reduced }) => {
  if (!diameter) return null;
  const sysRadius = diameter / 2 - 12;
  const logoRadius = Math.min(140, diameter * 0.32) / 2;
  const innerStart = logoRadius + 18;
  const span = Math.max(0, sysRadius - innerStart);

  // 6 orbits fanning out from logo edge to system edge
  const orbits = [
    {
      name: "mercury",
      radius: innerStart + span * 0.08,
      duration: 9,
      startAngle: 0,
      planet: <Dot size={3} color="#f2ca50" />,
    },
    {
      name: "venus",
      radius: innerStart + span * 0.24,
      duration: 16,
      startAngle: 60,
      planet: <Dot size={5} color="#ffe088" glow />,
    },
    {
      name: "earth",
      radius: innerStart + span * 0.42,
      duration: 26,
      startAngle: 130,
      planet: <EarthWithMoon planetSize={7} moonOrbit={14} />,
    },
    {
      name: "mars",
      radius: innerStart + span * 0.60,
      duration: 38,
      startAngle: 200,
      planet: <Dot size={4} color="#ffbfb4" />,
    },
    {
      name: "jupiter",
      radius: innerStart + span * 0.80,
      duration: 56,
      startAngle: 250,
      counterRotate: true,
      planet: <RingedPlanet size={9} color="#d4af37" />,
    },
    {
      name: "saturn",
      radius: innerStart + span * 0.97,
      duration: 78,
      startAngle: 310,
      counterRotate: true,
      planet: <SaturnPlanet size={10} />,
    },
  ];

  const beltRadius = innerStart + span * 0.70;

  if (reduced) {
    // Static snapshot — orbit rings + planets at their start angles, no motion
    return (
      <>
        {orbits.map((o) => (
          <div
            key={o.name}
            className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
            style={{
              width: o.radius * 2,
              height: o.radius * 2,
              marginLeft: -o.radius,
              marginTop: -o.radius,
              border: "1px dashed rgba(242,202,80,0.10)",
            }}
          />
        ))}
        {orbits.map((o) => {
          const rad = (o.startAngle * Math.PI) / 180;
          const x = Math.cos(rad) * o.radius;
          const y = Math.sin(rad) * o.radius;
          return (
            <div
              key={`p-${o.name}`}
              className="absolute"
              style={{
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
              }}
            >
              {o.planet}
            </div>
          );
        })}
      </>
    );
  }

  return (
    <>
      {orbits.map((o) => (
        <Orbit
          key={o.name}
          radius={o.radius}
          duration={o.duration}
          startAngle={o.startAngle}
          counterRotate={o.counterRotate}
        >
          {o.planet}
        </Orbit>
      ))}
      <AsteroidBelt radius={beltRadius} duration={120} count={32} />
      <Comet size={diameter * 0.55} />
    </>
  );
};

const BrandPanel = () => {
  const reduced = useReducedMotion();
  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState(0);

  useEffect(() => {
    if (!stageRef.current) return;
    const node = stageRef.current;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setStageSize(Math.min(rect.width, rect.height));
    };
    measure();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(measure);
      ro.observe(node);
      return () => ro.disconnect();
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <aside className="relative overflow-hidden hidden md:flex flex-col bg-[#0a0a0a] min-h-[640px]">
      {/* Soft radial gold ambience */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(242,202,80,0.10) 0%, rgba(212,175,55,0.04) 35%, rgba(7,7,7,0) 65%)",
        }}
      />

      {/* Subtle film grain layer */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.4) 1px, transparent 1px)",
          backgroundSize: "3px 3px, 4px 4px",
          backgroundPosition: "0 0, 1px 2px",
        }}
      />

      {/* Inset hairline frame — draws on mount */}
      <motion.div
        className="absolute top-8 left-8 right-8 h-px bg-[#e5e2e1]/15 origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.0, delay: 0.15, ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.div
        className="absolute bottom-8 left-8 right-8 h-px bg-[#e5e2e1]/15 origin-right"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.0, delay: 0.3, ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.div
        className="absolute top-8 bottom-8 left-8 w-px bg-[#e5e2e1]/12 origin-top"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.1, delay: 0.45, ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.div
        className="absolute top-8 bottom-8 right-8 w-px bg-[#e5e2e1]/12 origin-bottom"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.1, delay: 0.55, ease: [0.65, 0, 0.35, 1] }}
      />

      {/* Top: wordmark + chapter eyebrow */}
      <motion.div
        className="relative px-12 pt-12 flex items-start justify-between"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
      >
        <Wordmark size="md" tagline />
        <Eyebrow tone="muted" size="xs">EST · MMXXVI</Eyebrow>
      </motion.div>

      {/* Centre stage: solar system */}
      <div ref={stageRef} className="relative flex-1 flex items-center justify-center px-8">
        {/* SOLAR SYSTEM — orbits + planets + asteroid belt + comet */}
        <SolarSystem diameter={stageSize} reduced={reduced} />

        {/* Pulsing gold glow behind the logo */}
        <motion.div
          className="absolute"
          style={{
            width: "min(70%, 420px)",
            aspectRatio: "1/1",
            background:
              "radial-gradient(circle, rgba(242,202,80,0.32) 0%, rgba(242,202,80,0.10) 40%, transparent 70%)",
            filter: "blur(40px)",
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={
            reduced
              ? { opacity: 0.6, scale: 1 }
              : {
                  opacity: [0.4, 0.7, 0.4],
                  scale: [0.95, 1.05, 0.95],
                }
          }
          transition={
            reduced
              ? { duration: 0.8, ease: "easeOut" }
              : { duration: 6, ease: "easeInOut", repeat: Infinity }
          }
        />

        {/* The logo itself — entrance + continuous breathing */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.85, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.2, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            src="/LOGO.png"
            alt="Saga Elite"
            className="relative z-10 mx-auto select-none pointer-events-none"
            style={{
              width: "min(60%, 280px)",
              aspectRatio: "1/1",
              objectFit: "contain",
              filter: "drop-shadow(0 8px 32px rgba(242,202,80,0.15))",
            }}
            draggable={false}
            animate={
              reduced
                ? {}
                : {
                    y: [0, -6, 0],
                    scale: [1, 1.015, 1],
                  }
            }
            transition={
              reduced
                ? {}
                : {
                    duration: 5,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }
            }
          />
        </motion.div>

      </div>

      {/* Bottom lockup */}
      <motion.div
        className="relative px-12 pb-12"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Eyebrow tone="muted" size="xs">Chapter · XIV</Eyebrow>
        <h2
          className="mt-3 se-serif text-[#fafafa] leading-[0.95] text-4xl lg:text-6xl"
          style={{ letterSpacing: "-0.02em" }}
        >
          Rare fit,<br />forever.
        </h2>
        <div className="mt-7 flex items-center gap-4">
          <motion.div
            className="h-px bg-[#f2ca50] origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 1.6, ease: [0.65, 0, 0.35, 1] }}
            style={{ width: 48 }}
          />
          <span className="se-label text-[10px] tracking-[0.32em] text-[#d0c5af]">
            Made in Sri Lanka · Sent to ninety-three countries
          </span>
        </div>
      </motion.div>

      {/* Bottom-left status pulse */}
      <motion.div
        className="absolute left-12 bottom-3 flex items-center gap-2 se-mono text-[10px] text-[#574500]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 2 }}
      >
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        Atelier · Open
      </motion.div>
    </aside>
  );
};

const AuthLayout = () => {
  const location = useLocation();
  const isLogin = location.pathname.endsWith("/login") || location.pathname === "/auth";
  const isRegister = location.pathname.endsWith("/register");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e2e1] se-body flex flex-col">
      {/* Header marquee */}
      <div className="relative overflow-hidden bg-[#0e0e0e] border-b border-[#4d4635]/60 py-2">
        <div className="flex whitespace-nowrap header-marquee-track">
          {[...HEADER_MARQUEE, ...HEADER_MARQUEE, ...HEADER_MARQUEE].map((item, i) => (
            <span
              key={i}
              className="se-label text-[9px] tracking-[0.32em] text-[#d0c5af] px-6 inline-flex items-center gap-6"
            >
              {item}
              <span className="text-[#574500]">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* Top bar */}
      <div className="px-5 md:px-10 lg:px-12 py-4 md:py-5 border-b border-[#4d4635]/40 flex items-center justify-between">
        <Link
          to="/"
          className="se-label text-[10px] tracking-[0.28em] text-[#d0c5af] hover:text-[#f2ca50] inline-flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          Back to atelier
        </Link>
        <div className="hidden md:flex items-center gap-1 text-[10px] tracking-[0.28em] se-label">
          <Link
            to="/auth/login"
            className={
              isLogin
                ? "px-4 py-1 border border-[#f2ca50] text-[#f2ca50]"
                : "px-4 py-1 border border-transparent text-[#99907c] hover:text-[#e5e2e1]"
            }
          >
            Sign in
          </Link>
          <Link
            to="/auth/register"
            className={
              isRegister
                ? "px-4 py-1 border border-[#f2ca50] text-[#f2ca50]"
                : "px-4 py-1 border border-transparent text-[#99907c] hover:text-[#e5e2e1]"
            }
          >
            Become a member
          </Link>
        </div>
      </div>

      {/* Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 flex-1 min-h-0">
        <BrandPanel />

        {/* Mobile mini-banner */}
        <div className="md:hidden bg-[#0e0e0e] border-b border-[#4d4635]/40 px-5 py-7 flex items-center gap-4">
          <motion.img
            src="/LOGO.png"
            alt="Saga Elite"
            className="h-14 w-14 object-contain shrink-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: "drop-shadow(0 4px 12px rgba(242,202,80,0.2))" }}
            draggable={false}
          />
          <div>
            <Eyebrow tone="muted" size="xs">Chapter · XIV</Eyebrow>
            <h2 className="mt-1 se-serif text-[#fafafa] text-2xl leading-tight">
              Rare fit, forever.
            </h2>
          </div>
        </div>

        {/* Form panel */}
        <main className="flex items-start md:items-center justify-center px-5 py-10 md:px-12 md:py-16 lg:px-20">
          <div className="w-full max-w-md bg-[#131313] p-8 md:p-12 border border-[#4d4635]/40 shadow-[0_24px_60px_rgba(0,0,0,0.6)] relative">
            {/* Invitation Accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#f2ca50]/40 -translate-x-px -translate-y-px" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#f2ca50]/40 translate-x-px -translate-y-px" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#f2ca50]/40 -translate-x-px translate-y-px" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#f2ca50]/40 translate-x-px translate-y-px" />
            
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#4d4635]/40 px-5 md:px-12 py-5 md:py-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <span className="se-label text-[9px] tracking-[0.32em] text-[#574500]">
          © Saga Elite · Colombo · MMXXVI
        </span>
        <div className="flex flex-wrap items-center gap-3 se-label text-[9px] tracking-[0.3em] text-[#99907c]">
          <Link to="/legal/privacy-policy" className="hover:text-[#f2ca50]">Privacy</Link>
          <span className="text-[#4d4635]">·</span>
          <Link to="/legal/terms-and-conditions" className="hover:text-[#f2ca50]">Terms</Link>
          <span className="text-[#4d4635]">·</span>
          <Link to="/contact" className="hover:text-[#f2ca50]">Contact atelier</Link>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
