export const DEMO_PRODUCTS = [
  {
    id: 'se-001',
    slug: 'rare-fit-black-hoodie',
    name: 'Rare Fit Black Hoodie',
    category: 'unisex',
    price: 4200,
    description: 'A limited-edition premium hoodie built for the bold statement maker.',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
    badges: ['Limited Drop', 'Premium'],
    stock: 18,
    variants: [
      { label: 'Small', value: 'S', stock: 6 },
      { label: 'Medium', value: 'M', stock: 7 },
      { label: 'Large', value: 'L', stock: 5 }
    ]
  },
  {
    id: 'se-002',
    slug: 'saga-gold-graphic-tee',
    name: 'Saga Gold Graphic Tee',
    category: 'boys',
    price: 2750,
    description: 'Street-ready graphic tee with metallic gold accent print.',
    image: 'https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=900&q=80',
    badges: ['Drop Exclusive'],
    stock: 32,
    variants: [
      { label: 'XS', value: 'XS', stock: 10 },
      { label: 'S', value: 'S', stock: 12 },
      { label: 'M', value: 'M', stock: 10 }
    ]
  },
  {
    id: 'se-003',
    slug: 'essence-slate-joggers',
    name: 'Essence Slate Joggers',
    category: 'girls',
    price: 3250,
    description: 'Modern joggers cut for comfort with a sleek artisan finish.',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80',
    badges: ['Best Seller'],
    stock: 24,
    variants: [
      { label: 'S', value: 'S', stock: 8 },
      { label: 'M', value: 'M', stock: 8 },
      { label: 'L', value: 'L', stock: 8 }
    ]
  },
  {
    id: 'se-004',
    slug: 'legacy-statement-sneaker',
    name: 'Legacy Statement Sneaker',
    category: 'unisex',
    price: 7350,
    description: 'Hand-finished silhouette with luxury details and limited allocation.',
    image: 'https://images.unsplash.com/photo-1528701800489-20e209e5f384?auto=format&fit=crop&w=900&q=80',
    badges: ['Elite Gift Tier'],
    stock: 12,
    variants: [
      { label: '8', value: '8', stock: 4 },
      { label: '9', value: '9', stock: 4 },
      { label: '10', value: '10', stock: 4 }
    ]
  }
];

export const DEMO_DROPS = [
  {
    id: 'drop-01',
    title: 'Midnight Script',
    subtitle: 'Statement silhouettes hand-crafted for limited release.',
    releaseDate: '2026-05-15',
    story: 'A premium drop that celebrates rare streetwear with refined finishes and a bold gold signature.',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'drop-02',
    title: 'Golden Aura',
    subtitle: 'A curated capsule built for the youth of today.',
    releaseDate: '2026-06-10',
    story: 'Designed for bold urban energy and premium comfort, this drop blends statement graphics with artisan textures.',
    image: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1200&q=80'
  }
];

export const GIFT_TIERS = [
  { min: 1000, max: 2999, tier: 'Basic Gift' },
  { min: 3000, max: 5999, tier: 'Standard Gift' },
  { min: 6000, max: 9999, tier: 'Premium Gift' },
  { min: 10000, max: Infinity, tier: 'Elite Gift' }
];

export const DEMO_NOTIFICATIONS = [
  {
    id: 'notif-01',
    title: 'Next drop is live soon',
    body: 'Midnight Script will launch on May 15. Reserve your favourites now.',
    type: 'drop',
    unread: true
  },
  {
    id: 'notif-02',
    title: 'Manual payment verification',
    body: 'Admin review is pending for your recent transfer proof.',
    type: 'order',
    unread: false
  }
];

export function getGiftTier(amount) {
  return GIFT_TIERS.find((tier) => amount >= tier.min && amount <= tier.max)?.tier || 'Mystery Gift';
}

export function getProductBySlug(slug) {
  return DEMO_PRODUCTS.find((product) => product.slug === slug);
}

export function getProductsByCategory(category) {
  if (!category || category === 'all') {
    return DEMO_PRODUCTS;
  }
  return DEMO_PRODUCTS.filter((product) => product.category === category);
}
