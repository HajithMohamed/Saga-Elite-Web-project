const createProduct = ({
  id,
  slug,
  name,
  category,
  price,
  description,
  image,
  badges,
  stock,
  variants,
  isLimited = true
}) => ({
  id,
  _id: id,
  slug,
  name,
  category,
  categoryLabel: category.charAt(0).toUpperCase() + category.slice(1),
  brand: "Saga Elite",
  price,
  basePrice: price,
  description,
  image,
  primaryImage: image,
  images: [{ url: image }],
  badges,
  stock,
  totalStock: stock,
  isLimited,
  isActive: true,
  variants
});

export const DEMO_PRODUCTS = [
  createProduct({
    id: "se-001",
    slug: "rare-fit-black-hoodie",
    name: "Rare Fit Black Hoodie",
    category: "unisex",
    price: 4200,
    description: "A limited-edition premium hoodie built for the bold statement maker.",
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
    badges: ["Limited Drop", "Premium"],
    stock: 18,
    isLimited: true,
    variants: [
      { label: "Small", value: "S", size: "S", color: "Black", stock: 6 },
      { label: "Medium", value: "M", size: "M", color: "Black", stock: 7 },
      { label: "Large", value: "L", size: "L", color: "Black", stock: 5 }
    ]
  }),
  createProduct({
    id: "se-002",
    slug: "saga-gold-graphic-tee",
    name: "Saga Gold Graphic Tee",
    category: "boys",
    price: 2750,
    description: "Street-ready graphic tee with metallic gold accent print.",
    image: "https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=900&q=80",
    badges: ["Drop Exclusive"],
    stock: 32,
    isLimited: true,
    variants: [
      { label: "XS", value: "XS", size: "XS", color: "Gold", stock: 10 },
      { label: "S", value: "S", size: "S", color: "Gold", stock: 12 },
      { label: "M", value: "M", size: "M", color: "Gold", stock: 10 }
    ]
  }),
  createProduct({
    id: "se-003",
    slug: "essence-slate-joggers",
    name: "Essence Slate Joggers",
    category: "girls",
    price: 3250,
    description: "Modern joggers cut for comfort with a sleek artisan finish.",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
    badges: ["Best Seller"],
    stock: 24,
    isLimited: false,
    variants: [
      { label: "S", value: "S", size: "S", color: "Slate", stock: 8 },
      { label: "M", value: "M", size: "M", color: "Slate", stock: 8 },
      { label: "L", value: "L", size: "L", color: "Slate", stock: 8 }
    ]
  }),
  createProduct({
    id: "se-004",
    slug: "legacy-statement-sneaker",
    name: "Legacy Statement Sneaker",
    category: "unisex",
    price: 7350,
    description: "Hand-finished silhouette with luxury details and limited allocation.",
    image: "https://images.unsplash.com/photo-1528701800489-20e209e5f384?auto=format&fit=crop&w=900&q=80",
    badges: ["Elite Gift Tier"],
    stock: 12,
    isLimited: true,
    variants: [
      { label: "8", value: "8", size: "8", color: "White", stock: 4 },
      { label: "9", value: "9", size: "9", color: "White", stock: 4 },
      { label: "10", value: "10", size: "10", color: "White", stock: 4 }
    ]
  })
];

const PRODUCT_MAP = Object.fromEntries(DEMO_PRODUCTS.map((product) => [product.slug, product]));

export const DEMO_DROPS = [
  {
    id: "drop-01",
    _id: "drop-01",
    slug: "midnight-script",
    name: "Midnight Script",
    title: "Midnight Script",
    subtitle: "Statement silhouettes hand-crafted for limited release.",
    description: "A premium drop that celebrates rare streetwear with refined finishes and a bold gold signature.",
    story: "A premium drop that celebrates rare streetwear with refined finishes and a bold gold signature.",
    releaseDate: "2026-05-15T00:00:00.000Z",
    endDate: "2026-05-31T23:59:59.000Z",
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80",
    images: [
      {
        url: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    products: [PRODUCT_MAP["rare-fit-black-hoodie"], PRODUCT_MAP["legacy-statement-sneaker"]]
  },
  {
    id: "drop-02",
    _id: "drop-02",
    slug: "golden-aura",
    name: "Golden Aura",
    title: "Golden Aura",
    subtitle: "A curated capsule built for the youth of today.",
    description: "Designed for bold urban energy and premium comfort, this drop blends statement graphics with artisan textures.",
    story: "Designed for bold urban energy and premium comfort, this drop blends statement graphics with artisan textures.",
    releaseDate: "2026-06-10T00:00:00.000Z",
    endDate: "2026-06-25T23:59:59.000Z",
    image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1200&q=80",
    images: [
      {
        url: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    products: [PRODUCT_MAP["saga-gold-graphic-tee"], PRODUCT_MAP["essence-slate-joggers"]]
  }
];

export const DEMO_HOME_ASSETS = {
  heroImages: [
    { url: DEMO_DROPS[0].image },
    { url: DEMO_DROPS[1].image },
    { url: PRODUCT_MAP["legacy-statement-sneaker"].image }
  ],
  logoImage: { url: "LOGO.png" },
  categoryLogos: {
    Boys: { url: PRODUCT_MAP["saga-gold-graphic-tee"].image },
    Girls: { url: PRODUCT_MAP["essence-slate-joggers"].image },
    Unisex: { url: PRODUCT_MAP["rare-fit-black-hoodie"].image }
  },
  adImage: { url: DEMO_DROPS[1].image }
};

export const DEMO_SESSION = {
  user: {
    email: "collector@sagaelite.demo",
    role: "customer",
    profilePicture: ""
  }
};

export const GIFT_TIERS = [
  { min: 1000, max: 2999, tier: "Basic Gift" },
  { min: 3000, max: 5999, tier: "Standard Gift" },
  { min: 6000, max: 9999, tier: "Premium Gift" },
  { min: 10000, max: Infinity, tier: "Elite Gift" }
];

export const DEMO_NOTIFICATIONS = [
  {
    id: "notif-01",
    _id: "notif-01",
    title: "Next drop is live soon",
    body: "Midnight Script will launch on May 15. Reserve your favourites now.",
    message: "Midnight Script will launch on May 15. Reserve your favourites now.",
    type: "drop",
    unread: true,
    isRead: false,
    createdAt: "2026-04-23T09:30:00.000Z"
  },
  {
    id: "notif-02",
    _id: "notif-02",
    title: "Manual payment verification",
    body: "Admin review is pending for your recent transfer proof.",
    message: "Admin review is pending for your recent transfer proof.",
    type: "order",
    unread: false,
    isRead: true,
    createdAt: "2026-04-22T13:45:00.000Z"
  }
];

export function getGiftTier(amount) {
  return GIFT_TIERS.find((tier) => amount >= tier.min && amount <= tier.max)?.tier || "Mystery Gift";
}

export function getProductBySlug(slug) {
  return DEMO_PRODUCTS.find((product) => product.slug === slug);
}

export function getProductsByCategory(category) {
  if (!category || category === "all") {
    return DEMO_PRODUCTS;
  }
  return DEMO_PRODUCTS.filter((product) => product.category === category);
}
