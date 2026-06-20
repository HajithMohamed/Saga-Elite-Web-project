import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import useShopAbout from "@/hooks/use-shop-about";

const DISMISS_KEY = "saga_announcement_dismissed";

const isWithinSchedule = (bar) => {
  const now = Date.now();
  if (bar.startsAt) {
    const start = new Date(bar.startsAt).getTime();
    if (!Number.isNaN(start) && now < start) return false;
  }
  if (bar.endsAt) {
    const end = new Date(bar.endsAt).getTime();
    if (!Number.isNaN(end) && now > end) return false;
  }
  return true;
};

const AnnouncementBar = () => {
  const { data: about } = useShopAbout();
  const bar = about?.announcement_bar;
  const [dismissed, setDismissed] = useState(false);

  const fingerprint = useMemo(
    () => JSON.stringify({ message: bar?.message, ctaUrl: bar?.ctaUrl, startsAt: bar?.startsAt }),
    [bar?.message, bar?.ctaUrl, bar?.startsAt]
  );

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(DISMISS_KEY);
      setDismissed(stored === fingerprint);
    } catch {
      setDismissed(false);
    }
  }, [fingerprint]);

  if (!bar?.enabled || !bar.message?.trim() || dismissed || !isWithinSchedule(bar)) {
    return null;
  }

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, fingerprint);
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const ctaInner = bar.ctaText ? (
    <span
      className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] shrink-0"
      style={{ borderColor: bar.textColor || "#D4AF37" }}
    >
      {bar.ctaText}
    </span>
  ) : null;

  return (
    <div
      className="relative z-[70] flex items-center justify-center gap-3 px-10 py-2.5 text-sm"
      style={{
        backgroundColor: bar.backgroundColor || "#0a0a0a",
        color: bar.textColor || "#D4AF37",
      }}
      role="region"
      aria-label="Site announcement"
    >
      {bar.ctaUrl ? (
        <Link
          to={bar.ctaUrl}
          className="flex items-center justify-center gap-3 font-medium hover:opacity-90 transition-opacity"
        >
          <span>{bar.message}</span>
          {ctaInner}
        </Link>
      ) : (
        <span className="font-medium">{bar.message}</span>
      )}

      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss announcement"
      >
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
};

export default AnnouncementBar;
