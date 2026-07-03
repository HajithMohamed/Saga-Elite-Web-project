import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

// 3-step timeline: ANNOUNCED → PUBLIC RELEASE → CLOSED.
// Drop model only stores releaseDate + endDate today; we treat
// drop.createdAt as the announce timestamp. Steps in the past
// render filled; the active step pulses; future steps are dim.
const formatDate = (d) => {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const DropTimeline = ({ drop }) => {
  if (!drop) return null;

  const now = Date.now();
  const announcedAt = drop.createdAt
    ? new Date(drop.createdAt).getTime()
    : null;
  const releaseAt = drop.releaseDate
    ? new Date(drop.releaseDate).getTime()
    : null;
  const endAt = drop.endDate ? new Date(drop.endDate).getTime() : null;

  const steps = [
    {
      key: "announced",
      label: "Drop Announced",
      date: formatDate(drop.createdAt),
      passed: announcedAt && announcedAt <= now,
      active: false,
    },
    {
      key: "release",
      label: "Public Release",
      date: formatDate(drop.releaseDate),
      passed: releaseAt && releaseAt <= now,
      active: releaseAt && releaseAt <= now && (!endAt || endAt > now),
    },
    {
      key: "closed",
      label: "Drop Closed",
      date: formatDate(drop.endDate),
      passed: endAt && endAt <= now,
      active: false,
    },
  ];

  return (
    <section className="bg-page py-16 md:py-24 border-y border-card">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-ink mb-3">
            Timeline
          </p>
          <h2 className="font-display text-[28px] md:text-[40px] uppercase text-ink leading-none">
            The chapter, in three beats
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-0 right-0 top-6 h-px bg-card hidden md:block" />
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{
              scaleX:
                steps.filter((s) => s.passed).length / Math.max(1, steps.length - 1),
            }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "left" }}
            className="absolute left-0 right-0 top-6 h-px bg-gold hidden md:block"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Node */}
                <div
                  className={`relative w-12 h-12 flex items-center justify-center border-2 rounded-full transition-all bg-page ${
                    step.passed
                      ? "border-gold-ink"
                      : step.active
                        ? "border-gold-ink animate-pulse"
                        : "border-line"
                  }`}
                  style={{
                    boxShadow: step.active
                      ? "0 0 16px rgba(242,202,80,0.5)"
                      : undefined,
                  }}
                >
                  {step.passed ? (
                    <Check
                      size={18}
                      strokeWidth={2.5}
                      className="text-gold-ink"
                    />
                  ) : (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        step.active ? "bg-gold" : "bg-line"
                      }`}
                    />
                  )}
                </div>

                <p
                  className={`mt-5 font-mono text-[10px] tracking-[0.32em] uppercase ${
                    step.passed || step.active
                      ? "text-gold-ink"
                      : "text-goldshadow"
                  }`}
                >
                  {step.label}
                </p>
                {step.date ? (
                  <p
                    className={`mt-2 font-sans text-xs ${
                      step.passed || step.active
                        ? "text-cream"
                        : "text-goldshadow"
                    }`}
                  >
                    {step.date}
                  </p>
                ) : (
                  <p className="mt-2 font-sans text-xs text-goldshadow">—</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DropTimeline;
