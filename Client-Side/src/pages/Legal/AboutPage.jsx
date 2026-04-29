import React from "react";
import { Link } from "react-router-dom";
import LegalLayout from "@/components/Legal/LegalLayout";
import usePageMeta from "@/hooks/use-page-meta";

const AboutPage = () => {
  usePageMeta({
    title: "About Us",
    description:
      "Discover the story, values, and products behind the Saga Elite brand.",
  });

  return (
    <LegalLayout title="About Us">
      <section className="space-y-4">
        <h2 id="hero" className="text-xl font-semibold text-white">
          Hero
        </h2>
        {/* TODO: Replace with approved brand tagline and hero image. */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <p className="text-lg text-white">
              Saga Elite is built for bold self-expression and timeless street
              culture.
            </p>
            <p>
              We blend Sri Lankan creativity with global fashion energy to create
              limited-edition fits that feel personal, powerful, and rare.
            </p>
          </div>
          <div className="h-48 w-full rounded border border-white/10 bg-[#0f0f0f] flex items-center justify-center text-white/40">
            Image placeholder
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 id="our-story" className="text-xl font-semibold text-white">
          Our story
        </h2>
        {/* TODO: Replace with the authentic brand origin story. */}
        <p>
          Saga Elite began as a small creative collective inspired by local
          streetwear and the confidence it brings. What started as a passion
          project grew into a lifestyle brand focused on quality, craft, and
          community.
        </p>
      </section>

      <section className="space-y-3">
        <h2 id="what-we-offer" className="text-xl font-semibold text-white">
          What we offer
        </h2>
        {/* TODO: Replace categories with the official product lineup. */}
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            "Limited-edition drops",
            "Everyday essentials",
            "Accessories & add-ons",
            "Seasonal collections",
          ].map((item) => (
            <div
              key={item}
              className="rounded border border-white/10 bg-[#0f0f0f] px-4 py-3"
            >
              <p className="text-sm text-white/80">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 id="why-choose-us" className="text-xl font-semibold text-white">
          Why choose us
        </h2>
        {/* TODO: Replace value propositions with approved messaging. */}
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              title: "Quality first",
              copy: "Carefully selected fabrics and reliable construction.",
            },
            {
              title: "Fast delivery",
              copy: "Prompt dispatch across Sri Lanka with trusted couriers.",
            },
            {
              title: "Personal service",
              copy: "Friendly support that treats every order with care.",
            },
            {
              title: "Easy returns",
              copy: "Clear, fair return policy for peace of mind.",
            },
          ].map((value) => (
            <div
              key={value.title}
              className="rounded border border-white/10 bg-[#0f0f0f] px-5 py-4"
            >
              <h3 className="text-sm font-semibold text-white">
                {value.title}
              </h3>
              <p className="mt-2 text-sm text-white/70">{value.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 id="how-to-shop" className="text-xl font-semibold text-white">
          How to shop
        </h2>
        {/* TODO: Update steps to match the final checkout flow. */}
        <ol className="list-decimal pl-5 space-y-2">
          <li>Browse the latest drops and select your fit.</li>
          <li>Place your order and choose a payment method.</li>
          <li>Receive delivery and enjoy your Saga Elite gear.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 id="contact-cta" className="text-xl font-semibold text-white">
          Contact us
        </h2>
        {/* TODO: Replace CTA copy when brand messaging is finalized. */}
        <p>
          Have questions or want to collaborate? Reach out and we will get back
          to you shortly.
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center justify-center rounded border border-[#D4AF37]/40 px-5 py-2 text-xs uppercase tracking-[0.2em] text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
        >
          Contact Saga Elite
        </Link>
      </section>
    </LegalLayout>
  );
};

export default AboutPage;
