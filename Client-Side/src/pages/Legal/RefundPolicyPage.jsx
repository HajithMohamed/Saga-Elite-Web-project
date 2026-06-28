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

  return (
    <LegalLayout title="Refund & Return Policy" lastUpdated={lastUpdated}>
      <PolicyBody html={html} loading={loading} />
    </LegalLayout>
  );
};

export default RefundPolicyPage;
