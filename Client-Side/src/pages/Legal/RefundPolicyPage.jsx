import React from "react";
import LegalLayout from "@/components/Legal/LegalLayout";
import PolicyBody from "@/components/Legal/PolicyBody";
import usePageMeta from "@/hooks/use-page-meta";
import usePolicyPage from "@/hooks/use-policy-page";
import { REFUND_POLICY_FALLBACK_HTML } from "./legal-policy-fallbacks";

const RefundPolicyPage = () => {
  const { html, lastUpdated, metaTitle, metaDescription, loading } = usePolicyPage(
    "policy_refund",
    {
      fallbackHtml: REFUND_POLICY_FALLBACK_HTML,
      defaultTitle: "Refund & Return Policy",
      defaultDescription:
        "Understand Saga Elite return eligibility, exchange policy, and non-refundable items.",
    }
  );

  usePageMeta({ title: metaTitle, description: metaDescription });

  const summary = [
    "Return period (14 days)",
    "Eligible products for exchange",
    "Refund and exchange process",
    "Defective or damaged items",
    "Non-returnable items",
  ];

  const processSteps = [
    "Request Return",
    "Approval",
    "Ship Product",
    "Inspection",
    "Refund Processed"
  ];

  return (
    <LegalLayout 
      title="Refund & Return Policy" 
      subtitle="Everything you need to know about our return eligibility and exchange process."
      lastUpdated={lastUpdated}
      summary={summary}
      processSteps={processSteps}
    >
      <PolicyBody html={html} loading={loading} />
    </LegalLayout>
  );
};

export default RefundPolicyPage;
