import React, { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Instagram } from "lucide-react";

const FALLBACK = [
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80",
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80",
  "https://images.unsplash.com/photo-1551803091-e20673f15770?w=600&q=80",
  "https://images.unsplash.com/photo-1492447166138-50c3889fccb1?w=600&q=80",
  "https://images.unsplash.com/photo-1485518882345-15568b007407?w=600&q=80",
];

// "How The Elite Wear It" — horizontal-scroll gallery for member-styled fits.
// Image source defaults to Unsplash placeholders; pass `images` once
// brand-shot or user-uploaded assets exist.
const CommunityStylingStrip = ({ images = [], title = "How The Elite Wear It" }) => {
  const scroller = useRef(null);
  const tiles = images.length > 0 ? images : FALLBACK;
  const scrollBy = (delta) =>
    scroller.current?.scrollBy({ left: delta, behavior: "smooth" });

  return (
    <section className="bg-[#0a0a0a] py-16 md:py-20 border-y border-[#1a1a1a]">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#f2ca50] mb-3">
              The Community
            </p>
            <h3 className="font-display text-[28px] md:text-[40px] leading-none uppercase text-[#FAF7F2]">
              {title}
            </h3>
          </div>
          <div className="hidden md:flex gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-360)}
              aria-label="Scroll left"
              className="h-10 w-10 flex items-center justify-center border border-[#4d4635] text-[#d0c5af] hover:text-[#f2ca50] hover:border-[#f2ca50] transition-colors"
            >
              <ArrowLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(360)}
              aria-label="Scroll right"
              className="h-10 w-10 flex items-center justify-center border border-[#4d4635] text-[#d0c5af] hover:text-[#f2ca50] hover:border-[#f2ca50] transition-colors"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div
          ref={scroller}
          className="flex gap-4 md:gap-5 overflow-x-auto snap-x scroll-smooth pb-2 scrollbar-hide"
        >
          {tiles.map((src, i) => (
            <motion.a
              key={`${src}-${i}`}
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="relative shrink-0 w-[260px] md:w-[300px] aspect-[3/4] overflow-hidden border border-[#1f1f1f] bg-[#131313] group snap-start block"
            >
              <img
                src={src}
                alt="Community fit"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Instagram
                className="absolute top-3 right-3 w-4 h-4 text-[#FAF7F2] opacity-0 group-hover:opacity-100 transition-opacity"
                strokeWidth={1.5}
              />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunityStylingStrip;
