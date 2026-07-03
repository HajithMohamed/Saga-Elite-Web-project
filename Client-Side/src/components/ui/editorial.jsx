import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertCircle, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// resolveColor — shared color name → hex resolver (also re-exported from
// VariantSelectors for back-compat).
// ─────────────────────────────────────────────────────────────────────────────
const COLOR_VALUE_MAP = {
  black: "#111111",
  white: "#f5f5f5",
  ivory: "#fff8e7",
  cream: "#f4ead3",
  beige: "#d6c3a5",
  tan: "#c19a6b",
  brown: "#6f4e37",
  gold: "#d4af37",
  silver: "#c0c0c0",
  gray: "#808080",
  grey: "#808080",
  charcoal: "#36454f",
  slate: "#708090",
  navy: "#1f3a5f",
  blue: "#2563eb",
  sky: "#38bdf8",
  green: "#15803d",
  olive: "#556b2f",
  red: "#dc2626",
  maroon: "#800000",
  burgundy: "#800020",
  pink: "#ec4899",
  rose: "#f43f5e",
  purple: "#7c3aed",
  yellow: "#eab308",
  orange: "#f97316",
  sand: "#c2b280",
  stone: "#a8a29e",
  offwhite: "#f8f4e8",
  "off-white": "#f8f4e8",
  "off white": "#f8f4e8",
};

export function resolveColor(name = "") {
  const v = String(name || "").trim().toLowerCase();
  if (!v) return "#9ca3af";
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return v;
  return COLOR_VALUE_MAP[v] || name || "#9ca3af";
}

