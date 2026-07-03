import React from "react";
import LegalLayout from "@/components/Legal/LegalLayout";
import PolicyBody from "@/components/Legal/PolicyBody";
import usePageMeta from "@/hooks/use-page-meta";
import usePolicyPage from "@/hooks/use-policy-page";
import { PRIVACY_POLICY_FALLBACK_HTML } from "./legal-policy-fallbacks";

const PrivacyPolicyPage = () => {
  const { html, lastUpdated, metaTitle, metaDescription, loading } = usePolicyPage(
    "policy_privacy",
    {
      fallbackHtml: PRIVACY_POLICY_FALLBACK_HTML,
      defaultTitle: "Privacy Policy",
      defaultDescription:
        "Learn how Saga Elite collects, uses, and protects your personal data when you shop with us.",
    }
  );

  usePageMeta({ title: metaTitle, description: metaDescription });

  const summary = [
    "What information we collect",
    "How we use your data",
    "How we protect your information",
    "Your privacy rights",
    "Contact information",
  ];

  return (
    <LegalLayout 
      title="Privacy Policy" 
      subtitle="Learn how Saga Elite collects, protects, and uses your information."
      lastUpdated={lastUpdated}
      summary={summary}
    >
      <PolicyBody html={html} loading={loading} />
    </LegalLayout>
  );
};

export default PrivacyPolicyPage;
