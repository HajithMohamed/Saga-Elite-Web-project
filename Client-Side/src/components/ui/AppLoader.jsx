import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

/**
 * AppLoader — full-viewport editorial loader for transient auth/data checks.
 * Used by App.jsx while `state.auth.isLoading` is true on initial mount.
 *
 * Cursor-reactive: a soft gold spotlight follows the mouse, a custom
 * editorial crosshair (with mono coordinates) replaces the default cursor,
 * and the centre logo tilts in 3D toward the pointer.
 */
export default function AppLoader({ message = "Opening the atelier" }) {
  const reduced = useReducedMotion();
  const containerRef = useRef(null);

  // Raw motion values for the cursor (no smoothing, anchored to viewport)
  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);

  // Smoothed values for parallax (lighter spring) and cursor (slightly bouncy)
  const smoothMx = useSpring(mx, { stiffness: 280, damping: 32, mass: 0.4 });
  const smoothMy = useSpring(my, { stiffness: 280, damping: 32, mass: 0.4 });

  const [hasMoved, setHasMoved] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  // Listen for cursor movement
  useEffect(() => {
    if (reduced) return;
    const handle = (e) => {
      mx.set(e.clientX);
      my.set(e.clientY);
      if (!hasMoved) setHasMoved(true);
    };
    const handleLeave = () => {
      mx.set(-100);
      my.set(-100);
    };
    window.addEventListener("mousemove", handle);
    window.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handle);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, [mx, my, hasMoved, reduced]);

  // Throttled state update for the editorial coordinate display (~12fps)
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setCoords({
        x: Math.max(0, Math.round(mx.get())),
        y: Math.max(0, Math.round(my.get())),
      });
    }, 80);
    return () => clearInterval(id);
  }, [mx, my, reduced]);

  // Logo parallax — viewport-relative tilt range
  const winW = typeof window !== "undefined" ? window.innerWidth : 1200;
  const winH = typeof window !== "undefined" ? window.innerHeight : 800;
  const rotateY = useTransform(smoothMx, [0, winW], [-9, 9]);
  const rotateX = useTransform(smoothMy, [0, winH], [6, -6]);
  const logoTranslateX = useTransform(smoothMx, [0, winW], [-6, 6]);
  const logoTranslateY = useTransform(smoothMy, [0, winH], [-6, 6]);

  // Spotlight gradient — uses the smoothed values directly
  const spotlightBg = useTransform(
    [smoothMx, smoothMy],
    ([x, y]) =>
      `radial-gradient(circle 480px at ${x}px ${y}px, rgba(242,202,80,0.16) 0%, rgba(242,202,80,0.06) 35%, transparent 70%)`
  );

  // Crosshair coordinate string — formatted as 4-digit padded mono
  const padX = String(coords.x).padStart(4, "0");
  const padY = String(coords.y).padStart(4, "0");

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-page flex items-center justify-center overflow-hidden"
      style={{ cursor: hasMoved && !reduced ? "none" : "default" }}
    >
      {/* Cursor spotlight — large soft gold halo that follows the mouse */}
      {!reduced && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: spotlightBg,
            opacity: hasMoved ? 1 : 0,
            transition: "opacity 0.5s ease-out",
          }}
        />
      )}

      {/* Soft ambient gold gradient — base layer behind spotlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(242,202,80,0.06) 0%, rgba(212,175,55,0.02) 35%, rgba(7,7,7,0) 65%)",
        }}
      />

      {/* Subtle grain */}
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
        className="absolute top-6 md:top-10 left-6 md:left-10 right-6 md:right-10 h-px bg-ivory/15 origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.7, delay: 0.05, ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.div
        className="absolute bottom-6 md:bottom-10 left-6 md:left-10 right-6 md:right-10 h-px bg-ivory/15 origin-right"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.div
        className="absolute top-6 md:top-10 bottom-6 md:bottom-10 left-6 md:left-10 w-px bg-ivory/12 origin-top"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.div
        className="absolute top-6 md:top-10 bottom-6 md:bottom-10 right-6 md:right-10 w-px bg-ivory/12 origin-bottom"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.8, delay: 0.25, ease: [0.65, 0, 0.35, 1] }}
      />

      {/* Top-left chapter mark */}
      <motion.div
        className="absolute top-10 md:top-14 left-10 md:left-14 se-label text-[10px] tracking-[0.42em] text-goldshadow z-10"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        EST · MMXXVI · COLOMBO
      </motion.div>

      {/* Top-right cursor coordinate readout */}
      {!reduced && (
        <motion.div
          className="absolute top-10 md:top-14 right-10 md:right-14 z-10 flex items-center gap-3 se-mono text-[10px] tabular-nums text-goldshadow"
          initial={{ opacity: 0 }}
          animate={{ opacity: hasMoved ? 1 : 0.4 }}
          transition={{ duration: 0.4 }}
        >
          <span>X · {padX}</span>
          <span className="text-line">/</span>
          <span>Y · {padY}</span>
          <span
            className="w-1.5 h-1.5 rounded-full bg-gold"
            style={{ opacity: hasMoved ? 1 : 0.3 }}
          />
        </motion.div>
      )}

      {/* Centre stage */}
      <div className="relative z-10 flex flex-col items-center gap-7 px-6 text-center">
        {/* Pulsing halo */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            width: 320,
            height: 320,
            background:
              "radial-gradient(circle, rgba(242,202,80,0.32) 0%, rgba(242,202,80,0.10) 40%, transparent 70%)",
            filter: "blur(40px)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={
            reduced
              ? { opacity: 0.55, scale: 1 }
              : { opacity: [0.4, 0.7, 0.4], scale: [0.95, 1.05, 0.95] }
          }
          transition={
            reduced
              ? { duration: 0.5 }
              : { duration: 4, ease: "easeInOut", repeat: Infinity }
          }
        />

        {/* Logo — entrance fade + breathing + cursor parallax */}
        <motion.div
          className="relative z-10"
          style={{
            perspective: 800,
            transformStyle: "preserve-3d",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={
              reduced
                ? undefined
                : {
                    rotateX,
                    rotateY,
                    x: logoTranslateX,
                    y: logoTranslateY,
                    transformStyle: "preserve-3d",
                  }
            }
          >
            <motion.img
              src="/LOGO.png"
              alt="Saga Elite"
              draggable={false}
              className="select-none pointer-events-none"
              style={{
                width: 130,
                height: 130,
                objectFit: "contain",
                filter: "drop-shadow(0 8px 32px rgba(242,202,80,0.18))",
              }}
              animate={
                reduced
                  ? {}
                  : { y: [0, -4, 0], scale: [1, 1.02, 1] }
              }
              transition={
                reduced
                  ? {}
                  : { duration: 3.5, ease: "easeInOut", repeat: Infinity }
              }
            />
          </motion.div>
        </motion.div>

        {/* Wordmark */}
        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="se-wordmark text-ink text-2xl tracking-[0.18em]">
            Saga Elite
          </span>
          <span className="se-label text-[10px] tracking-[0.32em] text-muted">
            Rare fit, forever
          </span>
        </motion.div>

        {/* Indeterminate progress line */}
        <motion.div
          className="relative h-px w-44 bg-line overflow-hidden mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          {!reduced && (
            <motion.div
              className="absolute inset-y-0 left-0 w-1/3 bg-gold"
              animate={{ x: ["-100%", "300%"] }}
              transition={{
                duration: 1.6,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
          )}
          {reduced && (
            <span className="absolute inset-0 bg-gold opacity-70" />
          )}
        </motion.div>

        {/* Status */}
        <motion.div
          className="flex items-center gap-2 se-label text-[10px] tracking-[0.32em] text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-gold"
            animate={!reduced ? { opacity: [1, 0.3, 1] } : {}}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          {message}
        </motion.div>
      </div>

      {/* Bottom-right tracking */}
      <motion.div
        className="absolute bottom-10 md:bottom-14 right-10 md:right-14 se-mono text-[10px] text-goldshadow z-10 tabular-nums"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        CHAPTER · XIV
      </motion.div>

      {/* Editorial cursor crosshair — replaces the default mouse pointer */}
      {!reduced && (
        <motion.div
          className="absolute top-0 left-0 pointer-events-none z-[110]"
          style={{
            x: smoothMx,
            y: smoothMy,
            opacity: hasMoved ? 1 : 0,
            transition: "opacity 0.3s ease-out",
          }}
        >
          {/* Centre dot */}
          <motion.span
            className="absolute block w-1 h-1 rounded-full bg-gold"
            style={{
              top: 0,
              left: 0,
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 8px rgba(242,202,80,0.6)",
            }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Outer ring */}
          <motion.span
            className="absolute block rounded-full border border-gold-ink/40"
            style={{
              top: 0,
              left: 0,
              width: 32,
              height: 32,
              transform: "translate(-50%, -50%)",
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* 4 hairline arms — top, right, bottom, left */}
          <span
            className="absolute block bg-gold/55"
            style={{ top: -22, left: 0, width: 1, height: 14, transform: "translate(-50%, 0)" }}
          />
          <span
            className="absolute block bg-gold/55"
            style={{ top: 0, left: 22, width: 14, height: 1, transform: "translate(0, -50%)" }}
          />
          <span
            className="absolute block bg-gold/55"
            style={{ top: 8, left: 0, width: 1, height: 14, transform: "translate(-50%, 0)" }}
          />
          <span
            className="absolute block bg-gold/55"
            style={{ top: 0, left: -22, width: 14, height: 1, transform: "translate(0, -50%)" }}
          />
          {/* Tracking label off to bottom-right of cursor */}
          <span
            className="absolute se-label text-[9px] tracking-[0.28em] text-gold-ink whitespace-nowrap"
            style={{ top: 18, left: 18 }}
          >
            TRACKING
          </span>
        </motion.div>
      )}
    </div>
  );
}
