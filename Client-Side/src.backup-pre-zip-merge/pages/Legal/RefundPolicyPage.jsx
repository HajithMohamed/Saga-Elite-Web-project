import React from "react";
import LegalLayout from "@/components/Legal/LegalLayout";
import usePageMeta from "@/hooks/use-page-meta";

const LAST_UPDATED = "May 2, 2026";

const RefundPolicyPage = () => {
  usePageMeta({
    title: "Refund & Return Policy",
    description:
      "Understand Saga Elite return eligibility, exchange policy, and non-refundable items.",
  });

  return (
    <LegalLayout title="Refund & Return Policy" lastUpdated={LAST_UPDATED}>
      <section className="space-y-3">
        <h2 id="all-sales-final" className="text-xl font-semibold text-white">
          All sales are final
        </h2>
        <p className="font-medium text-[#D4AF37]">
          All products are definitively NON-REFUNDABLE. We do not offer refunds under any circumstances.
        </p>
        <p>
          We take strict measures to ensure quality, but exchanges may be considered for defective or damaged items only, subject to management review. We do not offer store credit or exchanges for general changes of mind.
        </p>
      </section>

      <section className="space-y-3">
        <h2 id="return-window" className="text-xl font-semibold text-white">
          Return window
        </h2>
        <p>
          Our return window for exchanging defective or damaged items is 14 days from the delivery date. Items reported outside this 14-day window will not be eligible for review or exchange.
        </p>
      </section>

      <section className="space-y-3">
        <h2 id="defective-damaged" className="text-xl font-semibold text-white">
          Defective or damaged items
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>If you receive a defective or damaged item, you must report it within 5 days of delivery.</li>
          <li>To report an issue, please send clear photo proof of the defect or damage via WhatsApp to <strong>+94 77 070 4274</strong>.</li>
          <li>Upon review, if the item is approved for exchange, we will provide further instructions.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="return-shipping" className="text-xl font-semibold text-white">
          Return shipping
        </h2>
        <p>
          For any approved exchange, the return shipping cost must be paid by the customer. We recommend using a trackable shipping service, as we cannot guarantee that we will receive your returned item.
        </p>
      </section>

      <section className="space-y-3">
        <h2 id="refunds-manual-payments" className="text-xl font-semibold text-white">
          Manual payment refunds
        </h2>
        <p>
          In the rare operational exception where a manual payment refund is applicable and authorized by management (e.g., if an approved exchange item is permanently out of stock):
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Refunds will be processed via bank transfer to the customer's account.</li>
          <li>Please expect 7-14 business days for the funds to be credited to your account.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="contact-for-returns" className="text-xl font-semibold text-white">
          Contact us for returns
        </h2>
        <p>
          To initiate a defect report or if you have any questions about this policy, contact us:
        </p>
        <ul className="list-none space-y-1">
          <li><strong>Email:</strong> sagaaelite@gmail.com</li>
          <li><strong>WhatsApp:</strong> +94 77 070 4274</li>
        </ul>
      </section>
    </LegalLayout>
  );
};

export default RefundPolicyPage;
