import React from "react";
import LegalLayout from "@/components/Legal/LegalLayout";
import usePageMeta from "@/hooks/use-page-meta";
import { CONTACT_INFO, RETURN_WINDOW_DAYS } from "@/config";

const RefundPolicyPage = () => {
  const whatsappNumber = CONTACT_INFO.whatsapp.replace(/\D/g, "");

  usePageMeta({
    title: "Refund Policy",
    description:
      "Understand Saga Elite return eligibility, refund methods, and timelines.",
  });

  return (
    <LegalLayout title="Refund Policy">
      <section className="space-y-3">
        <h2 id="overview" className="text-xl font-semibold text-white">
          Overview
        </h2>
        <p>
          We want you to be happy with your purchase. Our return window is
          {" "}{RETURN_WINDOW_DAYS} days from the delivery date.
        </p>
      </section>

      <section className="space-y-3">
        <h2 id="eligibility-for-returns" className="text-xl font-semibold text-white">
          Eligibility for returns
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Item must be unused and in original condition.</li>
          <li>Original tags must be attached.</li>
          <li>Original packaging is required.</li>
          <li>
            Proof of purchase is required (order confirmation email or reference
            number).
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="non-refundable-items" className="text-xl font-semibold text-white">
          Non-refundable items
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Clearance or sale items.</li>
          <li>Customized or personalized items.</li>
          <li>Items that have been worn, washed, or altered.</li>
          <li>Items without original tags.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="how-to-initiate" className="text-xl font-semibold text-white">
          How to initiate a return
        </h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Contact us via email or WhatsApp within the return window.</li>
          <li>Provide your order reference number and reason for return.</li>
          <li>We will confirm eligibility and provide return instructions.</li>
          <li>Pack the item securely and ship it to our address.</li>
          <li>
            Refunds are processed within 5 to 7 business days after inspection.
          </li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 id="refund-methods" className="text-xl font-semibold text-white">
          Refund methods
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Card payments are refunded to the original card via PayHere.</li>
          <li>
            Manual bank transfer payments are refunded via bank transfer (we will
            request your account details).
          </li>
          <li>
            Processing time is 5 to 7 business days after we receive and inspect
            the item.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="damaged-or-defective" className="text-xl font-semibold text-white">
          Damaged or defective items
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Report issues within 5 days of delivery with photos.</li>
          <li>We will arrange collection or provide a prepaid return label.</li>
          <li>Full refund or replacement at your choice.</li>
          <li>No return shipping cost charged for defective items.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="order-cancellations" className="text-xl font-semibold text-white">
          Order cancellations
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Orders can be cancelled before shipping. Contact us immediately.</li>
          <li>Once shipped, the return process applies instead.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="contact-for-returns" className="text-xl font-semibold text-white">
          Contact for returns
        </h2>
        <p>
          Email{" "}
          <a className="text-[#D4AF37]" href={`mailto:${CONTACT_INFO.email}`}>
            {CONTACT_INFO.email}
          </a>{" "}
          or WhatsApp{" "}
          <a
            className="text-[#D4AF37]"
            href={`https://wa.me/${whatsappNumber}`}
          >
            {CONTACT_INFO.phone}
          </a>
          , referencing your order number.
        </p>
      </section>
    </LegalLayout>
  );
};

export default RefundPolicyPage;
