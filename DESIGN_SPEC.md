# Saga Elite — UI/UX Design Specification

> **Scope & source of truth.** This document formalizes the **actual, shipped** Saga Elite design system — every value below is extracted from the real codebase (`Client-Side/tailwind.config.js`, `Client-Side/src/index.css`, `Client-Side/src/components/ui/editorial.jsx`, the storefront components, and the live route map in `Client-Side/src/App.jsx`). Where the codebase leaves a gap, a concrete value is proposed and flagged **`[proposed]`**.
>
> **Brand reality.** Saga Elite is a Sri Lankan **limited-edition, drop-based** fashion house — a dark, gold, editorial luxury aesthetic, *not* a generic light-retail marketplace. The palette is gold (`#f2ca50`) on near-black (`#0e0e0e`); typography is Playfair Display + Cinzel + Inter + JetBrains Mono. Customer-facing copy never mentions sourcing/suppliers; the brand reads as a curated atelier.
>
> **Stack.** React 19 + Vite 7, Tailwind CSS (class dark mode), Radix primitives + shadcn-style UI, framer-motion, Lenis smooth-scroll. Currency: **LKR**, locale `en-LK`.

**Contents**

1. [Design System](#1-design-system)
2. [Motion System](#2-motion-system)
3. [Responsive Layout](#3-responsive-layout)
4. [Homepage](#4-homepage)
5. [Category / Listing Page](#5-category--listing-page)
6. [Product Details Page](#6-product-details-page)
7. [Cart](#7-cart)
8. [Checkout](#8-checkout)
9. [User Account](#9-user-account)
10. [Search Experience](#10-search-experience)
11. [Navigation](#11-navigation)
12. [Components](#12-components)
13. [Exact Measurements](#13-exact-measurements)
14. [Banner Specifications](#14-banner-specifications)
15. [Product Card Specifications](#15-product-card-specifications)
16. [Accessibility](#16-accessibility)
17. [Developer Handoff](#17-developer-handoff)
18. [Token Reference Appendix](#18-token-reference-appendix)

---

## 1. Design System

### 1.1 Typography

Four families are loaded from Google Fonts (`index.html`), plus Material Symbols for icons.

| Role | Family (stack) | Tailwind class | Utility class | Weight | Tracking | Notes |
|---|---|---|---|---|---|---|
| Brand / Display | `Cinzel`, Playfair, serif | `font-display` | `.se-display` | 600 | `0.08em` | UPPERCASE |
| Wordmark | `Cinzel`, serif | — | `.se-wordmark` | 600 | `0.14em` | UPPERCASE, "Saga Elite" lockup |
| Headline | `Playfair Display`, serif | `font-serif` / `font-headline` | `.se-serif` (700) / `.se-headline` (600) | 600–700 | `-0.02em` / `-0.015em` | normal style (italics force-disabled) |
| Body / Label | `Inter`, system-ui | `font-sans` / `font-body` | `.se-body` (400, lh 1.6) / `.se-label` (500, UPPER, `0.18em`) | 300–700 | body `-0.005em` | |
| Numeric / Mono | `JetBrains Mono`, ui-monospace | `font-mono` | `.se-mono` | 400–500 | `tabular-nums` | prices, SKUs, countdowns |
| Icons | `Material Symbols Outlined` | — | — | 100–700 | — | also `lucide-react` SVG icons |

**Type scale (in use across the app).** Tailwind sizes; line-heights are Tailwind defaults unless a `leading-*` is set.

| Token | px | Typical use |
|---|---|---|
| `text-[9px]` / `text-[10px]` | 9 / 10 | eyebrows, labels, badges, mono captions |
| `text-[11px]` / `text-xs` | 11 / 12 | labels, button text, fine print |
| `text-[13px]` / `text-sm` | 13 / 14 | product card title, body small |
| `text-base` | 16 | body, inputs (`AUTH_INPUT`) |
| `text-lg` / `text-xl` | 18 / 20 | sub-headings, wordmark lg |
| `text-2xl` / `text-3xl` | 24 / 30 | section sub-heads, pull-quote |
| `text-4xl` / `text-5xl` | 36 / 48 | hero / countdown numerals |
| `text-7xl` | 72 | order-tracking hero (`md:`) |
| custom `text-[32px]` / `text-[48px]` | 32 / 48 | drop "Read every fit" headline |

> **Eyebrow sizes** (`Eyebrow` component): `xs` = `text-[10px]`/`0.3em`, `sm` = `text-[11px]`/`0.28em`, `md` = `text-xs`/`0.32em`.

### 1.2 Color Palette

From `tailwind.config.js` `theme.extend.colors` (semantic tokens) plus the literal hexes used across components.

**Core / surfaces**

| Token | Hex | Role |
|---|---|---|
| `background` | `#0e0e0e` | app background |
| `foreground` | `#e5e2e1` | primary text (warm off-white) |
| `surface` / `card` / `popover` | `#131313` | cards, popovers |
| `surface-1` | `#1f1f1f` | raised surface |
| `surface-2` | `#2a2a2a` | secondary button |
| `surface-3` | `#393939` | hover surface |
| `admin-shell` | `#050505` | admin background |
| `admin-card` | `#0b0b0b` | admin panels |
| *(literal)* | `#0a0a0a` | storefront pages / checkout background |

**Brand / accent**

| Token | Hex | Role |
|---|---|---|
| `primary` / `gold` | `#f2ca50` | primary gold (CTAs, active) |
| `primary.hover` / `accent` | `#d4af37` | deeper gold (hover, gradients) |
| `gold.light` | `#ffe088` | hover highlight |
| `primary.foreground` | `#0e0e0e` | text on gold |
| *(literal)* | `#3c2f00` | text on gold for editorial `Btn` |

**Muted / lines**

| Token | Hex | Role |
|---|---|---|
| `muted` | `#d0c5af` | secondary text |
| `muted.foreground` | `#99907c` | tertiary text / placeholders |
| *(literal)* | `#574500` | faint gold-brown (disabled labels) |
| `border` / `input` | `#4d4635` | hairlines, input borders |
| `ring` | `#f2ca50` | focus ring |

**Semantic / status**

| Token | Hex | Role |
|---|---|---|
| `destructive` / `sale` | `#ffb4ab` | errors, sale, low-stock alerts |
| *(literal)* | `#93000a` | destructive solid bg |
| `new` | `#1D9E75` | "new" tag |
| `deal` | `#f2ca50` | deal tag |
| status: confirmed/shipped | `#a4d2e2` | info blue |
| status: delivered/active | `#a8d8b6` | success green |
| status: verification | `#a8c8ec` | pending-info |

**Gradients & shadows**

- `bg-gradient-gold`: `linear-gradient(135deg,#f2ca50,#d4af37)`
- `bg-gradient-radial-gold`: `radial-gradient(ellipse at center, rgba(242,202,80,.08), transparent 70%)`
- `shadow-gold`: `0 0 40px rgba(242,202,80,.15)`
- `shadow-elegant`: `0 4px 60px rgba(0,0,0,.4)`

### 1.3 Spacing System

Tailwind's **4px base unit**; the design rhythm is effectively an **8px grid** (use even steps `2,4,6,8,10,12,16,20,24,32` → 8/16/24/32/48/64/96/128 px). Reference:

| Tailwind | px | Tailwind | px |
|---|---|---|---|
| `1` | 4 | `8` | 32 |
| `2` | 8 | `10` | 40 |
| `3` | 12 | `12` | 48 |
| `4` | 16 | `16` | 64 |
| `5` | 20 | `20` | 80 |
| `6` | 24 | `24` | 96 |
| `7` | 28 | `32` | 128 |

Section vertical rhythm in use: mobile `py-12` (48) / `py-16` (64); desktop `py-20` (80) / `py-24` (96).

### 1.4 Border Radius

| Token | Value | Use |
|---|---|---|
| `rounded-sm` | **4px** | editorial buttons, badges, small chips |
| `rounded-md` | **6px** | shadcn inputs/buttons |
| `rounded-lg` | **8px** | base cards |
| `rounded-xl` | 12px | checkout CTA |
| `rounded-2xl` | 16px | product card image, panels |
| `rounded-3xl` | 24px | order/admin cards, large panels |
| `rounded-[2rem]` / `[2.5rem]` | 32 / 40px | payment hero panels |
| `rounded-full` | 9999px | pills, swatches, FAB, status badges |

> **Design language note:** the editorial surfaces (drops, listing, PDP) favor **sharp `rounded-sm`/none** hairline frames; the commerce surfaces (cart, orders, payment) favor **soft `rounded-2xl`/`3xl`**. Keep this split — sharp = editorial, soft = transactional.

### 1.5 Elevation & Shadow

| Level | Value | Use |
|---|---|---|
| 0 (flat) | none + 1px `#4d4635` hairline | editorial cards |
| 1 | `shadow-gold` `0 0 40px rgba(242,202,80,.15)` | gold glow accents |
| 2 | `shadow-elegant` `0 4px 60px rgba(0,0,0,.4)` | floating panels |
| Product hover | `0 8px 30px rgba(212,175,55,.15)` | card lift |
| FAB | `0 10px 30px rgba(0,0,0,.55)` + hover `0 0 28px rgba(212,175,55,.45)` | mystery-gift button |
| Focus ring | `0 0 0 2px #0a0a0a, 0 0 0 4px #f2ca50` (`.se-focus`) | keyboard focus |

### 1.6 Icon Style

- **Primary:** `lucide-react`, stroke icons, default `strokeWidth` **1.5** (1.75–2 for emphasis). Sizes: `12` (inline/label), `14` (buttons), `16`–`20` (nav/actions), `24`+ (feature).
- **Secondary:** Material Symbols Outlined (variable fill/weight) where loaded.
- Always pair an icon-only control with `aria-label`.

### 1.7 Illustration / Image Style

- **Photography:** full-bleed editorial fashion, desaturated-luxe; dark gradient scrims (`from-[#0a0a0a]/70`) for text legibility over imagery.
- **Hover treatment:** subtle `scale(1.04–1.05)` zoom over 600–700ms; optional `grayscale` on hover (`Img hoverFade`).
- **Grain:** `.bg-grain` SVG fractal-noise overlay at `0.04` opacity for cinematic texture.
- **Fallback:** `.se-img-fallback` (surface `#131313` + hairline + "image pending" label); `/LOGO.png` for missing product images, `/placeholder.jpg` on error.
- **Logo:** `/LOGO.png`; animated "solar-system" lockup available via `AnimatedLogo`.

### 1.8 Grid System

- **Columns:** 12-column conceptual grid; editorial pages use explicit spans (`lg:grid-cols-12` with `lg:col-span-7 / 5`).
- **Product grids:** `grid-cols-2` (mobile) → `lg:grid-cols-3` (listing) / `xl:grid-cols-3` (drops); editorial grid uses `gap-px` over `bg-[#4d4635]/40` to create hairline separators.
- **Gutters:** `gap-3`/`gap-4` (cards), `gap-8`–`gap-12` (page columns).

### 1.9 Responsive Breakpoints

Tailwind defaults (no custom `screens` override):

| Name | min-width | Target tier |
|---|---|---|
| *(base)* | 0 | Mobile 360–639 |
| `sm` | **640px** | large phone |
| `md` | **768px** | tablet |
| `lg` | **1024px** | laptop |
| `xl` | **1280px** | desktop |
| `2xl` | **1536px** | large desktop |

### 1.10 Accessibility Standards

Target **WCAG 2.2 AA** (see §16). Built-in primitives: `.se-focus` visible focus ring, `useReducedMotion()` gating, ARIA on all custom controls (`SortDropdown`, `Disclosure`, `ColorSwatch`, `SizeChip`, `FilterPills`), `role="alert"`/`aria-live` on `FieldError`.

---

## 2. Motion System

Powered by **framer-motion**; page-level smooth scroll by **Lenis**. CSS view-transitions are globally tuned to `0.25s cubic-bezier(0.19,1,0.22,1)`.

### 2.1 Easing functions (canonical)

| Name | cubic-bezier | Where used |
|---|---|---|
| **Editorial** (primary) | `0.22, 1, 0.36, 1` | reveals, disclosures, buttons, dropdowns, stagger |
| **Cinematic** | `0.19, 1, 0.22, 1` | view-transitions, `clip-reveal` |
| **Payment** (`MOTION_EASE`) | `0.16, 1, 0.3, 1` | checkout / manual-payment sections |
| **Image** | `0.25, 0.46, 0.45, 0.94` | product image zoom |
| `easeOut` / `easeInOut` / `linear` | — | hovers, idle loops, marquees/orbits |
| Spring | `stiffness 400, damping 32` (pills) · `600/10` (wishlist heart) | layout/active indicators |

### 2.2 Duration tokens

| Token | Duration | Use |
|---|---|---|
| Micro | **150–200ms** | hover color, button `transition-all duration-200` |
| Small reveal | **180–220ms** | dropdown/toast/field-error open |
| Standard | **250–300ms** | page transition (0.25s), accordion height, card lift (0.3s) |
| Reveal | **550ms** | scroll-reveal (`Reveal`) |
| Image | **600–700ms** | image zoom/cross-fade |
| Cinematic | **800–1200ms** | hero stagger, logo reveal, clip-reveal (1.2s) |
| **Max** | **≤ 1200ms** | hard ceiling for any single transition |

### 2.3 Interaction-specific

| Interaction | Spec |
|---|---|
| **Hover** | color/opacity 150–200ms; image `scale(1.04–1.05)` 600ms; card `y:-4` 300ms |
| **Click/tap** | buttons `whileTap={{ scale: 0.95 }}` (editorial `Btn`) |
| **Page transition** | `opacity 0→1`, `y: 8→0`, exit `y: 0→-8`, 250ms easeInOut (layout `AnimatePresence mode="wait"`) |
| **Loading** | gold spinner: 2px ring, `border-t-[#f2ca50]`, `animate-spin`; staged text loader for payment |
| **Skeleton** | `animate-pulse` on `bg-[#1a1a1a]`/`bg-muted`; product image shows pulse + spinner until `onLoad` |
| **Scroll reveal** | `opacity 0→1` + `y: 24→0`, 550ms, `viewport once, margin -100px` |
| **Fade / Slide / Scale** | fade 200–400ms; slide (drawers) translate-x; scale modals `0.96→1` |
| **Stagger** | parent `staggerChildren: 0.06` (drop grid) / `SeFade` children 500ms |
| **Modal** | overlay fade + panel `opacity 0→1, scale 0.96→1, y 18→0`, 280ms editorial ease |
| **Drawer** | slide from edge (Radix `Sheet`), backdrop fade |
| **Toast** | slide/fade in from edge, `se-toast`, auto-dismiss |
| **Marquee / orbit** | `linear` infinite, 28s marquee / 14–60s orbits |

### 2.4 Reduced motion

`useReducedMotion()` is honored: `Reveal` drops translate (opacity only, 200ms); `AnimatedLogo` renders a **static** orbital snapshot (no infinite rotation/float). **Rule:** any infinite or large-displacement animation must have a reduced-motion fallback. Respect `prefers-reduced-motion`.

---

## 3. Responsive Layout

### 3.1 Tier specifications

| Tier | Viewport | Max content width | Outer margin (page padding) | Columns | Gutter |
|---|---|---|---|---|---|
| **Mobile** | 360–480 | 100% | `px-4` (16) → `px-5` (20) editorial | 1–2 | 12–16 |
| **Tablet** | 768–1024 | 100% | `md:px-6`–`px-8` (24–32) | 2–3 | 16–24 |
| **Laptop** | 1280 | `max-w-[1280px]` / `max-w-7xl` | `lg:px-8`–`px-12` (32–48) | 3 | 24–32 |
| **Desktop** | 1440 | `max-w-[1280px]`–`[1440px]` | auto-centered | 3–4 | 32 |
| **Large** | 1920 | `max-w-[1440px]`; header `max-w-[1600px]` | auto-centered, large side gutters | 3–4 | 32 |

**Canonical container widths in the codebase**

| Container | Width | Used by |
|---|---|---|
| Header bar | `max-w-[1600px]` + `px-6 lg:px-12` | `MainHeader` |
| Storefront content | `max-w-7xl` (1280) / `max-w-[1280px]` | listing, orders, checkout |
| Editorial wide | `max-w-[1440px]` | drop details grid |
| Payment | `max-w-[1080px]` / `max-w-[1280px]` | manual payment |
| Reading width | `max-w-2xl`/`3xl` | intros, pull-quotes, empty states |

### 3.2 Safe areas & sticky elements

- **Safe area:** `MobileBottomNav` uses `pb-safe` (`env(safe-area-inset-bottom)`). **`[proposed]`** apply the same to the Checkout sticky CTA bar (currently `p-4`) for gesture-bar phones.
- **Sticky:** `MainHeader` `sticky top-0 z-50`; checkout/payment self-headers `sticky top-0 z-40`; PDP & order-tracking summary `lg:sticky lg:top-32`; `MobileBottomNav` `fixed bottom-0 z-50 h-16`.
- **z-index ladder:** content `0` → sticky bars `40` → header / bottom-nav / FAB `50` → modal overlay `60` → toast `≥60`.

---

## 4. Homepage

Public homepage = cinematic editorial landing (`PublicLayout`). Authenticated storefront home = `/shopping/home` (adds `MobileBottomNav`). Spec per section:

| # | Section | Width / container | Padding (mobile → desktop) | Typography | Image ratio | CTA hierarchy | Responsive | Animation | Loading | Empty |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Announcement bar** | full-bleed | `py-2` | `.se-label` 10px `0.3em` | — | none / dismiss `×` | hidden if disabled | marquee `linear` | n/a | unmounts when blank |
| 2 | **Navigation** | `max-w-[1600px]` | `px-6 lg:px-12`, h **72px** | wordmark 20px; nav `.se-label` 11px | — | search · cart · wishlist · profile | mega-menu `lg+`, hamburger `<lg` | sticky shrink on scroll | — | — |
| 3 | **Search** | overlay full-screen | — | input 16px | — | primary input | drawer on mobile | fade/slide 200ms | spinner | "no results" state |
| 4 | **Hero banner** | full-bleed, `100svh`/`min-h-[600px]` | content `px-5 md:px-12` | display 48→72px | 16:9 desktop / 4:5 mobile | 1 primary `Btn lg` + 1 `outline` | text re-stacks, scrim | stagger reveal 800ms | skeleton bg | static fallback copy |
| 5 | **Category cards** | `max-w-7xl` | `py-16 md:py-24`, `gap-3/4` | title `.se-label` | 3:4 | card = link | `grid-cols-2 lg:grid-cols-3` | reveal stagger | pulse cards | hide section |
| 6 | **Featured collections** | `max-w-[1440px]` | `py-20` | headline 32→48px | 16:10 | "Open the chapter" `outline` | alternating 7/5 → stack | reveal + image zoom | spinner | "between chapters" empty |
| 7 | **Trending products** | `max-w-7xl` | `py-16` | section eyebrow + headline | card 3:4/4:5 | product cards | 2→3–4 cols | stagger 0.06 | skeleton grid | hide if none |
| 8 | **Best sellers** | `max-w-7xl` | `py-16` | as above | as above | product cards | as above | as above | skeleton | hide |
| 9 | **New arrivals** | `max-w-7xl` | `py-16` | as above | as above | product cards | as above | as above | skeleton | hide |
| 10 | **Promotional banners** | full-bleed / `max-w-[1440px]` | `py-12 md:py-20` | headline + eyebrow | 21:9 / 2:1 | 1 primary CTA | stack, keep safe text area | reveal | bg skeleton | hide |
| 11 | **Trust badges** | `max-w-7xl` | `py-10`, `gap-3` | `.se-label` 10–12px | icon 14–20 | none | wrap row | fade | — | static |
| 12 | **How shopping works** | `max-w-3xl`–`7xl` | `py-16` | step number mono + headline | icon/illus | none | 1→3 cols | reveal stagger | — | static |
| 13 | **Testimonials** | `max-w-7xl` | `py-16` | pull-quote 24–36px | avatar circle | none | carousel/stack | fade/slide | skeleton | hide |
| 14 | **Newsletter** | `max-w-2xl` centered | `py-16` | headline + body | — | email input + `Btn` | full-width input mobile | reveal | button spinner | success/error toast |
| 15 | **FAQ** | `max-w-3xl` | `py-16` | `Disclosure` headline 16–18px | — | none | full-width accordion | height-collapse 300ms | — | hide if none |
| 16 | **Footer** | full-bleed | `pt-16 pb-28 md:pb-16` | wordmark + `.se-label` groups | — | newsletter + social | accordion groups `<md` | — | — | hardcoded fallback |

**Footer mobile clearance:** `pb-28` (112px) clears the floating mystery-gift FAB and bottom nav. Social/legal/policy links + payment badges live at the base.

---

## 5. Category / Listing Page

Route `/shopping/product-list` (`ProductListing.jsx`), container `max-w-7xl`, `px-4 md:px-8`.

| Element | Spec |
|---|---|
| **Breadcrumbs** | `.se-label`/`text-xs` uppercase, `ChevronRight` 12px separators, current in gold |
| **Sidebar filters** | `hidden lg:block`, hairline-grouped `Disclosure` sections (category, size, color via `ColorSwatch`, price); sticky within column |
| **Filter drawer (mobile)** | Radix `Sheet` from left/bottom, full-height, "Apply / Clear" footer; trigger button in toolbar |
| **Sorting** | `SortDropdown` (custom listbox), h-40px, keyboard-accessible (Arrow/Enter/Esc), options e.g. New / Price ↑↓ / Trending |
| **Product grid** | `grid-cols-2 lg:grid-cols-3` (editorial `gap-px` over `#4d4635/40` hairline bg) |
| **Active filter pills** | `FilterPills` h-40px, active = gold with animated underline |
| **Pagination** | numbered + prev/next, OR infinite scroll; min 44px targets |
| **Loading** | `SkeletonCard` grid (matches card ratio), `animate-pulse` |
| **Empty** | centered hairline panel, eyebrow + headline + "clear filters" `Btn outline` |

---

## 6. Product Details Page

Route `/shopping/product/:slug` (`ProductDetails.jsx`), layout `grid lg:grid-cols-12`, dark `#0a0a0a`.

| Element | Spec |
|---|---|
| **Gallery** | `lg:col-span-7`; main image + thumbnail rail; aspect `4/5`; color selection swaps image |
| **Zoom** | hover scale / click-to-zoom lightbox; pinch on touch |
| **Variants / color** | `ColorSwatch` (32px default; selected = `ring-2 ring-[#f2ca50] ring-offset-2`; OOS = 35% opacity + diagonal strike) |
| **Size selector** | `SizeChip` **min-w-12 h-12 (48×48)**; selected = invert (`#e5e2e1` bg / `#131313` text); OOS = strikethrough + disabled |
| **Quantity** | stepper −/＋, mono count, 40–48px targets |
| **Add to cart panel** | `lg:col-span-5`; `relative`/`mt-auto` in column (not page-fixed) → no collision with global bars |
| **Sticky Add-to-Cart** | summary may `lg:sticky lg:top-32`; **`[proposed]`** mobile sticky add-to-cart bar mirroring checkout pattern (`fixed bottom-0`, hide `MobileBottomNav` while shown) |
| **Reviews** | rating stars + list; link to `/product/:id/reviews` |
| **Related products** | product-card rail, stagger reveal |
| **Delivery info & trust** | hairline rows: complimentary islandwide delivery, secure payment, mystery gift |

---

## 7. Cart

Route `/shopping/cart` (`Cart.jsx`). **`MobileBottomNav` is hidden here** (the page has its own bottom bar).

| Element | Desktop | Mobile |
|---|---|---|
| **Layout** | 2-col: items list + sticky summary aside | single column, stacked |
| **Line item** | image (rounded-2xl) + name/variant + qty stepper + remove + price | compact row, swipe/`Trash2` remove |
| **Summary** | subtotal · discount · shipping · total (mono), `rounded-3xl` panel | collapsible above sticky bar |
| **Coupon field** | input + "Apply" `Btn`, inline `FieldError`/success | full-width |
| **Delivery estimate** | free-shipping progress toward **LKR 20,000** threshold | same, condensed |
| **Checkout button** | full-width gold `Btn lg` → `/shopping/checkout` | **`fixed bottom-0 z-50`** bar: Total + "Checkout" |
| **Empty cart** | cinematic empty illustration + "Browse drops" `Btn`, `/cart-empty-cinematic.jpg` | same, centered |

---

## 8. Checkout

**Standalone flow** — Checkout, Manual Payment, Card Payment, Find Payment render under `CheckoutLayout` (no site header/footer/bottom-nav; each page carries its own minimal **"Secure Checkout · SSL"** header at `sticky top-0 z-40`). The mystery-gift FAB is suppressed on these paths. URLs remain `/shopping/*`.

| Step / element | Spec |
|---|---|
| **Header** | own header h-80px, wordmark left, "Secure Checkout · SSL" gold-bordered pill right; "Fast Guest Checkout" chip `sm+` |
| **Progress stepper** | 1-2-3 circles (`Contact → Delivery → Payment`), active = gold ring + glow, complete = filled gold; `max-w-2xl` centered, `mb-10` |
| **Guest checkout** | allowed (no login wall); guest registered via `checkGuest`/`registerGuest` |
| **Address form** | stacked fields (Full name, Email, Phone, Alt phone, address); inputs `border-b` focus-gold; inline `FieldError` |
| **Delivery options** | radio cards; complimentary islandwide; free-shipping note |
| **Payment methods** | Manual bank transfer (primary, LKR), demo card gateway (PayHere placeholder); radio cards w/ icons |
| **Order review** | item list + totals (mono); edit links back to steps |
| **Sticky CTA (mobile)** | `fixed bottom-0 z-50 lg:hidden`: Total (mono 24px) + full-width "Complete Order" `h-14 rounded-xl` gold; page root `pb-32 md:pb-12` clears it |
| **Manual payment page** | reference number hero (`text-3xl→5xl`, `break-all`), copy-to-clipboard, bank details grid, receipt upload (`ProofSubmission`), vertical status timeline, WhatsApp concierge; floating WhatsApp FAB `md:hidden` |
| **Success page** | `/shopping/checkout-success` (storefront-chromed): cinematic checkmark, order id, "Track Order" + "Return to shop"; review CTAs |

---

## 9. User Account

Routes under `/shopping/*` (storefront chrome). Protected (guests redirected to `/`).

| Area | Route | Spec |
|---|---|---|
| **Dashboard / summary** | `/shopping/account` | greeting, recent orders, rewards, quick links; `rounded-3xl` cards |
| **Profile** | account | name/email/phone; `PhoneCompletionBanner` prompts missing phone |
| **Orders** | `/shopping/orders` | filter pills (All/Pending/Processing/Shipped/Delivered/Cancelled) with animated `layoutId` pill; order cards (image + status badges + meta grid + Track/Upload-receipt CTAs); skeleton (4× `h-52` pulse); empty = package icon panel |
| **Order tracking** | `/shopping/order-tracking` | 5-step horizontal progress, items list, sticky summary (`lg:sticky lg:top-32`); responsive `px-4 sm:px-6 lg:px-8`, long order-id `break-all` |
| **Wishlist** | `/shopping/wishlist` | product-card grid; empty state |
| **Rewards** | `/shopping/rewards` | points / perks |
| **Notifications** | `/shopping/notifications` | list + header bell dropdown (real-time via Socket.IO) |
| **Settings / password** | account | profile edit; password change (OTP reset flow at `/auth/*`) |
| **Addresses** | within account/checkout | saved addresses, default selector |

### Status badge vocabulary (`StatusBadge`, 17 states)

`pending · pending_payment · verification_pending · confirmed · shipped · delivered · cancelled · active · inactive · approved · rejected · live · published · draft · archived · suspended · banned` — each a hairline pill: `rounded-full px-3 py-1`, `.se-label` 10px `0.18em`, dot + label, tinted bg/text/border per state.

---

## 10. Search Experience

| Element | Spec |
|---|---|
| **Trigger** | header search icon (desktop) / bottom-nav "Search" tab (mobile) |
| **Overlay** | full-screen/drawer, dark scrim + backdrop blur, fade/slide 200ms |
| **Input** | large 16px, gold focus underline, clear `×`, `Search` icon |
| **Suggestions** | live product/category results as you type; image + name + price (mono) |
| **Recent searches** | chips (hairline pills), clear-all |
| **Trending searches** | gold-accent chips |
| **No results** | centered eyebrow + "No matches" + suggested categories `Btn outline` |
| **Voice search** | **`[proposed]`** mic affordance placeholder in input (not yet implemented) |

---

## 11. Navigation

### Desktop (`MainHeader`, `lg+`)

| Element | Spec |
|---|---|
| Bar | `sticky top-0 z-50`, h-72px, `max-w-[1600px]`, `px-6 lg:px-12`, transparent→solid on scroll |
| Wordmark | logo 32px + "Saga Elite" 20px / "Rare Fit Forever" caption (`hidden sm:flex`) |
| Nav links | `.se-label` 11px, hover = vertical text swap to gold + underline grow |
| **Mega menu** | hover dropdown, `max-w-[900px]`, `grid-cols-2 md:3 lg:4`, gold top-rule, category groups |
| Utilities | search · cart (badge) · wishlist · profile; icon buttons ≥40px |

### Mobile

| Element | Spec |
|---|---|
| **Bottom nav** (`MobileBottomNav`) | `md:hidden fixed bottom-0 z-50 h-16`, `pb-safe`; 5 tabs: **Home · Search · Categories · Wishlist · Account**; active = gold; animated count badge; **hidden on cart/checkout/success**; guest "Account" opens auth drawer |
| **Hamburger menu** | full-screen overlay; support links (Brand Story, Reach Out, Track Order) close drawer on tap |
| **Category drawer** | nested categories, hairline-separated, font-display links |
| **Auth** | sliding `AuthDrawer` (login/register live here; `/auth/login` redirects to `/`) |

---

## 12. Components

### 12.1 Buttons

Two systems coexist:

**A) Editorial `Btn`** (`editorial.jsx`) — storefront default.

- Base: `inline-flex items-center justify-center gap-2 .se-label tracking-[0.18em] transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] .se-focus`, `rounded-sm`, `whileTap scale 0.95`, disabled `opacity-50`.
- **Sizes:** `default` h-44 (`h-11`) `px-6` 11px · `sm` h-36 (`h-9`) `px-4` 10px · `lg` h-56 (`h-14`) `px-8` 12px · `icon` 40×40.
- **Variants:** `default` (gold `#f2ca50` → hover `#ffe088`, text `#3c2f00`) · `outline` (transparent, `#4d4635` border) · `ghost` · `secondary` (`#2a2a2a`) · `destructive` (`#93000a`) · `link` (gold, underline) · `invert` (`#e5e2e1` bg).

**B) shadcn `Button`** (`button.jsx`) — admin/utility. `rounded-md`, `focus-visible:ring-1 ring-ring`; sizes default h-36/`sm` h-32/`lg` h-40/`icon` 36; variants default/destructive/outline/secondary/ghost/link.

### 12.2 Inputs

| Variant | Spec |
|---|---|
| Editorial `Input` | `bg-transparent border-b border-[#4d4635]`, focus `border-[#f2ca50]`, placeholder `#99907c`, `py-2`, `.se-body`; error → `#ffb4ab` underline |
| `AUTH_INPUT` | full-width, `border-b`, `py-3`, 16px, focus-gold |
| shadcn `input` | bordered box, `rounded-md`, ring focus |

### 12.3 Other components (summary)

| Component | Key spec |
|---|---|
| **Dropdown** (`SortDropdown`) | trigger h-40, hairline border; listbox popover `min-w-200`, `bg-#0e0e0e` hairline, 180ms; full keyboard support, `role=listbox/option` |
| **Card** | `rounded-2xl/3xl`, `bg-#131313`/`#0b0b0b`, 1px hairline; hover lift |
| **Product card** | see §15 |
| **Badge / status** | `StatusBadge` pill (17 states); hype badges on cards |
| **Chip** | hairline pill `rounded-full px-3 py-1` 10px; `FilterPills` h-40 active-gold |
| **Accordion** (`Disclosure`) | hairline-top row, `py-5`, chevron rotate, height-collapse 300ms |
| **Tabs** | `FilterPills` (`role=tab`) animated underline `layoutId` |
| **Modal** | overlay `bg-black/75` blur, panel `rounded-2xl` scale-in 280ms, `role=dialog aria-modal` |
| **Toast** | `se-toast`, slide/fade, variants default/success/destructive |
| **Tooltip** | dark surface, hairline, 12px label *(use sparingly; prefer inline labels)* |
| **Carousel** | drag/scroll-snap product rails; stagger reveal |
| **Pagination** | numbered + prev/next, ≥44px targets |
| **Breadcrumbs** | `.se-label` + `ChevronRight` 12px |
| **Table** | admin: hairline `border-white/10`, `px-3 py-2`, header `bg-white/5` |
| **Form** | label `.se-label`, `border-b` inputs, inline `FieldError` (animated, `role=alert`) |
| **Skeleton** | `animate-pulse` surface blocks matching final layout |
| **Empty state** | hairline panel, icon-in-circle, eyebrow + headline + CTA |
| **Error state** | `#ffb4ab` text + `AlertCircle`; destructive panels `#93000a` tint |

---

## 13. Exact Measurements

Per-component states. (`h-11`=44px, `h-12`=48, `h-10`=40, `h-9`=36, `h-14`=56.)

### Primary button (`Btn default`, gold)
| Property | Value |
|---|---|
| Height / padding | 44px / `px-6` (24) |
| Radius | 4px (`rounded-sm`) |
| Font | `.se-label` 11px / 500 / `0.18em` |
| Icon | 14px, stroke 1.5 |
| Default | bg `#f2ca50`, text `#3c2f00`, border `#e9c349` |
| Hover | bg `#ffe088` |
| Active/press | `scale(0.95)` |
| Focus | ring `0 0 0 2px #0a0a0a, 0 0 0 4px #f2ca50` |
| Disabled | `opacity-50`, no pointer events |
| Loading | spinner 16–20px + label "Processing…" |

### Text input (editorial)
| Property | Value |
|---|---|
| Border | bottom 1px `#4d4635` |
| Padding | `py-2` (8) |
| Font | `.se-body` 14–16px, placeholder `#99907c` |
| Focus | underline `#f2ca50`, no ring |
| Error | underline + text `#ffb4ab`, `FieldError` below |
| Disabled | `opacity-50` |

### Size chip / Color swatch
| Property | SizeChip | ColorSwatch |
|---|---|---|
| Size | min-w 48 × h 48 | 32 (PDP) / 18 (card) |
| Radius | sharp | full |
| Selected | invert bg `#e5e2e1` | `ring-2 #f2ca50 ring-offset-2` + check |
| Disabled/OOS | strikethrough, muted | 35% opacity + diagonal strike |
| Focus | `.se-focus` ring | `.se-focus` ring |

### Status badge
| Property | Value |
|---|---|
| Shape / padding | `rounded-full` `px-3 py-1` |
| Font | `.se-label` 10px `0.18em` |
| Composition | 4px dot + label, tinted bg/text/border per state |

### Card
| Property | Value |
|---|---|
| Radius | 16–24px |
| Bg / border | `#131313`/`#0b0b0b` + 1px `#4d4635` or `white/5` |
| Padding | `p-5`–`p-8` (mobile `p-5`/`p-6`, desktop `p-8`/`p-10`) |
| Hover | border→gold, lift `y:-2/-4`, shadow `0 8px 30/40px rgba(212,175,55,.12–.15)` |

---

## 14. Banner Specifications

| Banner | Desktop | Tablet | Mobile | Aspect | Safe text area | Image guidance |
|---|---|---|---|---|---|---|
| **Hero** | full-bleed, `min-h 600px`–`100svh` | `min-h 70vh` | `min-h 80–90vh` | 16:9 / 21:9 | left or centered, ≤55% width, ≥`px-5 md:px-12` inset | dark subject side; gradient scrim `from-#0a0a0a/70`; focal point off-center |
| **Promotional** | `max-w-[1440px]`, h 360–480 | h 320 | h 240–280 | 21:9 → 2:1 | ≤60% width, 32px inset | one message + 1 CTA; keep gold CTA contrast |
| **Category** | grid cell | grid cell | full-width | 3:4 | bottom-left label | full-cover image, hairline frame |
| **Collection** | 7/5 split panels | stacked | stacked | 16:10 | copy column separate | editorial photography, hover zoom 1.04 |

**Recommended export sizes `[proposed]`:** hero `2560×1440` (and `1080×1350` mobile crop), promo `2560×1097` (21:9), category `1200×1600` (3:4), all `.webp` ≤300KB, `loading="lazy"` except first hero (`eager`).

---

## 15. Product Card Specifications

From `ProductCard.jsx` — the canonical storefront product tile.

| Property | Value |
|---|---|
| **Container** | `flex flex-col gap-3`, transparent; hover `y:-4` (300ms, editorial ease) |
| **Image frame** | `rounded-2xl`, `bg-#111`, border `white/5`; hover border `#D4AF37/30` + shadow `0 8px 30px rgba(212,175,55,.15)` |
| **Image ratio** | `aspect-[3/4]` mobile → `md:aspect-[4/5]`; `tall` variant `aspect-square` |
| **Image hover** | scale `1.05` (700ms, `0.25,0.46,0.45,0.94`); secondary image cross-fade if present |
| **Skeleton** | `bg-#1a1a1a animate-pulse` + spinner until `onLoad`; fade `opacity 0→100` |
| **Badges (top-left)** | stacked, **max 2**, priority: Sold-out → Low(`N LEFT`) → Limited → Rare → Drop → New → Bestseller → Most-wished → Deal/Offer. 9px `0.28em`, hairline, `backdrop-blur` |
| **Drop-ending (top-right)** | only when drop ends <24h; `#93000a` pulse pill `ENDS · HH:MM:SS` |
| **Slide-up actions (hover)** | bottom bar translate-y reveal (300ms): **View** (ghost) · **Wishlist** (heart, spring `600/10`, fills gold) · **Quick Add** (gold; opens size overlay if multi-variant) |
| **Size preview strip** | hover-revealed informational sizes (mono 10px), low-stock gold dot, OOS strikethrough |
| **Wishlist placement** | center of slide-up bar; `aria-pressed`, `aria-label` |
| **Title** | `font-sans` 13px / 700 / UPPER `tracking-widest`, `line-clamp-1` |
| **Category** | `#99907c` 10px UPPER `tracking-widest` |
| **Price hierarchy** | `font-mono` 14px gold `#f2ca50` `tabular-nums`; hover gold text-glow; original struck-through 10px gray; "Only N left" / "Sold out" `#ffb4ab` 9px |
| **Color swatches** | render at ≥2 colors; `ColorSwatch` 18px (max 5 + "+N"); hover swaps image, click locks |
| **Mobile layout** | 2-col grid; actions remain tap-reachable (Quick Add primary); badges capped at 2 |

---

## 16. Accessibility (WCAG 2.2 AA)

| Area | Standard | Status in code |
|---|---|---|
| **Touch targets** | **≥ 48×48px** | ✅ `SizeChip` 48; ⚠️ `ColorSwatch` 18–32, icon buttons 40 — **`[proposed]`** pad hit-area to 44–48 (e.g. wrap with padding) |
| **Keyboard nav** | full | ✅ `SortDropdown`/`Disclosure`/`FilterPills` Arrow/Enter/Esc/Home/End; ensure modals trap focus |
| **Focus indicators** | visible, ≥3:1 | ✅ `.se-focus` `0 0 0 2px #0a0a0a, 0 0 0 4px #f2ca50` |
| **Color contrast** | text 4.5:1, large/UI 3:1 | ✅ `#e5e2e1` on `#0e0e0e` ≈ 14:1; ⚠️ audit `#574500`/`#99907c` small text & gold-on-dark for AA, raise to `#d0c5af` where needed |
| **Screen reader** | labels/roles | ✅ ARIA on custom controls; ⚠️ verify all icon-only buttons + images have labels/alt |
| **Semantic HTML** | landmarks/headings | use `<header><nav><main><footer>`, one `<h1>`/page, ordered heading levels |
| **Alt text** | descriptive | product alt = name; decorative imagery `alt=""`/`aria-hidden` |
| **Reduced motion** | honored | ✅ `useReducedMotion()` in `Reveal`/`AnimatedLogo`; extend to all infinite loops |
| **Forms** | label + error association | ✅ `FieldError` `role=alert aria-live=polite`; add `aria-describedby` linking input↔error |

---

## 17. Developer Handoff

### 17.1 Tailwind token mapping

Use semantic classes; avoid new literal hexes — extend the config instead.

| Intent | Class |
|---|---|
| Page bg / text | `bg-background text-foreground` (`#0e0e0e`/`#e5e2e1`) |
| Card | `bg-card border border-border` |
| Primary action | `bg-primary text-primary-foreground hover:bg-primary/90` (or editorial `Btn`) |
| Accent / gold deep | `text-accent` / `bg-accent` (`#d4af37`) |
| Muted text | `text-muted` / `text-muted-foreground` |
| Hairline | `border-border` (`#4d4635`) / `.se-hairline` |
| Focus | `.se-focus` |
| Type | `.se-serif .se-headline .se-display .se-wordmark .se-body .se-label .se-mono` |

### 17.2 CSS variables / design tokens `[proposed]`

The system is currently Tailwind-token-driven (no runtime CSS custom properties except ad-hoc `--accent`). To formalize, expose tokens as CSS vars in `:root` mirroring §18, e.g.:

```css
:root {
  --se-bg: #0e0e0e;        --se-fg: #e5e2e1;
  --se-gold: #f2ca50;      --se-gold-deep: #d4af37;  --se-gold-light: #ffe088;
  --se-surface: #131313;   --se-border: #4d4635;
  --se-muted: #d0c5af;     --se-muted-2: #99907c;    --se-danger: #ffb4ab;
  --se-radius-sm: 4px;     --se-radius-lg: 8px;      --se-radius-2xl: 16px;
  --se-ease-editorial: cubic-bezier(.22,1,.36,1);
  --se-dur-standard: 250ms; --se-dur-reveal: 550ms;
}
```

### 17.3 Figma Auto Layout settings `[proposed]`

- **Frames:** Auto Layout, vertical, gap = 8px multiples; padding tokens 16/24/32/48.
- **Constraints:** content frames `max-w` 1280/1440 centered; full-bleed sections stretch.
- **Components & variants:** `Button` (variant: default/outline/ghost/secondary/destructive/link/invert × size: sm/default/lg/icon × state: default/hover/focus/disabled/loading); `ProductCard` (state: default/hover/sold-out, badges 0–2); `StatusBadge` (17 status variants); `Input` (default/focus/error/disabled).
- **Styles:** publish color + text styles named per §18 (`color/gold`, `text/label`, etc.).

### 17.4 Naming conventions

- Utility type classes: `se-*` prefix. Data/test hooks: `data-testid` kebab. Components: PascalCase. Booleans: `is*/has*`. Routes: `/shopping/*` storefront, `/admin/*` admin, `/auth/*` auth.
- Reuse `axiosInstance`; gate admin UI with `PermissionGuard` + backend `requirePermission`.

### 17.5 Responsive implementation notes

- Mobile-first: base styles target ≤640; layer `sm/md/lg/xl`.
- Guard fixed bottom bars against `MobileBottomNav` (`h-16`): pages with their own bottom bar must hide the nav (cart/checkout) **or** add `pb-28`+ clearance.
- Honor safe-area (`pb-safe`/`env(safe-area-inset-bottom)`) on all `fixed bottom-0` bars.
- Lenis hijacks `window.scrollTo` — don't rely on pixel scroll math in tests; use element/`scrollIntoView`.
- Scrollbars are globally hidden — never depend on visible scrollbar affordance; ensure scroll regions are discoverable.

---

## 18. Token Reference Appendix

**Color tokens**

```
background #0e0e0e   foreground #e5e2e1
surface #131313  surface-1 #1f1f1f  surface-2 #2a2a2a  surface-3 #393939
admin-shell #050505  admin-card #0b0b0b  (storefront page bg #0a0a0a)
primary/gold #f2ca50  gold-light #ffe088  accent/primary-hover #d4af37  on-gold #0e0e0e / #3c2f00
muted #d0c5af  muted-fg #99907c  faint #574500
border/input #4d4635  ring #f2ca50
destructive/sale #ffb4ab  destructive-solid #93000a  new #1D9E75
status-info #a4d2e2  status-success #a8d8b6  status-pending-info #a8c8ec
```

**Radius:** sm 4 · md 6 · lg 8 · xl 12 · 2xl 16 · 3xl 24 · [2rem] 32 · [2.5rem] 40 · full 9999
**Shadows:** gold `0 0 40px rgba(242,202,80,.15)` · elegant `0 4px 60px rgba(0,0,0,.4)` · focus `0 0 0 2px #0a0a0a, 0 0 0 4px #f2ca50`
**Easing:** editorial `.22,1,.36,1` · cinematic `.19,1,.22,1` · payment `.16,1,.3,1` · image `.25,.46,.45,.94`
**Durations:** micro 150–200 · standard 250–300 · reveal 550 · image 600–700 · cinematic 800–1200 (max 1200) ms
**Breakpoints:** sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536
**Containers:** header 1600 · content 1280 · editorial 1440 · payment 1080 · reading 672/768
**Fonts:** Cinzel (display/wordmark) · Playfair Display (headline) · Inter (body/label) · JetBrains Mono (numeric)

---

*Generated from the live Saga Elite codebase. Values marked `[proposed]` are recommendations not yet in code; everything else reflects shipped implementation. When the code changes, update this document alongside it.*
