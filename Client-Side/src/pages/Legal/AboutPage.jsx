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
        <h2 id="our-story" className="text-2xl font-semibold text-white">
          Our Story
        </h2>
        <div className="grid gap-6">
          <div className="space-y-4 text-white/80">
            <p>
              Welcome to Saga Elite—a proudly Sri Lankan fashion and lifestyle brand born from a love for modern style and premium craftsmanship. 
            </p>
            <p>
              We started with a simple belief: that everyone deserves access to high-quality, contemporary fashion without the exclusive price tags. Rooted in local culture but inspired by global trends, Saga Elite is more than just clothing. It’s about building a community of individuals who express themselves boldly every single day.
            </p>
            <p>
              Our pieces are carefully designed with premium quality materials, ensuring that every drop not only looks incredible but feels like it was made just for you. From our local roots to your wardrobe, we're dedicated to bringing you approachable, elevated fashion that fits seamlessly into your lifestyle.
            </p>
          </div>
          
          <div className="h-80 w-full rounded-lg border-2 border-dashed border-white/20 bg-[#0a0a0a] flex flex-col items-center justify-center text-white/40 my-6">
            <svg
              className="w-12 h-12 mb-3 text-white/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="text-sm font-medium uppercase tracking-widest">Team Photo Placeholder</span>
            <span className="text-xs mt-1 text-white/30">Upload your amazing team here</span>
          </div>

          <div className="space-y-4 text-white/80">
            <p>
              We're a close-knit team that treats our community like family. Whether you're picking up your very first essential tee or lining up for one of our limited drops, we want your experience with Saga Elite to be completely personal. 
            </p>
            <p>
              Thanks for being a part of our story. We can't wait to see how you style your Saga Elite gear!
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 mt-12 pt-8 border-t border-white/10">
        <h2 id="contact-cta" className="text-xl font-semibold text-white">
          Get in Touch
        </h2>
        <p className="text-white/80">
          Have questions, feedback, or just want to say hi? We'd love to hear from you.
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center justify-center rounded border border-[#D4AF37]/40 px-5 py-2 text-xs uppercase tracking-[0.2em] text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors mt-2"
        >
          Contact Saga Elite
        </Link>
      </section>
    </LegalLayout>
  );
};

export default AboutPage;
