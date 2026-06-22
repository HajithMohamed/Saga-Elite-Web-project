import React from "react";
import LegalLayout from "@/components/Legal/LegalLayout";
import PolicyBody from "@/components/Legal/PolicyBody";
import usePageMeta from "@/hooks/use-page-meta";
import usePolicyPage from "@/hooks/use-policy-page";
import { TERMS_POLICY_FALLBACK_HTML } from "./legal-policy-fallbacks";

const TermsConditionsPage = () => {
  const { html, lastUpdated, metaTitle, metaDescription, loading } = usePolicyPage(
    "policy_terms",
    {
      fallbackHtml: TERMS_POLICY_FALLBACK_HTML,
      defaultTitle: "Terms & Conditions",
      defaultDescription:
        "Read the terms and conditions for using Saga Elite and placing orders on our store.",
    }
  );

  usePageMeta({ title: metaTitle, description: metaDescription });

  return (
    <LegalLayout title="Terms & Conditions" lastUpdated={lastUpdated}>
      <PolicyBody html={html} loading={loading} />
    </LegalLayout>
  );
};

export default TermsConditionsPage;
