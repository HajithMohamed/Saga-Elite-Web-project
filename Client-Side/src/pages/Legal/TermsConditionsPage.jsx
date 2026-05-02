import React from "react";
import { Link } from "react-router-dom";
import LegalLayout from "@/components/Legal/LegalLayout";
import usePageMeta from "@/hooks/use-page-meta";

const LAST_UPDATED = "May 2, 2026";

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
          There are no age restrictions on purchases, and we do not have any restricted product categories.
        </p>
      </section>

      <section className="space-y-3">
        <h2 id="products-pricing" className="text-xl font-semibold text-white">
          Products and pricing
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Prices are in LKR and subject to change without prior notice.</li>
          <li>Product images are representative; colors may vary slightly.</li>
          <li>We reserve the right to limit quantities.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="ordering-payment" className="text-xl font-semibold text-white">
          Ordering and payment
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Order confirmation is sent via email and WhatsApp upon successful placement.
          </li>
          <li>
            Manual payment orders require payment within 24 hours using the provided reference number.
          </li>
          <li>
            Our official banking details for manual bank transfers:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Bank:</strong> Sampath Bank</li>
              <li><strong>Branch:</strong> Hatton</li>
              <li><strong>A/C Number:</strong> 108052612262</li>
              <li><strong>Account Name:</strong> N.Gayathree</li>
            </ul>
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="shipping-delivery" className="text-xl font-semibold text-white">
          Shipping and delivery
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Delivery is strictly within Sri Lanka only.</li>
          <li>Estimated delivery time is 15 days from order confirmation.</li>
          <li>Risk transfers to the buyer once the order is shipped.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="returns-refunds" className="text-xl font-semibold text-white">
          Returns and refunds
        </h2>
        <p>
          Please review our{" "}
          <Link to="/legal/refund-policy" className="text-[#D4AF37]">
            Refund &amp; Return Policy
          </Link>{" "}
          for our policy on exchanges and final sales.
        </p>
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
        <h2 id="contact" className="text-xl font-semibold text-white">
          Contact us
        </h2>
        <p>
          For questions about these terms, contact us at:
        </p>
        <ul className="list-none space-y-1">
          <li><strong>Email:</strong> sagaaelite@gmail.com</li>
          <li><strong>WhatsApp / Phone:</strong> +94 77 070 4274</li>
        </ul>
      </section>
    </LegalLayout>
  );
};

export default TermsConditionsPage;
