import React from "react";
import { Link } from "react-router-dom";
import LegalLayout from "@/components/Legal/LegalLayout";
import usePageMeta from "@/hooks/use-page-meta";
import { CONTACT_INFO } from "@/config";

const LAST_UPDATED = "April 29, 2026";

const TermsConditionsPage = () => {
  usePageMeta({
    title: "Terms & Conditions",
    description:
      "Read the terms and conditions for using Saga Elite and placing orders on our store.",
  });

  return (
    <LegalLayout title="Terms & Conditions" lastUpdated={LAST_UPDATED}>
      <section className="space-y-3">
        <h2 id="acceptance-of-terms" className="text-xl font-semibold text-white">
          Acceptance of terms
        </h2>
        <p>
          By accessing or using Saga Elite, you agree to these terms and
          conditions. If you do not agree, please discontinue use of the site.
        </p>
      </section>

      <section className="space-y-3">
        <h2 id="about-saga-elite" className="text-xl font-semibold text-white">
          About Saga Elite
        </h2>
        <p>
          Saga Elite is a Sri Lankan fashion and lifestyle brand offering
          limited-edition apparel and accessories through our online store.
        </p>
      </section>

      <section className="space-y-3">
        <h2 id="user-accounts" className="text-xl font-semibold text-white">
          User accounts and responsibilities
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>You must provide accurate and complete information.</li>
          <li>You are responsible for keeping your account secure.</li>
          <li>
            Prohibited activities include fraud, abuse, scraping, or reselling
            without permission.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="products-pricing" className="text-xl font-semibold text-white">
          Products and pricing
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>We reserve the right to change prices without prior notice.</li>
          <li>Product images are representative; colors may vary slightly.</li>
          <li>We reserve the right to limit quantities.</li>
          <li>All prices are in LKR unless stated otherwise.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="ordering-payment" className="text-xl font-semibold text-white">
          Ordering and payment
        </h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Select your items and add them to the cart.</li>
          <li>Review your order and proceed to checkout.</li>
          <li>Provide delivery details and choose a payment method.</li>
          <li>Confirm your order and wait for confirmation.</li>
        </ol>
        <ul className="mt-3 list-disc pl-5 space-y-2">
          <li>
            Online payments are processed by PayHere (card, wallet, or internet
            banking).
          </li>
          <li>
            Manual bank transfers use a reference number in the format
            SAGA-[ID]-[DATE]-[CODE] to identify your order.
          </li>
          <li>
            We will confirm your order once payment is verified and items are
            available.
          </li>
          <li>We reserve the right to cancel orders for any reason.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="shipping-delivery" className="text-xl font-semibold text-white">
          Shipping and delivery
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>We deliver to approved areas within Sri Lanka.</li>
          <li>Estimated timeframes include processing plus shipping.</li>
          <li>Risk transfers to the buyer once the order is shipped.</li>
          <li>We are not liable for courier delays beyond our control.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="returns-refunds" className="text-xl font-semibold text-white">
          Returns and refunds
        </h2>
        <p>
          Please review our{" "}
          <Link to="/legal/refund-policy" className="text-[#D4AF37]">
            Refund Policy
          </Link>{" "}
          for eligibility, timelines, and instructions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 id="intellectual-property" className="text-xl font-semibold text-white">
          Intellectual property
        </h2>
        <p>
          All site content, including images, text, and branding, is owned by
          Saga Elite. You may not reproduce or reuse content without written
          permission.
        </p>
      </section>

      <section className="space-y-3">
        <h2 id="limitation-of-liability" className="text-xl font-semibold text-white">
          Limitation of liability
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>The site is provided "as-is" without warranties.</li>
          <li>We are not liable for indirect or consequential damages.</li>
          <li>Maximum liability is capped at the value of your last order.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="governing-law" className="text-xl font-semibold text-white">
          Governing law
        </h2>
        <p>
          These terms are governed by the laws of Sri Lanka. Any disputes are
          subject to the jurisdiction of Sri Lankan courts.
        </p>
      </section>

      <section className="space-y-3">
        <h2 id="changes-to-terms" className="text-xl font-semibold text-white">
          Changes to terms
        </h2>
        <p>
          We may update these terms from time to time. Updates will be posted on
          this page with a new last-updated date.
        </p>
      </section>

      <section className="space-y-3">
        <h2 id="contact" className="text-xl font-semibold text-white">
          Contact us
        </h2>
        <p>
          For questions about these terms, email {CONTACT_INFO.email} or contact
          us at {CONTACT_INFO.phone}.
        </p>
      </section>
    </LegalLayout>
  );
};

export default TermsConditionsPage;
