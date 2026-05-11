import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import usePageMeta from "@/hooks/use-page-meta";
import { useSocketEvent } from "@/hooks/use-socket-events";
import {
  Btn,
  Countdown,
  Eyebrow,
  Hairline,
  Reveal,
  StatusBadge,
} from "@/components/ui/editorial";
import CollectionHero from "@/components/listing/CollectionHero";
import CollectionIntro from "@/components/listing/CollectionIntro";

// Dedicated drops experience — no longer shares chrome with /shopping/product-list.
// Hero is the gold-toned drops variant from collectionConfig; the lookbook
// layout (alternating 7/5 with countdown) was lifted out of ProductListing.
const DropsIndex = () => {
  usePageMeta({ title: "Drops" });

  const [drops, setDrops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDrops = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/drops/get-all-drops`);
      setDrops(Array.isArray(res.data?.drops) ? res.data.drops : []);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not load drops";
      setError(msg);
      if (!silent) {
        toast({
          title: "Could not load drops",
          description: msg,
          variant: "destructive",
        });
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrops();
  }, [loadDrops]);

  // Real-time refetch on drop CRUD (Fix #4) — debounced to coalesce bursts.
  const refetchTimer = useRef(null);
  const debouncedRefetch = useCallback(() => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(() => loadDrops({ silent: true }), 250);
  }, [loadDrops]);
  useEffect(() => () => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
  }, []);

  useSocketEvent("drop:created", debouncedRefetch, [debouncedRefetch]);
  useSocketEvent("drop:updated", debouncedRefetch, [debouncedRefetch]);

  return (
    <div className="bg-[#0a0a0a] text-[#e5e2e1] se-body min-h-screen">
      <CollectionHero variant="drops" />
      <CollectionIntro
        eyebrow="Drops"
        body="Capsule releases. Each chapter opens, holds for a few days, and closes. Once a piece is gone — it's gone. Members enter first, always."
      />

      <main className="px-5 md:px-12 max-w-7xl mx-auto py-12 md:py-20">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32">
            <motion.div
              className="w-8 h-8 border-[3px] border-[#4d4635] border-t-[#f2ca50] rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, ease: "linear", repeat: Infinity }}
            />
            <span className="se-label mt-6 text-[#d0c5af] tracking-[0.2em] text-[10px]">
              LOADING DROPS
            </span>
          </div>
        )}

        {!isLoading && error && (
          <div className="border border-[#93000a]/40 bg-[#93000a]/10 px-6 py-10 text-center">
            <Eyebrow tone="muted" size="md" className="text-[#ffb4ab]">
              Something went still
            </Eyebrow>
            <p className="mt-3 se-body text-sm text-[#ffb4ab]">{error}</p>
          </div>
        )}

        {!isLoading && !error && drops.length === 0 && (
          <Reveal>
            <div className="border border-[#4d4635] bg-[#0e0e0e] px-8 py-16 md:py-20 text-center max-w-2xl mx-auto">
              <Eyebrow tone="muted" size="xs">
                Between chapters
              </Eyebrow>
              <h3 className="mt-4 se-serif text-[#e5e2e1] text-3xl md:text-4xl">
                No drops live just now.
              </h3>
              <p className="mt-5 se-body text-sm md:text-base text-[#d0c5af] leading-relaxed">
                The next chapter opens soon. Members will hear first.
              </p>
              <div className="mt-8">
                <Link to="/auth/register">
                  <Btn variant="default" iconRight={ArrowRight}>
                    Become a member
                  </Btn>
                </Link>
              </div>
            </div>
          </Reveal>
        )}

        {!isLoading && !error && drops.length > 0 && (
          <div className="space-y-16 md:space-y-24">
            {drops.map((drop, i) => {
              const release = drop?.releaseDate
                ? new Date(drop.releaseDate)
                : null;
              const end = drop?.endDate ? new Date(drop.endDate) : null;
              const now = Date.now();
              const isUpcoming = release && release.getTime() > now;
              const isLive =
                (!release || release.getTime() <= now) &&
                (!end || end.getTime() > now);
              const isExpired = end && end.getTime() < now;
              const target = isUpcoming ? release : end;
              const mirror = i % 2 === 1;

              return (
                <Reveal key={drop._id || drop.slug || i}>
                  <article
                    className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 ${
                      isExpired ? "opacity-80" : ""
                    }`}
                  >
                    {/* IMAGE */}
                    <Link
                      to={`/shopping/drop/${drop.slug}`}
                      className={`lg:col-span-7 group relative overflow-hidden border border-[#4d4635] hover:border-[#99907c] transition-colors ${
                        mirror ? "lg:order-2" : ""
                      }`}
                      style={{ aspectRatio: "16/10" }}
                    >
                      <img
                        src={drop?.images?.[0]?.url || "/LOGO.png"}
                        alt={drop?.name || "Drop"}
                        loading={i < 2 ? "eager" : "lazy"}
                        className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.04] ${
                          isExpired ? "grayscale" : ""
                        }`}
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/70 via-transparent to-transparent" />
                      <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                        <span className="bg-[#0a0a0a]/85 backdrop-blur-sm border border-[#4d4635] px-3 py-1.5 se-label text-[9px] tracking-[0.32em] text-[#f2ca50]">
                          Chapter · {String(i + 1).padStart(2, "0")}
                        </span>
                        {isExpired && <StatusBadge status="archived" />}
                        {isLive && <StatusBadge status="live" />}
                        {isUpcoming && (
                          <StatusBadge status="pending" label="Soon" />
                        )}
                      </div>
                      <div className="absolute bottom-4 right-4">
                        <ArrowUpRight
                          size={20}
                          strokeWidth={1.25}
                          className="text-[#f2ca50] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                        />
                      </div>
                    </Link>

                    {/* COPY */}
                    <div
                      className={`lg:col-span-5 flex flex-col justify-end pb-2 lg:pb-6 ${
                        mirror ? "lg:order-1" : ""
                      }`}
                    >
                      <Eyebrow tone="muted" size="xs">
                        {drop?.products?.length ?? 0} pieces
                      </Eyebrow>
                      <h3 className="mt-3 se-serif text-[#e5e2e1] text-3xl md:text-4xl lg:text-5xl leading-tight">
                        {drop?.name || "Untitled chapter"}
                      </h3>
                      <Hairline className="mt-5 max-w-[60px]" tone="strong" />
                      <p className="mt-5 se-body text-sm md:text-base text-[#d0c5af] leading-relaxed max-w-md line-clamp-3">
                        {drop?.description ||
                          "Open the chapter to read every piece in this release."}
                      </p>

                      <div className="mt-7">
                        {isUpcoming && target && (
                          <Countdown
                            target={target}
                            variant="compact"
                            showSeconds={false}
                            eyebrow="Opens in"
                          />
                        )}
                        {isLive && target && (
                          <Countdown
                            target={target}
                            variant="compact"
                            showSeconds={false}
                            eyebrow="Closes in"
                          />
                        )}
                        {isExpired && (
                          <Eyebrow tone="muted" size="xs">
                            The chapter has passed.
                          </Eyebrow>
                        )}
                      </div>

                      <div className="mt-7 flex items-center gap-4">
                        <Link to={`/shopping/drop/${drop.slug}`}>
                          <Btn variant="outline" iconRight={ArrowRight}>
                            Open the chapter
                          </Btn>
                        </Link>
                      </div>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default DropsIndex;
