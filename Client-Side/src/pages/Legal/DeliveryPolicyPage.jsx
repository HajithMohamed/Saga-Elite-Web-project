import React from "react";
import LegalLayout from "@/components/Legal/LegalLayout";
import usePageMeta from "@/hooks/use-page-meta";
import { CONTACT_INFO } from "@/config";

const LAST_UPDATED = "May 2, 2026";

const DeliveryPolicyPage = () => {
  usePageMeta({
    title: "Delivery Policy",
    description: "Read Saga Elite's delivery policy, processing times, and shipping coverage across Sri Lanka.",
  });

  const whatsappNumber = CONTACT_INFO.whatsapp.replace(/\D/g, "");

  return (
    <LegalLayout title="Delivery Policy" lastUpdated={LAST_UPDATED}>
      <section className="space-y-3">
        <h2 id="coverage" className="text-xl font-semibold text-white">
          Coverage
        </h2>
        <p>
          We currently deliver anywhere within <strong>all of Sri Lanka only</strong>. At this time, we do not offer international shipping.
        </p>
      </section>

      <section className="space-y-3">
        <h2 id="processing-time" className="text-xl font-semibold text-white">
          Processing Time
        </h2>
        <p>
          All orders require a processing time of <strong>1-2 business days</strong> before shipping. Once your order has been processed, it will be handed over to our delivery partners.
        </p>
      </section>

      <section className="space-y-3">
        <h2 id="delivery-timeframe" className="text-xl font-semibold text-white">
          Delivery Timeframe
        </h2>
        <p>
          Please expect your items to arrive within <strong>15 days</strong> from the date of order confirmation. We strive to deliver as quickly as possible and will keep you updated.
        </p>
      </section>

      <section className="space-y-3">
        <h2 id="tracking" className="text-xl font-semibold text-white">
          Tracking your order
        </h2>
        <p>
          As soon as your order is shipped, we will share the tracking number with you via WhatsApp to the number provided at checkout.
        </p>
      </section>

      <section className="space-y-3">
        <h2 id="payment-methods" className="text-xl font-semibold text-white">
          Accepted Payment Methods
        </h2>
        <p>
          We do <strong>not</strong> offer an eZ cash payment option. We only accept bank transfers and mobile banking.
        </p>
        <div className="mt-4 rounded border border-white/10 bg-[#0f0f0f] px-5 py-4">
          <p className="text-sm font-semibold text-white mb-2">Our Bank Details:</p>
          <ul className="text-sm text-white/80 space-y-1">
            <li><strong>Bank:</strong> Sampath Bank</li>
            <li><strong>Branch:</strong> Hatton</li>
            <li><strong>Name:</strong> N.Gayathree</li>
            <li><strong>Account Number:</strong> 108052612262</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 id="delivery-issues" className="text-xl font-semibold text-white">
          Delivery Issues
        </h2>
        <p>
          If you have not received your order within 3 days of the expected delivery date, or if there is any issue with your delivery, please contact our support team immediately. 
        </p>
        <p>
          Reach us at{" "}
          <a
            className="text-[#D4AF37]"
            href={`https://wa.me/${whatsappNumber}`}
          >
            {CONTACT_INFO.phone}
          </a>
        </p>
      </section>
    </LegalLayout>
  );
};

export default DeliveryPolicyPage;
