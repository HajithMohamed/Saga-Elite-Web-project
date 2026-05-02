import React from "react";
import LegalLayout from "@/components/Legal/LegalLayout";
import usePageMeta from "@/hooks/use-page-meta";
import { CONTACT_INFO } from "@/config";

const LAST_UPDATED = "May 2, 2026";

const PrivacyPolicyPage = () => {
  usePageMeta({
    title: "Privacy Policy",
    description:
      "Learn how Saga Elite collects, uses, and protects your personal data when you shop with us.",
  });

  return (
    <LegalLayout title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <section className="space-y-3">
        <h2 id="introduction" className="text-xl font-semibold text-white">
          Introduction
        </h2>
        <p>
          This policy covers what data Saga Elite collects, why we collect it, and how it is used to deliver our services.
          <br />
          <strong>Last Updated:</strong> {LAST_UPDATED}
        </p>
      </section>

      <section className="space-y-3">
        <h2 id="data-we-collect" className="text-xl font-semibold text-white">
          Data We Collect
        </h2>
        <p>We may collect the following personal and technical data:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Name, email, phone number, and delivery address.</li>
          <li>Order history and purchase records.</li>
          <li>Technical data such as IP address.</li>
        </ul>
        <p>
          <strong>Note:</strong> Payment card data is handled securely by PayHere. We never store or process your card details on our servers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 id="how-we-use-your-data" className="text-xl font-semibold text-white">
          How We Use Your Data
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Processing and fulfilling your orders.</li>
          <li>Sending order and shipping notifications via WhatsApp ({CONTACT_INFO.phone}) and email.</li>
          <li>Providing responsive customer support.</li>
          <li>Sending marketing and promotional emails (these invariably contain an opt-out link).</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="data-sharing" className="text-xl font-semibold text-white">
          Data Sharing
        </h2>
        <p>
          We partner with select third-party services to fulfill our business operations. These include:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>PayHere:</strong> For secure payment processing.</li>
          <li><strong>Cloudinary:</strong> For image hosting and management.</li>
          <li><strong>Mailtrap/Nodemailer:</strong> To facilitate email delivery.</li>
        </ul>
        <p><strong>We do NOT sell your data to any third parties.</strong></p>
      </section>

      <section className="space-y-3">
        <h2 id="data-storage" className="text-xl font-semibold text-white">
          Data Storage
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>All your personal data is stored securely on <strong>MongoDB Atlas</strong> databases.</li>
          <li>We employ industry-standard <strong>SSL/TLS encryption</strong> to protect data in transit.</li>
          <li>Your personal data is retained for exactly <strong>2 years</strong> following your last order with us.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="your-rights" className="text-xl font-semibold text-white">
          Your Rights
        </h2>
        <p>Under data protection laws, you retain essential rights regarding your personal data:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Access:</strong> Request a copy of the data we hold on you.</li>
          <li><strong>Correction:</strong> Update any incorrect personal information.</li>
          <li><strong>Deletion:</strong> Request permanent deletion of all your data from our systems.</li>
        </ul>
        <p>To exercise these rights, please contact us at <a className="text-[#D4AF37]" href={`mailto:${CONTACT_INFO.email}`}>{CONTACT_INFO.email}</a>.</p>
      </section>

      <section className="space-y-3">
        <h2 id="cookies" className="text-xl font-semibold text-white">
          Cookies
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Session Cookies:</strong> Kept to allow you to log in smoothly during your visit.</li>
          <li><strong>Preference Cookies:</strong> Used to remember your website layout and preferences.</li>
        </ul>
        <p>You have full control over cookies and can disable them within your browser settings.</p>
      </section>

      <section className="space-y-3">
        <h2 id="delivery-scope" className="text-xl font-semibold text-white">
          Delivery Scope
        </h2>
        <p>At present, we exclusively support deliveries within <strong>Sri Lanka</strong>.</p>
      </section>

      <section className="space-y-3">
        <h2 id="contact" className="text-xl font-semibold text-white">
          Contact
        </h2>
        <address className="not-italic text-white/70">
          <div>Saga Elite</div>
          <div className="mt-2">
            Email: <a className="text-[#D4AF37]" href={`mailto:${CONTACT_INFO.email}`}>{CONTACT_INFO.email}</a>
          </div>
          <div>
            Phone:{" "}
            <a
              className="text-[#D4AF37]"
              href={`tel:${CONTACT_INFO.phone.replace(/\s/g, "")}`}
            >
              {CONTACT_INFO.phone}
            </a>
          </div>
        </address>
      </section>
    </LegalLayout>
  );
};

export default PrivacyPolicyPage;
