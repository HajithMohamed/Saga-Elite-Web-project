import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ProductCard from "@/components/shopping-components/ProductCard";
import useRecentlyViewed from "@/hooks/use-recently-viewed";
import { Eyebrow } from "@/components/ui/editorial";

const RecentlyViewedCarousel = () => {
  const { items } = useRecentlyViewed();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    loop: false,
    dragFree: true,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("init", onSelect);
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("init", onSelect);
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Hide entirely when empty or only one item — a one-item carousel feels broken.
  if (items.length < 2) return null;

  return (
    <section className="bg-[#0a0a0a] py-16 md:py-20 border-y border-[#1a1a1a]">
      <div className="max-w-[1440px] mx-auto px-6">
        <header className="flex items-end justify-between mb-8">
          <div>
            <Eyebrow tone="gold" size="sm">
              Continue Browsing
            </Eyebrow>
            <h3 className="mt-3 font-display text-[28px] md:text-[40px] leading-none uppercase text-[#FAF7F2]">
              Recently Viewed
            </h3>
          </div>
          <div className="hidden md:flex gap-2">
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canPrev}
              aria-label="Scroll left"
              className="h-10 w-10 flex items-center justify-center border border-[#4d4635] text-[#d0c5af] hover:text-[#f2ca50] hover:border-[#f2ca50] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              disabled={!canNext}
              aria-label="Scroll right"
              className="h-10 w-10 flex items-center justify-center border border-[#4d4635] text-[#d0c5af] hover:text-[#f2ca50] hover:border-[#f2ca50] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </header>

        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-4 md:gap-5">
            {items.map((p) => (
              <div
                key={p._id}
                className="shrink-0 basis-[70%] sm:basis-[45%] md:basis-[32%] xl:basis-[23%]"
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewedCarousel;
