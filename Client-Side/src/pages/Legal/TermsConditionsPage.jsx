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
        "Read the terms and conditions for shopping with Saga Elite.",
    }
  );

  usePageMeta({ title: metaTitle, description: metaDescription });

  const summary = [
    "Customer Responsibilities",
    "Payment Rules",
    "Order Cancellation",
    "Warranty Information",
    "Intellectual Property",
  ];

  return (
    <LegalLayout 
      title="Terms & Conditions" 
      subtitle="The rules and guidelines for using the Saga Elite platform."
      lastUpdated={lastUpdated}
      summary={summary}
    >
      <PolicyBody html={html} loading={loading} />
    </LegalLayout>
  );
};

export default TermsConditionsPage;
