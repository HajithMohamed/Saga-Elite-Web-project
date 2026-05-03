import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Mail,
} from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { CONTACT_INFO } from "@/config";
import SagaLoader from "@/components/ui/SagaLoader";
import HomeHero from "@/components/ui/HomeHero";
import {
  Btn,
  Countdown,
  Eyebrow,
  Hairline,
  Img,
  Marquee,
  PullQuote,
  Reveal,
} from "@/components/ui/editorial";

const InstagramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
    />
  </svg>
);

const FacebookIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
    />
  </svg>
);

const TikTokIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
    />
  </svg>
);

const Home = () => {
  const reduced = useReducedMotion();
  const [heroImages, setHeroImages] = useState([]);
  const [categoryLogos, setCategoryLogos] = useState({ Boys: null, Girls: null, Unisex: null });
  const [adImage, setAdImage] = useState(null);
  const [activeProducts, setActiveProducts] = useState([]);
  const [nextDrop, setNextDrop] = useState(null);
  const [isHomepageLoading, setIsHomepageLoading] = useState(true);
  const [homepageError, setHomepageError] = useState(null);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [heroReady, setHeroReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchHomepageData = async () => {
      setIsHomepageLoading(true);
      setHomepageError(null);

      try {
        const [
          heroRes,
          boysRes,
          girlsRes,
          unisexRes,
          adRes,
          activeProductsRes,
          dropsRes,
        ] = await Promise.all([
          axios.get(`${API_BASE}/image/get-hero-images`).catch(() => null),
          axios.get(`${API_BASE}/image/get-category-logo-images?label=Boys`).catch(() => null),
          axios.get(`${API_BASE}/image/get-category-logo-images?label=Girls`).catch(() => null),
          axios.get(`${API_BASE}/image/get-category-logo-images?label=Unisex`).catch(() => null),
          axios.get(`${API_BASE}/image/get-ad-images`).catch(() => null),
          axios.get(`${API_BASE}/products/get-all-products?status=active&limit=8`).catch(() => null),
          axios.get(`${API_BASE}/drops/get-all-drops`).catch(() => null),
        ]);

        if (cancelled) return;

        if (heroRes?.data?.images?.length) setHeroImages(heroRes.data.images);

        setCategoryLogos({
          Boys: boysRes?.data?.images?.[0] || null,
          Girls: girlsRes?.data?.images?.[0] || null,
          Unisex: unisexRes?.data?.images?.[0] || null,
        });
        if (adRes?.data?.images?.length) setAdImage(adRes.data.images[0]);
        if (activeProductsRes?.data?.data) setActiveProducts(activeProductsRes.data.data);

        const drops = Array.isArray(dropsRes?.data?.drops) ? dropsRes.data.drops : [];
        const availableDrops = drops
          .filter((d) => !d?.endDate || new Date(d.endDate) > new Date())
          .sort((a, b) => new Date(a.releaseDate || 0) - new Date(b.releaseDate || 0));

        const upcoming =
          availableDrops.find((d) => d?.releaseDate && new Date(d.releaseDate) > new Date()) || null;
        const live =
          availableDrops.find((d) => !d?.releaseDate || new Date(d.releaseDate) <= new Date()) || null;
        setNextDrop(upcoming || live);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load homepage data", error);
          setHomepageError("Unable to load homepage products. Please refresh the page.");
        }
      } finally {
        if (!cancelled) setIsHomepageLoading(false);
      }
    };

    fetchHomepageData();
    return () => {
      cancelled = true;
    };
  }, []);

  const heroImageUrls = useMemo(
    () =>
      (heroImages || [])
        .map((img) => img?.url)
        .filter(Boolean),
    [heroImages]
  );
  const heroSrc = heroImageUrls[0] || null;
  const dropName = (nextDrop?.name || "").toString();
  const dropTagline = (nextDrop?.description || "").toString();
  const dropTarget = nextDrop?.releaseDate ? new Date(nextDrop.releaseDate) : null;
  const dropEyebrow = nextDrop ? `Drop · ${dropName || "By appointment"}` : "Drop · By appointment";
  const dropTopRight = useMemo(() => {
    if (!dropTarget || Number.isNaN(dropTarget.getTime())) return "Friday · 18:00";
    return dropTarget.toLocaleString("en-US", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }, [dropTarget]);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email");
    console.log("Newsletter signup:", email);
    setNewsletterSuccess(true);
    e.currentTarget.reset();
    setTimeout(() => setNewsletterSuccess(false), 5000);
  };

  const featuredProducts = activeProducts.slice(0, 3);

  return (
    <div className="bg-[#0a0a0a] text-[#e5e2e1] min-h-screen w-full overflow-x-hidden se-body">
      <SagaLoader onDone={() => setHeroReady(true)} />

      <main>
        {/* HERO ── editorial composition with multi-image slideshow */}
        <HomeHero
          imageSrc={heroSrc}
          images={heroImageUrls}
          ready={heroReady || true}
          eyebrow={dropEyebrow.toUpperCase()}
          topLeft={nextDrop ? `Chapter · ${dropName || "Now"}` : "Chapter · Atelier"}
          topRight={nextDrop ? `Drops ${dropTopRight}` : "Open · By appointment"}
          paragraph={
            dropTagline ||
            "Hand-finished in Sri Lanka, sent to ninety-three countries. Nothing restocks. Everything is considered."
          }
          pieces={String(activeProducts.length || "—").padStart(3, "0")}
          photographedAt="Mirissa, 2026"
          madeIn="Battaramulla, Sri Lanka"
          scrollHintTargetId="atelier-marquee"
          primaryCta={
            <Link to="/shopping/product-list">
              <Btn variant="default" iconRight={ArrowRight}>Take a closer look</Btn>
            </Link>
          }
          secondaryCta={
            nextDrop?.slug ? (
              <Link to={`/shopping/drop/${nextDrop.slug}`}>
                <Btn variant="outline">Read the chapter</Btn>
              </Link>
            ) : (
              <Link to="/about">
                <Btn variant="outline">Read the chapter</Btn>
              </Link>
            )
          }
        />

        {/* VALUES MARQUEE */}
        <div id="atelier-marquee">
          <Marquee
            tone="gold"
            items={[
              "Made in Sri Lanka",
              "Hand-finished",
              "Free island-wide delivery",
              "Members enter first",
              "No restock",
              "Ninety-three countries",
            ]}
          />
        </div>

        {/* DROP COUNTDOWN BAND */}
        {dropTarget && (
          <section className="px-5 md:px-12 py-16 md:py-28 border-b border-[#4d4635]/40 bg-[#131313]">
            <Reveal>
              <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
                <div className="max-w-xl">
                  <Eyebrow tone="gold" size="md">Drops in</Eyebrow>
                  <h2 className="mt-5 se-serif text-[#e5e2e1] leading-[1.05] text-3xl md:text-5xl">
                    {nextDrop?.name
                      ? `${nextDrop.name} opens.`
                      : "The next chapter opens."}
                  </h2>
                  <p className="mt-5 se-body text-[#d0c5af] text-sm md:text-base leading-relaxed">
                    {nextDrop?.description ||
                      "Members receive private viewing thirty-six hours earlier. The atelier closes at seven on Thursday."}
                  </p>
                </div>
                <Countdown target={dropTarget} variant="editorial" />
              </div>
            </Reveal>
          </section>
        )}

        {/* IN THE ATELIER ── asymmetric featured products */}
        {!isHomepageLoading && featuredProducts.length > 0 && (
          <section className="px-5 md:px-12 py-16 md:py-28 bg-[#0a0a0a]">
            <div className="mb-10 md:mb-12 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <Eyebrow tone="gold" size="md">Now in the atelier</Eyebrow>
                <h2 className="mt-3 md:mt-4 se-serif text-[#e5e2e1] text-3xl md:text-5xl">
                  Pieces, not products.
                </h2>
              </div>
              <Link
                to="/shopping/product-list"
                className="se-label text-[10px] tracking-[0.28em] text-[#f2ca50] hover:text-[#ffe088] inline-flex items-center gap-2"
              >
                See the catalogue <ArrowRight size={12} strokeWidth={1.5} />
              </Link>
            </div>

            <div className="space-y-12 md:space-y-16">
              {featuredProducts.map((product, idx) => {
                const slug = product.slug || product.productSlug || product._id;
                const discount = Number(product.discountPercent || 0);
                const salePrice = product.salePrice > 0 ? product.salePrice : null;
                const basePrice = product.basePrice;
                const priceLabel = (salePrice || basePrice || 0).toLocaleString();
                const number = String(idx + 1).padStart(3, "0");
                const mirror = idx % 2 === 1;

                return (
                  <Reveal key={product._id || slug || idx}>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-8">
                      <div
                        className={`md:col-span-7 ${mirror ? "md:order-2" : ""}`}
                      >
                        <Img
                          src={product.images?.[0]?.url || product.image || "/LOGO.png"}
                          ratio="4/5"
                          frame
                          hoverFade
                          alt={product.name}
                        />
                      </div>
                      <div
                        className={`md:col-span-5 flex flex-col justify-end pb-2 md:pb-6 ${
                          mirror ? "md:order-1" : ""
                        }`}
                      >
                        <Eyebrow tone="muted" size="xs">
                          N° {number} · {product.category || product.tag || "Atelier"}
                        </Eyebrow>
                        <h3 className="mt-3 md:mt-4 se-headline text-[#e5e2e1] text-2xl md:text-4xl">
                          {product.name || "Untitled piece"}
                        </h3>
                        <p className="mt-3 md:mt-4 se-body text-sm text-[#d0c5af] leading-relaxed max-w-md">
                          {product.shortDescription ||
                            product.description ||
                            "Quietly made. Hand-finished. Limited to a single chapter."}
                        </p>
                        <div className="mt-5 md:mt-6 flex items-baseline gap-3 flex-wrap">
                          <span className="se-mono text-2xl text-[#f2ca50]">
                            LKR {priceLabel}
                          </span>
                          {discount > 0 && basePrice ? (
                            <span className="se-mono text-sm text-[#574500] line-through">
                              LKR {Number(basePrice).toLocaleString()}
                            </span>
                          ) : null}
                          <span className="se-body text-sm text-[#99907c]">
                            — drop {nextDrop?.name || "in the atelier"}.
                          </span>
                        </div>
                        <div className="mt-5 md:mt-6 flex items-center gap-4">
                          <Link to={slug ? `/shopping/product/${slug}` : "/shopping/product-list"}>
                            <Btn size="sm" variant="default">Take it</Btn>
                          </Link>
                          <Link
                            to={slug ? `/shopping/product/${slug}` : "/shopping/product-list"}
                            className="se-label text-[10px] tracking-[0.28em] text-[#d0c5af] hover:text-[#e5e2e1]"
                          >
                            Read more
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </section>
        )}

        {/* CATEGORY LOCKUP */}
        <section className="px-5 md:px-12 py-16 md:py-24 bg-[#0e0e0e] border-y border-[#4d4635]/40">
          <div className="mb-10">
            <Eyebrow tone="gold" size="md">Pathways</Eyebrow>
            <h2 className="mt-3 se-serif text-[#e5e2e1] text-3xl md:text-5xl">
              Three directions.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { lbl: "Boys", logo: categoryLogos.Boys, sub: "Twenty-eight pieces" },
              { lbl: "Girls", logo: categoryLogos.Girls, sub: "Thirty-one pieces" },
              { lbl: "Unisex", logo: categoryLogos.Unisex, sub: "Twenty-five pieces" },
            ].map((c, idx) => (
              <Reveal key={c.lbl} delay={idx * 0.06}>
                <Link
                  to={`/shopping/product-list?category=${c.lbl.toLowerCase()}`}
                  className="block group"
                >
                  <div
                    className="relative overflow-hidden border border-[#4d4635]"
                    style={{ aspectRatio: "4/5" }}
                  >
                    {c.logo?.url ? (
                      <img
                        src={c.logo.url}
                        alt={c.lbl}
                        className="w-full h-full object-cover transition-[filter] duration-[600ms] group-hover:grayscale"
                      />
                    ) : (
                      <div className="se-img-fallback w-full h-full">
                        <span className="se-label text-[10px] tracking-[0.3em]">{c.lbl}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/85 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                      <div>
                        <h3 className="se-headline text-[#fafafa] text-3xl">{c.lbl}</h3>
                        <Eyebrow tone="muted" size="xs" className="mt-2 block">
                          {c.sub}
                        </Eyebrow>
                      </div>
                      <ArrowUpRight
                        size={20}
                        strokeWidth={1.25}
                        className="text-[#f2ca50] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                      />
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* EDITORIAL SPREAD with pull quote */}
        {adImage?.url ? (
          <section className="relative">
            <div className="relative h-[360px] md:h-[640px] overflow-hidden">
              <img src={adImage.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/90 via-[#0a0a0a]/40 to-transparent" />
            </div>
            <div className="px-5 md:px-12 py-12 md:py-20 max-w-4xl">
              <PullQuote attribution="From the atelier">
                We do not chase the season. We do not chase anyone. A piece is finished when
                it is finished.
              </PullQuote>
            </div>
          </section>
        ) : (
          <section className="px-5 md:px-12 py-16 md:py-24 bg-[#0a0a0a]">
            <div className="max-w-4xl">
              <PullQuote attribution="From the atelier">
                We do not chase the season. We do not chase anyone. A piece is finished when
                it is finished.
              </PullQuote>
            </div>
          </section>
        )}

        {/* FULL CATALOGUE PROMO if no featured */}
        {isHomepageLoading ? (
          <section className="px-5 md:px-12 py-16 md:py-24 bg-[#0a0a0a]">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col gap-3 animate-pulse">
                  <div className="aspect-[4/5] w-full bg-[#1c1b1b] border border-[#4d4635]" />
                  <div className="h-3 w-2/3 bg-[#1c1b1b]" />
                  <div className="h-3 w-1/3 bg-[#1c1b1b]" />
                </div>
              ))}
            </div>
          </section>
        ) : homepageError ? (
          <section className="px-5 md:px-12 py-16 md:py-24 bg-[#0a0a0a]">
            <div className="border border-[#93000a]/40 bg-[#93000a]/10 px-6 py-10 text-center">
              <p className="se-body text-[#ffb4ab]">{homepageError}</p>
            </div>
          </section>
        ) : null}

        {/* SOCIAL CTA — editorial form */}
        <section className="px-5 md:px-12 py-16 md:py-24 bg-[#0e0e0e] border-t border-[#4d4635]/40">
          <div className="max-w-3xl">
            <Eyebrow tone="gold" size="md">Read the journal</Eyebrow>
            <h2 className="mt-3 se-serif text-[#e5e2e1] text-3xl md:text-5xl">
              Follow at a slower pace.
            </h2>
            <p className="mt-4 se-body text-[#d0c5af] text-sm md:text-base max-w-xl leading-relaxed">
              Photographs from the atelier, occasional essays, and the first call when a chapter opens.
            </p>
            <Hairline className="mt-10" />
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a
                href={CONTACT_INFO?.socials?.instagram || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 se-label text-[10px] tracking-[0.28em] text-[#d0c5af] hover:text-[#f2ca50]"
              >
                <InstagramIcon className="h-4 w-4" />
                Instagram
              </a>
              <span className="text-[#4d4635]">·</span>
              <a
                href={CONTACT_INFO?.socials?.facebook || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 se-label text-[10px] tracking-[0.28em] text-[#d0c5af] hover:text-[#f2ca50]"
              >
                <FacebookIcon className="h-4 w-4" />
                Facebook
              </a>
              <span className="text-[#4d4635]">·</span>
              <a
                href={CONTACT_INFO?.socials?.tiktok || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 se-label text-[10px] tracking-[0.28em] text-[#d0c5af] hover:text-[#f2ca50]"
              >
                <TikTokIcon className="h-4 w-4" />
                TikTok
              </a>
            </div>
          </div>
        </section>

        {/* NEWSLETTER ── next chapter */}
        <section className="px-5 md:px-12 py-16 md:py-28 bg-[#131313]">
          <Reveal>
            <div className="max-w-3xl">
              <Eyebrow tone="gold" size="md">Next chapter</Eyebrow>
              <h2 className="mt-5 se-serif text-[#e5e2e1] leading-[1.05] text-3xl md:text-6xl">
                Receive the journal,<br />read it slowly.
              </h2>
              <p className="mt-6 se-body text-[#d0c5af] text-sm md:text-lg max-w-xl leading-relaxed">
                One email a fortnight. New drops, the occasional essay, and a private link to the
                lookbook before it goes public.
              </p>

              <form
                onSubmit={handleNewsletterSubmit}
                className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6"
              >
                <div className="flex-1 max-w-md w-full">
                  <Eyebrow tone="muted" size="xs">Email</Eyebrow>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="your.name@email.com"
                    className="mt-2 w-full bg-transparent border-b border-[#4d4635] focus:border-[#f2ca50] py-3 text-[#e5e2e1] placeholder:text-[#574500] outline-none se-body text-base transition-colors"
                  />
                </div>
                <Btn variant="default" type="submit" iconRight={Mail}>Subscribe</Btn>
              </form>

              <AnimatePresence>
                {newsletterSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: reduced ? 0.15 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-6 inline-flex items-center gap-2 se-label text-[11px] tracking-[0.24em] text-[#a8d8b6]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    You&apos;re on the list — watch your inbox.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </section>
      </main>
    </div>
  );
};

export default Home;