// ─────────────────────────────────────────────────────────────────────────────
// FieldError — animated inline form error. Replaces native HTML5 tooltips.
//   Use under any input. Pass `children` (the message) or null to hide.
// ─────────────────────────────────────────────────────────────────────────────
export function FieldError({ children, className = "" }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {children ? (
        <motion.div
          key={String(children)}
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={cn("overflow-hidden", className)}
          role="alert"
          aria-live="polite"
        >
          <div className="mt-2 flex items-start gap-2 se-body text-xs text-[#ffb4ab] leading-relaxed">
            <AlertCircle
              size={12}
              strokeWidth={1.75}
              className="mt-[2px] shrink-0"
              aria-hidden="true"
            />
            <span>{children}</span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reveal — opacity + translateY on scroll. Respects reduced motion.
// ─────────────────────────────────────────────────────────────────────────────
export function Reveal({ children, delay = 0, y = 24, className = "", as = "div" }) {
  const reduced = useReducedMotion();
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: reduced ? 0.2 : 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Eyebrow — uppercase tracked label
// ─────────────────────────────────────────────────────────────────────────────
export function Eyebrow({ children, tone = "gold", className = "", size = "sm" }) {
  const color =
    tone === "gold" ? "text-[#f2ca50]"
    : tone === "muted" ? "text-[#99907c]"
    : tone === "invert" ? "text-[#1b1c1c]"
    : "text-[#d0c5af]";
  const sz =
    size === "xs" ? "text-[10px] tracking-[0.3em]"
    : size === "sm" ? "text-[11px] tracking-[0.28em]"
    : "text-xs tracking-[0.32em]";
  return <span className={cn("se-label", color, sz, className)}>{children}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hairline — full-bleed 1px rule
// ─────────────────────────────────────────────────────────────────────────────
export function Hairline({ tone = "variant", className = "" }) {
  const bg =
    tone === "soft" ? "bg-white/10"
    : tone === "strong" ? "bg-[#99907c]"
    : "bg-[#4d4635]";
  return <div className={cn("h-px w-full", bg, className)} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Marquee — horizontal infinite ticker
// ─────────────────────────────────────────────────────────────────────────────
export function Marquee({ items, speed = 28, className = "", tone = "dark", sep = "·" }) {
  const track = items.concat(items);
  const bg =
    tone === "gold" ? "bg-[#f2ca50] text-[#1b1c1c]"
    : tone === "invert" ? "bg-[#e5e2e1] text-[#131313]"
    : "bg-[#0e0e0e] text-[#d0c5af]";
  return (
    <div className={cn("relative overflow-hidden", bg, className)}>
      <div className="flex whitespace-nowrap homepage-marquee-track" style={{ animationDuration: `${speed}s` }}>
        {track.map((t, i) => (
          <span key={i} className="se-label text-[10px] tracking-[0.3em] px-6 py-2 inline-flex items-center gap-6">
            {t}<span className="opacity-40">{sep}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Countdown — DD : HH : MM : SS hairline-divided. Editorial or compact.
// ─────────────────────────────────────────────────────────────────────────────
export function useCountdown(target) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const tgt = target instanceof Date ? target.getTime() : Number(target) || 0;
  const diff = Math.max(0, tgt - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s, expired: tgt > 0 && diff === 0 };
}

const pad2 = (n) => String(n).padStart(2, "0");

export function Countdown({ target, variant = "editorial", showSeconds = true, eyebrow }) {
  const c = useCountdown(target);
  const baseUnits = showSeconds
    ? [["DAYS", c.d], ["HRS", c.h], ["MIN", c.m], ["SEC", c.s]]
    : [["DAYS", c.d], ["HRS", c.h], ["MIN", c.m]];

  if (c.expired) {
    return (
      <span className="se-instrument text-base text-[#99907c]">The chapter has passed.</span>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 se-mono text-sm text-[#e5e2e1]">
        {baseUnits.flatMap(([lbl, v], i) => {
          const out = [];
          if (i > 0) out.push(<span key={`${lbl}-sep`} className="text-[#4d4635]">:</span>);
          out.push(<span key={`${lbl}-v`} className="tabular-nums">{pad2(v)}</span>);
          out.push(
            <span key={`${lbl}-l`} className="se-label text-[9px] text-[#99907c] tracking-[0.3em]">
              {lbl}
            </span>
          );
          return out;
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {eyebrow && <Eyebrow tone="gold" size="md">{eyebrow}</Eyebrow>}
      <div className="flex items-stretch gap-0">
        {baseUnits.flatMap(([lbl, v], i) => {
          const out = [];
          if (i > 0)
            out.push(<div key={`${lbl}-sep`} className="w-px self-stretch bg-[#4d4635] mx-3 sm:mx-5" />);
          out.push(
            <div key={`${lbl}-cell`} className="flex flex-col items-start">
              <span className="se-serif text-4xl sm:text-5xl leading-none tabular-nums text-[#e5e2e1]">
                {pad2(v)}
              </span>
              <span className="se-label text-[10px] tracking-[0.3em] text-[#99907c] mt-2">{lbl}</span>
            </div>
          );
          return out;
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge — 17 frozen states; hairline pill
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  pending:               { bg: "rgba(217,165,80,.12)",  text: "#f2ca50", border: "rgba(217,165,80,.5)",  label: "Pending" },
  pending_payment:       { bg: "rgba(217,165,80,.12)",  text: "#f2ca50", border: "rgba(217,165,80,.5)",  label: "Awaiting payment" },
  verification_pending:  { bg: "rgba(125,165,210,.10)", text: "#a8c8ec", border: "rgba(125,165,210,.4)", label: "In verification" },
  confirmed:             { bg: "rgba(120,180,200,.12)", text: "#a4d2e2", border: "rgba(120,180,200,.4)", label: "Confirmed" },
  shipped:               { bg: "rgba(120,180,200,.12)", text: "#a4d2e2", border: "rgba(120,180,200,.4)", label: "Shipped" },
  delivered:             { bg: "rgba(110,180,140,.12)", text: "#a8d8b6", border: "rgba(110,180,140,.4)", label: "Delivered" },
  cancelled:             { bg: "rgba(180,180,180,.10)", text: "#c8c6c6", border: "rgba(180,180,180,.3)", label: "Cancelled" },
  active:                { bg: "rgba(110,180,140,.12)", text: "#a8d8b6", border: "rgba(110,180,140,.4)", label: "Active" },
  inactive:              { bg: "rgba(180,180,180,.10)", text: "#c8c6c6", border: "rgba(180,180,180,.3)", label: "Inactive" },
  approved:              { bg: "rgba(110,180,140,.12)", text: "#a8d8b6", border: "rgba(110,180,140,.4)", label: "Approved" },
  rejected:              { bg: "rgba(255,180,171,.10)", text: "#ffb4ab", border: "rgba(255,180,171,.4)", label: "Rejected" },
  live:                  { bg: "rgba(217,165,80,.18)",  text: "#ffe088", border: "#d4af37",              label: "Live" },
  published:             { bg: "rgba(110,180,140,.12)", text: "#a8d8b6", border: "rgba(110,180,140,.4)", label: "Published" },
  draft:                 { bg: "rgba(180,180,180,.10)", text: "#c8c6c6", border: "rgba(180,180,180,.3)", label: "Draft" },
  archived:              { bg: "rgba(120,120,120,.10)", text: "#99907c", border: "rgba(120,120,120,.3)", label: "Archived" },
  suspended:             { bg: "rgba(217,165,80,.10)",  text: "#f2ca50", border: "rgba(217,165,80,.4)",  label: "Suspended" },
  banned:                { bg: "rgba(255,180,171,.10)", text: "#ffb4ab", border: "rgba(255,180,171,.4)", label: "Banned" },
};

export function StatusBadge({ status, label }) {
  const key = String(status || "").trim().toLowerCase().replace(/\s+/g, "_");
  const s = STATUS_STYLES[key] || STATUS_STYLES.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 se-label text-[10px] tracking-[0.18em] border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: s.text }} />
      {label || s.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Btn — editorial-luxury button. Six variants × four sizes.
// ─────────────────────────────────────────────────────────────────────────────
export function Btn({
  variant = "default",
  size = "default",
  className = "",
  children,
  icon: Icon,
  iconRight: IconR,
  type = "button",
  ...rest
}) {
  const base =
    "inline-flex items-center justify-center gap-2 se-label tracking-[0.18em] transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] se-focus disabled:opacity-50 disabled:pointer-events-none";
  const sizes = {
    default: "h-11 px-6 text-[11px]",
    sm: "h-9 px-4 text-[10px]",
    lg: "h-14 px-8 text-xs",
    icon: "h-11 w-11 p-0 text-[11px]",
  };
  const variants = {
    default: "bg-[#f2ca50] text-[#3c2f00] hover:bg-[#ffe088] border border-[#e9c349]",
    outline: "bg-transparent text-[#e5e2e1] border border-[#4d4635] hover:bg-[#1c1b1b] hover:border-[#99907c]",
    ghost: "bg-transparent text-[#d0c5af] hover:bg-[#1c1b1b] hover:text-[#e5e2e1] border border-transparent",
    secondary: "bg-[#2a2a2a] text-[#e5e2e1] border border-[#353534] hover:bg-[#353534]",
    destructive: "bg-[#93000a] text-[#ffdad6] border border-[#93000a] hover:bg-[#690005]",
    link: "bg-transparent text-[#f2ca50] border-b border-[#4d4635] hover:border-[#f2ca50] rounded-none px-0",
    invert: "bg-[#e5e2e1] text-[#131313] border border-[#e5e2e1] hover:bg-white",
  };
  const cls = cn(
    base,
    sizes[size],
    variants[variant],
    variant === "link" ? "" : "rounded-sm",
    className
  );
  return (
    <motion.button type={type} className={cls} whileTap={{ scale: 0.95 }} {...rest}>
      {Icon && <Icon size={14} strokeWidth={1.5} />}
      <span>{children}</span>
      {IconR && <IconR size={14} strokeWidth={1.5} />}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Img — editorial framed with optional caption, hover-grayscale, fallback
// ─────────────────────────────────────────────────────────────────────────────
export function Img({
  src,
  alt = "",
  caption,
  ratio = "4/5",
  className = "",
  frame = false,
  hoverFade = false,
}) {
  const [err, setErr] = useState(false);
  return (
    <figure className={cn("relative", className)}>
      <motion.div
        whileHover="hover"
        className={cn(
          "relative w-full overflow-hidden",
          frame && "border border-[#4d4635]"
        )}
        style={{ aspectRatio: ratio }}
      >
        {!err && src ? (
          <motion.img
            src={src}
            alt={alt}
            onError={() => setErr(true)}
            variants={{ hover: { scale: 1.05 } }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={cn(
              "w-full h-full object-cover",
              hoverFade && "transition-[filter] duration-[600ms] group-hover:grayscale"
            )}
            loading="lazy"
          />
        ) : (
          <div className="se-img-fallback w-full h-full">
            <span className="se-label text-[10px] tracking-[0.3em]">image pending</span>
          </div>
        )}
      </motion.div>
      {caption && (
        <figcaption className="mt-2 se-label text-[10px] tracking-[0.3em] text-[#d0c5af]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PullQuote — tracked between hairlines
// ─────────────────────────────────────────────────────────────────────────────
export function PullQuote({ children, attribution, className = "" }) {
  return (
    <div className={cn("py-10", className)}>
      <Hairline tone="strong" />
      <blockquote className="se-serif text-2xl sm:text-3xl md:text-4xl leading-snug text-[#e5e2e1] py-8 max-w-3xl">
        “{children}”
      </blockquote>
      {attribution && <Eyebrow tone="muted" size="xs">— {attribution}</Eyebrow>}
      <Hairline tone="strong" className="mt-8" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AnimatedLogo — compact solar-system logo, embeddable on any page.
//   Center: Saga Elite logo (breathing + halo).
//   Around it: 3 orbits, each with a small planet, slow rotation.
//   `diameter`: total visual diameter in px (defaults to 380).
//   `src`: image source (defaults to /LOGO.png).
//   `eyebrow` / `caption`: optional editorial labels above + below the logo.
// ─────────────────────────────────────────────────────────────────────────────
function PlanetDot({ size = 4, color = "#f2ca50", glow = false }) {
  return (
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
}

function PlanetWithRing({ size = 8, color = "#d4af37" }) {
  return (
    <span
      className="relative block rounded-full"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 30% 30%, #ffe088 0%, #f2ca50 45%, #d4af37 100%)",
      }}
    >
      <span
        className="absolute rounded-full"
        style={{
          width: size * 2.4,
          height: size * 0.55,
          border: `1px solid ${color}80`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(-22deg)",
        }}
      />
    </span>
  );
}

function PlanetWithMoon({ planetSize = 6, moonOrbit = 13 }) {
  return (
    <span
      className="relative block"
      style={{ width: planetSize, height: planetSize }}
    >
      <span
        className="block rounded-full"
        style={{
          width: planetSize,
          height: planetSize,
          background:
            "radial-gradient(circle at 30% 30%, #ffe088 0%, #d4af37 60%, #735c00 100%)",
        }}
      />
      <motion.span
        className="absolute"
        style={{ top: "50%", left: "50%", width: 0, height: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4.5, ease: "linear", repeat: Infinity }}
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
}

function MiniOrbit({
  radius,
  duration,
  startAngle = 0,
  reverse = false,
  pathOpacity = 0.10,
  counterRotate = false,
  children,
}) {
  return (
    <>
      <div
        className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
        style={{
          width: radius * 2,
          height: radius * 2,
          marginLeft: -radius,
          marginTop: -radius,
          border: `1px dashed rgba(242, 202, 80, ${pathOpacity})`,
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2"
        style={{ width: 0, height: 0 }}
        initial={{ rotate: startAngle }}
        animate={{ rotate: startAngle + (reverse ? -360 : 360) }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        <div
          className="absolute"
          style={{ left: radius, top: 0, transform: "translate(-50%, -50%)" }}
        >
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
}

export function AnimatedLogo({
  diameter = 380,
  src = "/LOGO.png",
  alt = "Saga Elite",
  eyebrow,
  caption,
  className = "",
}) {
  const reduced = useReducedMotion();
  const sysRadius = diameter / 2 - 12;
  const logoSize = Math.min(160, diameter * 0.36);
  const innerStart = logoSize / 2 + 22;
  const span = Math.max(0, sysRadius - innerStart);

  const orbits = [
    {
      key: "mercury",
      radius: innerStart + span * 0.18,
      duration: 14,
      startAngle: 30,
      planet: <PlanetDot size={3.5} color="#f2ca50" />,
    },
    {
      key: "venus",
      radius: innerStart + span * 0.50,
      duration: 30,
      startAngle: 150,
      planet: <PlanetWithMoon planetSize={6} moonOrbit={12} />,
    },
    {
      key: "saturn",
      radius: innerStart + span * 0.92,
      duration: 60,
      startAngle: 250,
      counterRotate: true,
      planet: <PlanetWithRing size={9} color="#d4af37" />,
    },
  ];

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: diameter, height: diameter, maxWidth: "100%" }}
    >
      {/* Orbits + planets */}
      {!reduced &&
        orbits.map((o) => (
          <MiniOrbit
            key={o.key}
            radius={o.radius}
            duration={o.duration}
            startAngle={o.startAngle}
            counterRotate={o.counterRotate}
          >
            {o.planet}
          </MiniOrbit>
        ))}

      {/* Static snapshot under reduced-motion */}
      {reduced &&
        orbits.map((o) => {
          const rad = (o.startAngle * Math.PI) / 180;
          const x = Math.cos(rad) * o.radius;
          const y = Math.sin(rad) * o.radius;
          return (
            <React.Fragment key={o.key}>
              <div
                className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
                style={{
                  width: o.radius * 2,
                  height: o.radius * 2,
                  marginLeft: -o.radius,
                  marginTop: -o.radius,
                  border: "1px dashed rgba(242,202,80,0.10)",
                }}
              />
              <div
                className="absolute"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                }}
              >
                {o.planet}
              </div>
            </React.Fragment>
          );
        })}

      {/* Pulsing halo behind the logo */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: diameter * 0.7,
          height: diameter * 0.7,
          background:
            "radial-gradient(circle, rgba(242,202,80,0.32) 0%, rgba(242,202,80,0.10) 40%, transparent 70%)",
          filter: "blur(36px)",
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={
          reduced
            ? { opacity: 0.55, scale: 1 }
            : { opacity: [0.4, 0.7, 0.4], scale: [0.95, 1.05, 0.95] }
        }
        transition={
          reduced
            ? { duration: 0.8, ease: "easeOut" }
            : { duration: 6, ease: "easeInOut", repeat: Infinity }
        }
      />

      {/* The logo (sun) */}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.85, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.img
          src={src}
          alt={alt}
          draggable={false}
          className="select-none pointer-events-none"
          style={{
            width: logoSize,
            height: logoSize,
            objectFit: "contain",
            filter: "drop-shadow(0 8px 32px rgba(242,202,80,0.18))",
          }}
          animate={
            reduced
              ? {}
              : {
                  y: [0, -5, 0],
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

      {/* Optional eyebrow above the logo (positioned absolutely outside the orbital area) */}
      {eyebrow && (
        <motion.div
          className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full"
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          <Eyebrow tone="muted" size="xs">{eyebrow}</Eyebrow>
        </motion.div>
      )}

      {/* Optional caption below */}
      {caption && (
        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full whitespace-nowrap"
          initial={{ opacity: 0, y: -6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
        >
          <span className="se-label text-[10px] tracking-[0.32em] text-[#99907c]">
            {caption}
          </span>
        </motion.div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Wordmark — Saga Elite lockup
// ─────────────────────────────────────────────────────────────────────────────
export function Wordmark({ size = "md", tone = "light", tagline = false, className = "" }) {
  const t = size === "sm" ? "text-[15px]" : size === "lg" ? "text-[28px]" : "text-[19px]";
  const c = tone === "dark" ? "text-[#131313]" : "text-[#e5e2e1]";
  return (
    <div className={cn("flex flex-col items-start leading-none", className)}>
      <span className={cn("se-wordmark", t, c)}>Saga Elite</span>
      {tagline && (
        <span
          className={cn(
            "se-label text-[10px] mt-1.5",
            tone === "dark" ? "text-[#574500]" : "text-[#99907c]"
          )}
          style={{ letterSpacing: "0.18em" }}
        >
          Rare fit, forever
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ColorSwatch — circular color picker with selected ring + check, OOS strike
// ─────────────────────────────────────────────────────────────────────────────
export function ColorSwatch({
  color,
  selected = false,
  disabled = false,
  onClick,
  label,
  size = 32,
  className = "",
}) {
  const fill = resolveColor(color);
  const labelText = label || color || "color";
  // Expand the tap target to ≥44px (WCAG 2.5.5 / brand 48px guideline) for the
  // larger PDP swatches, without bloating the compact in-card previews — those
  // stay at their visual size (<24px → hit area = visual size). The visual
  // swatch (border/ring/dot) lives on an inner span so the larger hit area is
  // transparent and invisible.
  const hitArea = size >= 24 ? Math.max(size, 44) : size;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`Select color ${labelText}`}
      title={labelText}
      className={cn(
        "group relative inline-flex items-center justify-center rounded-full",
        "se-focus disabled:cursor-not-allowed",
        className
      )}
      style={{ minWidth: hitArea, minHeight: hitArea }}
    >
      <span
        className={cn(
          "relative flex items-center justify-center rounded-full border transition-all",
          selected
            ? "border-[#f2ca50] ring-2 ring-[#f2ca50] ring-offset-2 ring-offset-[#0a0a0a]"
            : "border-[#4d4635] group-hover:border-[#99907c]",
          disabled && !selected && "opacity-35"
        )}
        style={{ width: size, height: size }}
      >
        <span
          className="block rounded-full"
          style={{
            width: size - 8,
            height: size - 8,
            background: fill,
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.2)",
          }}
        />
        {selected && (
          <span
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden="true"
          >
            <Check
              size={Math.max(10, Math.floor(size * 0.42))}
              strokeWidth={2.25}
              className="text-[#0a0a0a] mix-blend-difference"
              style={{ filter: "drop-shadow(0 0 2px rgba(255,255,255,0.6))" }}
            />
          </span>
        )}
        {disabled && !selected && (
          <span
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                "linear-gradient(45deg, transparent 47%, rgba(229,226,225,0.7) 47%, rgba(229,226,225,0.7) 53%, transparent 53%)",
              borderRadius: "50%",
            }}
          />
        )}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SizeChip — hairline-bordered size chip, invert when selected, strike when OOS
// ─────────────────────────────────────────────────────────────────────────────
export function SizeChip({
  value,
  selected = false,
  disabled = false,
  onClick,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-disabled={disabled}
      className={cn(
        "min-w-12 h-12 px-4 se-mono text-sm border transition-colors se-focus",
        "disabled:cursor-not-allowed",
        selected
          ? "bg-[#e5e2e1] text-[#131313] border-[#e5e2e1]"
          : disabled
            ? "bg-transparent text-[#99907c] border-[#4d4635] line-through"
            : "bg-transparent text-[#d0c5af] border-[#4d4635] hover:bg-[#1c1b1b] hover:border-[#99907c] hover:text-[#e5e2e1]",
        className
      )}
    >
      {value}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SortDropdown — hairline-bordered listbox replacing native <select>
//   Keyboard: Tab/Enter open, Arrow keys navigate, Enter select, Escape close.
// ─────────────────────────────────────────────────────────────────────────────
export function SortDropdown({
  options = [],
  value,
  onChange,
  label = "Sort",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(0);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const idx = Math.max(0, options.findIndex((o) => o.value === value));
    setHoverIdx(idx);
  }, [open, options, value]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (
        !triggerRef.current?.contains(e.target) &&
        !popoverRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const onTriggerKey = (e) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onPopoverKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHoverIdx((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHoverIdx((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onChange?.(options[hoverIdx]?.value);
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      setHoverIdx(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setHoverIdx(options.length - 1);
    }
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="h-10 px-4 inline-flex items-center gap-3 border border-[#4d4635] hover:border-[#99907c] bg-transparent se-label text-[10px] tracking-[0.18em] text-[#e5e2e1] transition-colors se-focus"
      >
        <span className="se-label text-[9px] tracking-[0.28em] text-[#99907c]">
          {label}
        </span>
        <span className="text-[#e5e2e1]">{selected?.label || "—"}</span>
        <ChevronDown
          size={12}
          strokeWidth={1.5}
          className={cn(
            "text-[#99907c] transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={popoverRef}
            role="listbox"
            tabIndex={-1}
            onKeyDown={onPopoverKey}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full right-0 mt-2 min-w-[200px] z-50 bg-[#0e0e0e] border border-[#4d4635] shadow-lg"
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              const isHover = i === hoverIdx;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHoverIdx(i)}
                  onClick={() => {
                    onChange?.(opt.value);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={cn(
                    "w-full h-10 px-4 flex items-center justify-between gap-4 text-left transition-colors",
                    "se-label text-[10px] tracking-[0.18em]",
                    isHover ? "bg-[#1c1b1b]" : "bg-[#0e0e0e]",
                    isSelected ? "text-[#f2ca50]" : "text-[#d0c5af]"
                  )}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <Check size={12} strokeWidth={1.75} className="text-[#f2ca50]" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FilterPills — hairline pill bar with animated underline on the active pill
// ─────────────────────────────────────────────────────────────────────────────
export function FilterPills({
  items = [],
  value,
  onChange,
  layoutId = "filter-pill",
  className = "",
}) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-stretch gap-px bg-[#4d4635]/40 p-px",
        className
      )}
      role="tablist"
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(item.value)}
            className={cn(
              "relative h-10 px-5 se-label text-[10px] tracking-[0.18em] transition-colors se-focus",
              active
                ? "bg-[#f2ca50] text-[#3c2f00]"
                : "bg-[#1c1b1b] text-[#d0c5af] hover:text-[#e5e2e1] hover:bg-[#2a2a2a]"
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute -bottom-px left-2 right-2 h-px bg-[#1b1c1c]"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Disclosure — hairline-top accordion row, height-collapse expand
// ─────────────────────────────────────────────────────────────────────────────
export function Disclosure({
  title,
  eyebrow,
  defaultOpen = false,
  children,
  className = "",
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={cn("border-t border-[#4d4635]/60 last:border-b last:border-[#4d4635]/60", className)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full py-5 flex items-center justify-between gap-4 text-left se-focus group"
      >
        <div className="flex flex-col gap-1">
          {eyebrow && <Eyebrow tone="muted" size="xs">{eyebrow}</Eyebrow>}
          <span className="se-headline text-[#e5e2e1] text-base md:text-lg">
            {title}
          </span>
        </div>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className={cn(
            "text-[#99907c] transition-transform group-hover:text-[#f2ca50]",
            open && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-6 se-body text-sm md:text-base text-[#d0c5af] leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Input — Dark luxury specific input
// ─────────────────────────────────────────────────────────────────────────────
export function Input({ className = "", error, ...props }) {
  return (
    <input
      className={cn(
        "bg-transparent border-b border-[#4d4635] text-[#e5e2e1] placeholder:text-[#99907c] focus:border-[#f2ca50] focus:ring-0 w-full outline-none py-2 se-body transition-colors",
        error && "border-b border-[#ffb4ab] text-[#ffb4ab]",
        className
      )}
      {...props}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SeFade — Staggered child animation
// ─────────────────────────────────────────────────────────────────────────────
export function SeFade({ children, y = 20, className = "" }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SeDivider — Specific layout divider
// ─────────────────────────────────────────────────────────────────────────────
export function SeDivider({ className = "" }) {
  return <div className={cn("h-px w-full bg-[#4d4635]", className)} />;
}

// Aliases for redesign brief compatibility
export const SePullQuote = PullQuote;
export const SeMarquee = Marquee;

// Standardized auth styles (used by auth pages)
export const AUTH_INPUT =
  "w-full bg-transparent border-b border-[#4d4635] focus:border-[#f2ca50] py-3 text-[#e5e2e1] placeholder:text-[#574500] outline-none se-body text-base transition-colors duration-200";

export const AUTH_PRIMARY_BTN =
  "w-full h-12 bg-[#f2ca50] hover:bg-[#ffe088] text-[#1b1c1c] se-label text-[11px] tracking-[0.28em] transition-colors disabled:opacity-50 disabled:pointer-events-none";
