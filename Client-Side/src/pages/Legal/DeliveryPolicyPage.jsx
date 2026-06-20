import React from "react";
import LegalLayout from "@/components/Legal/LegalLayout";
import PolicyBody from "@/components/Legal/PolicyBody";
import usePageMeta from "@/hooks/use-page-meta";
import usePolicyPage from "@/hooks/use-policy-page";
import { DELIVERY_POLICY_FALLBACK_HTML } from "./legal-policy-fallbacks";

const DeliveryPolicyPage = () => {
  const { html, lastUpdated, metaTitle, metaDescription, loading } = usePolicyPage(
    "policy_shipping",
    {
      fallbackHtml: DELIVERY_POLICY_FALLBACK_HTML,
      defaultTitle: "Delivery Policy",
      defaultDescription:
        "Read Saga Elite's delivery policy, processing times, and shipping coverage across Sri Lanka.",
    }
  );

  usePageMeta({ title: metaTitle, description: metaDescription });

  return (
    <LegalLayout title="Delivery Policy" lastUpdated={lastUpdated}>
      <PolicyBody html={html} loading={loading} />
    </LegalLayout>
  );
};

export default DeliveryPolicyPage;
