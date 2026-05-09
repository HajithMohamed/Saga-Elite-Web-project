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
    <section className="bg-[#0a0a0a] py-16 md:py-24 border-y border-[#1a1a1a]">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#f2ca50] mb-3">
            Timeline
          </p>
          <h2 className="font-display text-[28px] md:text-[40px] uppercase text-[#FAF7F2] leading-none">
            The chapter, in three beats
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-0 right-0 top-6 h-px bg-[#1f1f1f] hidden md:block" />
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{
              scaleX:
                steps.filter((s) => s.passed).length / Math.max(1, steps.length - 1),
            }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "left" }}
            className="absolute left-0 right-0 top-6 h-px bg-[#f2ca50] hidden md:block"
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
                  className={`relative w-12 h-12 flex items-center justify-center border-2 rounded-full transition-all bg-[#0a0a0a] ${
                    step.passed
                      ? "border-[#f2ca50]"
                      : step.active
                        ? "border-[#f2ca50] animate-pulse"
                        : "border-[#4d4635]"
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
                      className="text-[#f2ca50]"
                    />
                  ) : (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        step.active ? "bg-[#f2ca50]" : "bg-[#4d4635]"
                      }`}
                    />
                  )}
                </div>

                <p
                  className={`mt-5 font-mono text-[10px] tracking-[0.32em] uppercase ${
                    step.passed || step.active
                      ? "text-[#f2ca50]"
                      : "text-[#574500]"
                  }`}
                >
                  {step.label}
                </p>
                {step.date ? (
                  <p
                    className={`mt-2 font-sans text-xs ${
                      step.passed || step.active
                        ? "text-[#d0c5af]"
                        : "text-[#574500]"
                    }`}
                  >
                    {step.date}
                  </p>
                ) : (
                  <p className="mt-2 font-sans text-xs text-[#574500]">—</p>
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
