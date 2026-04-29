import React from "react";
import LegalLayout from "@/components/Legal/LegalLayout";
import usePageMeta from "@/hooks/use-page-meta";
import { CONTACT_INFO } from "@/config";

const LAST_UPDATED = "April 29, 2026";

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
          Saga Elite is a Sri Lanka-based fashion and lifestyle e-commerce brand.
          This policy explains what data we collect, why we collect it, and how
          it is used. By using our website and services, you agree to this
          Privacy Policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 id="information-we-collect" className="text-xl font-semibold text-white">
          Information we collect
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Personal info such as name, email, phone, and delivery address.</li>
          <li>
            Payment info: card payments are processed by PayHere (we never store
            card numbers); manual payment reference numbers we generate.
          </li>
          <li>Order history and purchase records.</li>
          <li>
            Technical data such as IP address, browser type, device information,
            and pages visited.
          </li>
          <li>Cookies and session data.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="how-we-use-your-information" className="text-xl font-semibold text-white">
          How we use your information
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Processing and fulfilling orders.</li>
          <li>Sending order confirmations and updates via email.</li>
          <li>Verifying manual payments using your reference number.</li>
          <li>Responding to customer support inquiries.</li>
          <li>Improving our website and services.</li>
          <li>Sending promotional emails (only if you opted in at checkout).</li>
          <li>Complying with legal obligations.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="third-party-services" className="text-xl font-semibold text-white">
          Third-party services we use
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>PayHere processes card payments (their privacy policy applies).</li>
          <li>Cloudinary stores product and review images.</li>
          <li>Nodemailer / SMTP sends transactional emails.</li>
          <li>MongoDB Atlas hosts our database securely.</li>
          <li>We do not sell your personal data to any third party.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="data-storage-security" className="text-xl font-semibold text-white">
          Data storage and security
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Data is stored on MongoDB Atlas with encryption at rest.</li>
          <li>All connections use SSL/TLS encryption.</li>
          <li>Access is restricted to authorized personnel only.</li>
          <li>Passwords are stored as bcrypt hashes, never plaintext.</li>
          <li>Payment card data never touches our servers.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="data-retention" className="text-xl font-semibold text-white">
          Data retention
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Order records are retained for 7 years for tax/legal compliance.</li>
          <li>Account data is retained while your account is active.</li>
          <li>You may request deletion of your account and associated data.</li>
          <li>Some data may be retained longer if required by law.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="your-rights" className="text-xl font-semibold text-white">
          Your rights
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Right to access: request a copy of data we hold about you.</li>
          <li>Right to correction: update inaccurate information.</li>
          <li>Right to deletion: request we delete your personal data.</li>
          <li>Right to opt-out: unsubscribe from marketing at any time.</li>
          <li>
            Contact us at {CONTACT_INFO.email} to exercise any of these rights.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="cookies" className="text-xl font-semibold text-white">
          Cookies
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Session cookies keep you logged in during your visit.</li>
          <li>Preference cookies remember your settings.</li>
          <li>Analytics cookies help us understand site usage (if applicable).</li>
          <li>You can disable cookies in your browser settings.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 id="changes-to-this-policy" className="text-xl font-semibold text-white">
          Changes to this policy
        </h2>
        <p>
          We may update this policy from time to time and will post the new date
          at the top of this page. Continued use of the site after changes means
          acceptance.
        </p>
      </section>

      <section className="space-y-3">
        <h2 id="contact-us" className="text-xl font-semibold text-white">
          Contact us
        </h2>
        <address className="not-italic text-white/70">
          <div>Saga Elite</div>
          <div>{CONTACT_INFO.addressLine1}</div>
          <div>{CONTACT_INFO.addressLine2}</div>
          <div className="mt-3">
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
