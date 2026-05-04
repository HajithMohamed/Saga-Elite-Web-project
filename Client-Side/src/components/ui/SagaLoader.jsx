import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const SAGA = ["S", "A", "G", "A"];

export default function SagaLoader({ onDone, force = false }) {
  const reduced = useReducedMotion();
  const [show, setShow] = useState(true);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!force) {
      try {
        if (sessionStorage.getItem("saga-loaded")) {
          setShow(false);
          onDone && onDone();
          return;
        }
      } catch {}
    }
    if (reduced) {
      const t = setTimeout(() => {
        setShow(false);
        onDone && onDone();
      }, 300);
      return () => clearTimeout(t);
    }

    const seq = [
      [60, 1],
      [200, 2],
      [550, 3],
      [950, 4],
      [1350, 5],
      [2050, 6],
      [2300, 7],
    ];
    const timers = seq.map(([t, p]) => setTimeout(() => setPhase(p), t));
    const done = setTimeout(() => {
      try { sessionStorage.setItem("saga-loaded", "1"); } catch {}
      setShow(false);
      onDone && onDone();
    }, 2950);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, [reduced, force, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-auto overflow-hidden bg-[#070707]"
          exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeOut" } }}
        >
          {/* Wipe mask — clears upward, revealing the page beneath */}
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-[#070707] z-30 origin-bottom"
            initial={{ scaleY: 1 }}
            animate={phase >= 7 ? { scaleY: 0 } : { scaleY: 1 }}
            transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
            style={{ height: "100%" }}
          />

          {/* Vignette */}
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 45%, rgba(242,202,80,0.04) 0%, rgba(7,7,7,0) 55%)",
            }}
          />

          {/* Centre stage */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-20"
            animate={
              phase >= 6
                ? { y: -28, scale: 1.04, opacity: 0 }
                : { y: 0, scale: 1, opacity: 1 }
            }
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-col items-center gap-7 px-6 text-center">
              {/* Single point of light */}
              <motion.div
                className="absolute"
                initial={{ opacity: 0 }}
                animate={
                  phase >= 1 && phase < 3
                    ? { opacity: [0, 1, 0.4, 1, 0] }
                    : { opacity: 0 }
                }
                transition={{ duration: 0.9, times: [0, 0.2, 0.5, 0.8, 1], ease: "easeInOut" }}
              >
                <span
                  className="block w-1.5 h-1.5 rounded-full bg-[#f2ca50]"
                  style={{ boxShadow: "0 0 24px 4px rgba(242,202,80,0.5)" }}
                />
              </motion.div>

              {/* Top eyebrow */}
              <motion.div
                className="se-label text-[10px] tracking-[0.5em] text-[#99907c]"
                initial={{ opacity: 0, y: 6 }}
                animate={phase >= 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              >
                EST · MMXXVI · COLOMBO
              </motion.div>

              {/* Two hairlines drawing outward */}
              <div className="flex items-center justify-center" style={{ width: "min(420px, 80vw)" }}>
                <motion.div
                  className="h-px bg-[#4d4635] origin-right flex-1"
                  initial={{ scaleX: 0 }}
                  animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
                  transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }}
                />
                <motion.div
                  className="mx-3 w-1 h-1 rounded-full bg-[#f2ca50]"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
                <motion.div
                  className="h-px bg-[#4d4635] origin-left flex-1"
                  initial={{ scaleX: 0 }}
                  animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
                  transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }}
                />
              </div>

              {/* Wordmark — two-line lockup */}
              <div className="flex flex-col items-center gap-2">
                {/* Line 1: SAGA, letter-by-letter drop */}
                <div className="flex items-baseline gap-[0.18em] overflow-hidden">
                  {SAGA.map((ch, i) => (
                    <motion.span
                      key={i}
                      className="se-wordmark text-[#fafafa] inline-block"
                      style={{
                        fontSize: "clamp(48px, 8vw, 104px)",
                        lineHeight: 1,
                        letterSpacing: "0.18em",
                      }}
                      initial={{ y: "-110%", opacity: 0, filter: "blur(8px)" }}
                      animate={
                        phase >= 3
                          ? { y: "0%", opacity: 1, filter: "blur(0px)" }
                          : { y: "-110%", opacity: 0, filter: "blur(8px)" }
                      }
                      transition={{
                        duration: 0.7,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.08 * i,
                      }}
                    >
                      {ch}
                    </motion.span>
                  ))}
                </div>

                {/* Line 2: ELITE rises */}
                <div className="overflow-hidden">
                  <motion.div
                    className="se-instrument text-[#f2ca50]"
                    style={{
                      fontSize: "clamp(20px, 3vw, 36px)",
                      letterSpacing: "0.42em",
                      lineHeight: 1.2,
                      textTransform: "uppercase",
                    }}
                    initial={{ y: "120%", opacity: 0 }}
                    animate={phase >= 4 ? { y: "0%", opacity: 1 } : { y: "120%", opacity: 0 }}
                    transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                  >
                    ELITE
                  </motion.div>
                </div>
              </div>

              {/* Gold underline */}
              <motion.div
                className="h-px bg-[#f2ca50] origin-center"
                style={{ width: "min(180px, 50vw)" }}
                initial={{ scaleX: 0 }}
                animate={phase >= 5 ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
              />

              {/* Tagline */}
              <motion.div
                className="se-label text-[11px] text-[#d0c5af]"
                style={{ letterSpacing: "0.32em" }}
                initial={{ opacity: 0, y: 6 }}
                animate={phase >= 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.15 }}
              >
                RARE FIT FOREVER
              </motion.div>
            </div>
          </motion.div>

          {/* Bottom-right loading status */}
          <motion.div
            className="absolute right-6 bottom-6 z-25 flex items-center gap-2 se-mono text-[10px] text-[#574500]"
            initial={{ opacity: 0 }}
            animate={phase >= 1 && phase < 6 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            />
            Opening the atelier
          </motion.div>

          {/* Top-left chapter mark */}
          <motion.div
            className="absolute left-6 top-6 z-25 se-label text-[10px] tracking-[0.42em] text-[#574500]"
            initial={{ opacity: 0, x: -8 }}
            animate={phase >= 2 && phase < 6 ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            CHAPTER · XIV
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
