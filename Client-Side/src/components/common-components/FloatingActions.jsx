import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CONTACT_INFO } from "@/config";
import { fetchSiteSettings } from "@/services/landing-api";
import { WhatsAppIcon } from "@/components/common-components/BrandIcons";

const CHECKOUT_FLOW_PATHS = [
  "/shopping/checkout",
  "/shopping/manual-payment",
  "/shopping/card-payment",
  "/shopping/find-payment",
];

const getWhatsAppDigits = (value) => String(value || "").replace(/\D/g, "");
const MotionAnchor = motion.a;

const FloatingActions = () => {
  const location = useLocation();
  const [whatsappNumber, setWhatsappNumber] = useState(CONTACT_INFO.whatsapp);

  useEffect(() => {
    let active = true;
    fetchSiteSettings().then((settings) => {
      if (active && settings?.whatsapp) {
        setWhatsappNumber(settings.whatsapp);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const inCheckoutFlow = CHECKOUT_FLOW_PATHS.some((path) =>
    location.pathname.startsWith(path)
  );
  if (location.pathname.startsWith("/admin") || inCheckoutFlow) {
    return null;
  }

  const digits =
    getWhatsAppDigits(whatsappNumber) || getWhatsAppDigits(CONTACT_INFO.whatsapp);
  if (!digits) return null;

  const onShopping = location.pathname.startsWith("/shopping");
  const positionClass = onShopping
    ? "bottom-[10.5rem] right-6 md:bottom-24"
    : "bottom-24 right-6";
  const message = encodeURIComponent("Hi Saga Elite, I need help.");

  return (
    <MotionAnchor
      href={`https://wa.me/${digits}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      className={`fixed ${positionClass} z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-ink shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-shadow hover:shadow-[0_0_28px_rgba(37,211,102,0.35)] focus:outline-none focus:ring-2 focus:ring-[#25D366]/60 focus:ring-offset-2 focus:ring-offset-page`}
      aria-label="Chat with Saga Elite on WhatsApp"
      title="Chat on WhatsApp"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </MotionAnchor>
  );
};

export default FloatingActions;
