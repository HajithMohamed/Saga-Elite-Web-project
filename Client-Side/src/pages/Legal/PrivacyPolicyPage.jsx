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

  return (
    <LegalLayout title="Privacy Policy" lastUpdated={lastUpdated}>
      <PolicyBody html={html} loading={loading} />
    </LegalLayout>
  );
};

export default PrivacyPolicyPage;
