// Per-collection hero copy + imagery. The CollectionHero component reads from
// here keyed on the active pill value (all / ladies / gents / unisex / drops /
// offers / archive). Images use Unsplash placeholders today; replace `image`
// with a path under /public/heroes/ once the brand has its own shoots.

export const COLLECTION_HEROES = {
  all: {
    eyebrow: "The Atelier",
    title: "Every chapter, in one place",
    tagline:
      "Browse every piece in the catalogue — from the latest drop to the archived classics. One scroll, no compromise.",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80",
    tone: "neutral",
  },
  ladies: {
    eyebrow: "Ladies",
    title: "Cut for her",
    tagline:
      "Dresses, sarees, and silhouettes built for the woman who arrives, not the one who waits.",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=80",
    tone: "warm",
  },
  gents: {
    eyebrow: "Gents",
    title: "Cut for him",
    tagline:
      "Tailored fits and oversized streetwear for those who notice the seams before the label.",
    image:
      "https://images.unsplash.com/photo-1492447166138-50c3889fccb1?w=1920&q=80",
    tone: "dark",
  },
  unisex: {
    eyebrow: "Unisex",
    title: "Cut for both",
    tagline:
      "Pieces that ignore the binary. Made to layer, made to share, made to outlast a season.",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1920&q=80",
    tone: "neutral",
  },
  drops: {
    eyebrow: "Drops",
    title: "Rare fit, forever",
    tagline:
      "Capsule releases. Once a chapter closes, the pieces never restock.",
    image:
      "https://images.unsplash.com/photo-1551803091-e20673f15770?w=1920&q=80",
    tone: "gold",
  },
  offers: {
    eyebrow: "Offers",
    title: "Brief windows",
    tagline:
      "Selected pieces at members-only prices. The clock is louder than the discount.",
    image:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&q=80",
    tone: "warm",
  },
  archive: {
    eyebrow: "Archive",
    title: "What has passed",
    tagline:
      "Every chapter that has closed. Held for record — nothing restocks, nothing returns.",
    image:
      "https://images.unsplash.com/photo-1485518882345-15568b007407?w=1920&q=80",
    tone: "muted",
  },
};

// Tone-specific overlays + accent colors. Tailwind classes only (no runtime).
export const COLLECTION_TONES = {
  neutral: {
    overlay: "bg-gradient-to-b from-[#0a0a0a]/40 via-[#0a0a0a]/60 to-[#0a0a0a]",
    accent: "text-[#f2ca50]",
    accentDot: "bg-[#f2ca50]",
  },
  warm: {
    overlay: "bg-gradient-to-b from-[#3a1a0e]/40 via-[#0a0a0a]/70 to-[#0a0a0a]",
    accent: "text-[#f2ca50]",
    accentDot: "bg-[#f2ca50]",
  },
  dark: {
    overlay: "bg-gradient-to-b from-[#0a0a0a]/60 via-[#0a0a0a]/80 to-[#0a0a0a]",
    accent: "text-[#f2ca50]",
    accentDot: "bg-[#f2ca50]",
  },
  gold: {
    overlay: "bg-gradient-to-b from-[#2a1f00]/50 via-[#0a0a0a]/70 to-[#0a0a0a]",
    accent: "text-[#f2ca50]",
    accentDot: "bg-[#f2ca50]",
  },
  muted: {
    overlay: "bg-gradient-to-b from-[#0a0a0a]/60 via-[#0a0a0a]/85 to-[#0a0a0a]",
    accent: "text-[#99907c]",
    accentDot: "bg-[#99907c]",
  },
};

export const getCollectionHero = (key) =>
  COLLECTION_HEROES[key] || COLLECTION_HEROES.all;

export const getCollectionTone = (toneKey) =>
  COLLECTION_TONES[toneKey] || COLLECTION_TONES.neutral;
