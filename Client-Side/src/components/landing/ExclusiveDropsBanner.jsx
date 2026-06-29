import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Compute a drop's lifecycle status + the relevant countdown target.
//  • Upcoming → counts down to releaseDate
//  • Live     → counts down to endDate (or no countdown if open-ended)
//  • Ended    → no countdown
const deriveDropState = (drop) => {
  const now = Date.now();
  const release = drop?.releaseDate ? new Date(drop.releaseDate).getTime() : null;
  const end = drop?.endDate ? new Date(drop.endDate).getTime() : null;

  if (release && release > now) {
    return { status: "Upcoming", tone: "upcoming", target: release };
  }
  if (end && end < now) {
    return { status: "Ended", tone: "ended", target: null };
  }
  return { status: "Live", tone: "live", target: end && end > now ? end : null };
};

const emptyTime = { days: 0, hours: 0, minutes: 0, seconds: 0 };

const computeTimeLeft = (target, now = Date.now()) => {
  if (!target) return null;
  const diff = target - now;
  if (diff <= 0) return emptyTime;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
};

// Prefer the dedicated 21:9 homepage banner (Image.type === "dropBanner"); fall
// back to the first drop image so older drops without a banner still render.
const pickBannerImage = (drop) => {
  const images = Array.isArray(drop?.images) ? drop.images : [];
  const banner = images.find((img) => img?.type === "dropBanner" && img?.url);
  return banner?.url || images[0]?.url || drop?.coverImageUrl || drop?.imageUrl || null;
};

const toneStyles = {
  upcoming: { dot: "bg-[#f2ca50]", text: "text-[#f2ca50]" },
  live: { dot: "bg-red-500 animate-pulse", text: "text-red-500" },
  ended: { dot: "bg-[#99907c]", text: "text-[#99907c]" },
};

function DropBanner({ drop }) {
  const state = deriveDropState(drop);
  // Tick `now` every second; derive the countdown during render. This keeps the
  // effect free of synchronous setState (no cascading renders).
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!state.target) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [state.target]);

  const timeLeft = state.target ? computeTimeLeft(state.target, now) : null;
  const dropImage = pickBannerImage(drop);
  const tone = toneStyles[state.tone] || toneStyles.upcoming;
  const countdownLabel = state.tone === "upcoming" ? "Drops in" : "Ends in";

  return (
    <div className="relative w-full overflow-hidden rounded-[24px] bg-[#0a0a0a] group aspect-[360/220] md:aspect-[720/320] lg:aspect-[1280/420]">
      {/* Background banner (21:9, cover). */}
      {dropImage && (
        <img
          src={dropImage}
          alt={drop.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
        />
      )}

      {/* Readability overlays. */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/90 via-[#0a0a0a]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-transparent md:hidden" />

      {/* Content (HTML overlay — never baked into the image). */}
      <div className="relative h-full w-full flex flex-col justify-center p-6 md:p-10 lg:p-14 max-w-[600px] z-10">
        <div className="flex items-center gap-3 mb-3 md:mb-4">
          <span className={`flex h-2 w-2 rounded-full ${tone.dot}`} />
          <span className={`se-label text-[10px] md:text-[12px] uppercase tracking-widest font-bold ${tone.text}`}>
            {state.status} Drop
          </span>
        </div>

        <h3 className="se-serif text-[24px] md:text-[36px] lg:text-[48px] text-[#e5e2e1] leading-tight mb-2 md:mb-4">
          {drop.name}
        </h3>

        {drop.description && (
          <p className="hidden md:block se-body text-[14px] md:text-[16px] text-[#d0c5af] mb-6 line-clamp-2">
            {drop.description}
          </p>
        )}

        {/* Countdown (only when there's a target). */}
        {timeLeft && (
          <div className="mb-6 md:mb-8">
            <span className="se-label text-[9px] md:text-[10px] uppercase tracking-widest text-[#99907c]">
              {countdownLabel}
            </span>
            <div className="mt-2 flex items-center gap-3 md:gap-5">
              {Object.entries(timeLeft).map(([unit, value]) => (
                <div key={unit} className="flex flex-col">
                  <span className="se-mono text-[20px] md:text-[28px] lg:text-[36px] text-[#f2ca50] leading-none drop-shadow-[0_0_8px_rgba(242,202,80,0.3)]">
                    {value.toString().padStart(2, "0")}
                  </span>
                  <span className="se-label text-[9px] md:text-[11px] text-[#99907c] uppercase tracking-wider mt-1">
                    {unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link to={`/drops/${drop.slug || drop._id || drop.id}`}>
          <button className="flex h-[44px] md:h-[52px] items-center justify-center rounded-[12px] md:rounded-[16px] bg-[#f2ca50] px-6 md:px-8 se-body text-[13px] md:text-[15px] font-semibold text-[#0a0a0a] transition-transform hover:-translate-y-1">
            {state.tone === "ended" ? "View Drop" : "Shop Drop"}
          </button>
        </Link>
      </div>
    </div>
  );
}

export const ExclusiveDropsBanner = ({ drops = [] }) => {
  const list = Array.isArray(drops) ? drops.filter(Boolean) : [];

  // No active or upcoming drops → hide the section entirely (no placeholder).
  if (list.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 md:px-8 py-[64px] md:py-[80px] lg:py-[96px]">
      <div className="mb-8 md:mb-10">
        <h2 className="se-serif text-[28px] md:text-[36px] lg:text-[40px] text-[#e5e2e1] leading-tight">
          Exclusive Drops
        </h2>
        <p className="mt-2 se-body text-[16px] md:text-[18px] text-[#99907c]">
          Limited releases — once they're gone, they're gone.
        </p>
      </div>

      <div className="flex flex-col gap-6 md:gap-8">
        {list.map((drop) => (
          <DropBanner key={drop._id || drop.id || drop.slug} drop={drop} />
        ))}
      </div>
    </section>
  );
};
