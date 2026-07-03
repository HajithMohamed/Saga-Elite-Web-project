import React from "react";

// Headless dual-thumb range. Two overlaid <input type="range"> with
// pointer-events isolated to the thumbs so both can be grabbed independently.
const PriceRangeSlider = ({
  min = 0,
  max = 100000,
  step = 500,
  value = [0, 100000],
  onChange,
}) => {
  const [lo, hi] = value;

  const setLo = (e) => {
    const v = Math.min(Number(e.target.value), Math.max(hi - step, min));
    onChange?.([v, hi]);
  };
  const setHi = (e) => {
    const v = Math.max(Number(e.target.value), Math.min(lo + step, max));
    onChange?.([lo, v]);
  };

  const loPct = ((lo - min) / (max - min)) * 100;
  const hiPct = ((hi - min) / (max - min)) * 100;

  const thumb =
    "[&::-webkit-slider-thumb]:pointer-events-auto " +
    "[&::-webkit-slider-thumb]:appearance-none " +
    "[&::-webkit-slider-thumb]:w-4 " +
    "[&::-webkit-slider-thumb]:h-4 " +
    "[&::-webkit-slider-thumb]:bg-gold " +
    "[&::-webkit-slider-thumb]:border-2 " +
    "[&::-webkit-slider-thumb]:border-page " +
    "[&::-webkit-slider-thumb]:rounded-full " +
    "[&::-webkit-slider-thumb]:cursor-pointer " +
    "[&::-moz-range-thumb]:pointer-events-auto " +
    "[&::-moz-range-thumb]:appearance-none " +
    "[&::-moz-range-thumb]:w-4 " +
    "[&::-moz-range-thumb]:h-4 " +
    "[&::-moz-range-thumb]:bg-gold " +
    "[&::-moz-range-thumb]:border-2 " +
    "[&::-moz-range-thumb]:border-page " +
    "[&::-moz-range-thumb]:rounded-full " +
    "[&::-moz-range-thumb]:cursor-pointer";

  const fmt = (n) =>
    `LKR ${(Number(n) || 0).toLocaleString("en-LK", {
      maximumFractionDigits: 0,
    })}`;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] tracking-[0.22em] text-muted uppercase">
          {fmt(lo)}
        </span>
        <span className="font-mono text-[10px] tracking-[0.22em] text-muted uppercase">
          {fmt(hi)}
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        {/* Track + selected fill */}
        <div className="absolute inset-x-0 h-1 bg-card" />
        <div
          className="absolute h-1 bg-gold"
          style={{ left: `${loPct}%`, right: `${100 - hiPct}%` }}
        />
        {/* Inputs — pointer-events-none on the input itself so the track
            doesn't swallow clicks; thumbs override to pointer-events-auto. */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={setLo}
          className={`absolute inset-0 w-full appearance-none bg-transparent pointer-events-none ${thumb}`}
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={setHi}
          className={`absolute inset-0 w-full appearance-none bg-transparent pointer-events-none ${thumb}`}
          aria-label="Maximum price"
        />
      </div>
    </div>
  );
};

export default PriceRangeSlider;
