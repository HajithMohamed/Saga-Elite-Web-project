import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CARDS = [
  {
    key: "gents",
    label: "Gents",
    sub: "Bold / Oversized / Rare",
    to: "/shopping/product-list?category=gents",
    image: "https://images.unsplash.com/photo-1492447166138-50c3889fccb1?w=640&q=80",
  },
  {
    key: "ladies",
    label: "Ladies",
    sub: "Iconic / Editorial / Elegant",
    to: "/shopping/product-list?category=ladies",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=640&q=80",
  },
  {
    key: "unisex",
    label: "Unisex",
    sub: "No Rules / Shared / Free",
    to: "/shopping/product-list?category=unisex",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=640&q=80",
  },
];

const MotionDiv = motion.div;

const CategorySwitcherCards = ({ activePill }) => (
  <section className="px-5 md:px-12 max-w-7xl mx-auto py-8 md:py-10">
    <div className="grid grid-cols-3 gap-2 md:gap-3">
      {CARDS.map((card, i) => {
        const isActive = activePill === card.key;

        return (
          <MotionDiv
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              to={card.to}
              className={`group relative block overflow-hidden aspect-[2/3] md:aspect-[3/4] transition-all duration-500 ${
                isActive
                  ? "border-2 border-[#f2ca50] [box-shadow:0_0_24px_rgba(242,202,80,0.25)]"
                  : "border border-[#4d4635]/60 hover:border-[#f2ca50]/50"
              }`}
            >
              <img
                src={card.image}
                alt={card.label}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent" />

              {isActive ? (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#f2ca50] [box-shadow:0_0_8px_rgba(242,202,80,0.8)]" />
              ) : null}

              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                <p
                  className={`se-label text-[8px] md:text-[10px] tracking-[0.18em] md:tracking-[0.25em] mb-1 leading-snug ${
                    isActive ? "text-[#f2ca50]" : "text-[#d0c5af]"
                  }`}
                >
                  {card.sub}
                </p>
                <p className="se-serif text-[#e5e2e1] text-base md:text-xl leading-[1.1] transition-transform duration-500 group-hover:-translate-y-0.5">
                  {card.label}
                </p>
              </div>
            </Link>
          </MotionDiv>
        );
      })}
    </div>
  </section>
);

export default CategorySwitcherCards;
