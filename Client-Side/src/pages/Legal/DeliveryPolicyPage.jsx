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

  const summary = [
    "Delivery timeframes & processing",
    "Shipping coverage (Islandwide)",
    "Tracking your order in real-time",
    "Accepted payment methods upon delivery",
    "How to report delivery delays",
  ];

  const processSteps = [
    "Order Confirmed",
    "Packed",
    "Shipped",
    "Out for Delivery",
    "Delivered"
  ];

  return (
    <LegalLayout 
      title="Shipping & Delivery" 
      subtitle="Information on shipping times, coverage, and order tracking across Sri Lanka."
      lastUpdated={lastUpdated}
      summary={summary}
      processSteps={processSteps}
    >
      <PolicyBody html={html} loading={loading} />
    </LegalLayout>
  );
};

export default DeliveryPolicyPage;
