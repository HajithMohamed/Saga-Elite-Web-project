import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { CONTACT_INFO } from "@/config";
import useShopAbout from "@/hooks/use-shop-about";

const DISPLAY_DELAY_MS = 2800;

const WhatsAppFloatingButton = () => {
  const location = useLocation();
  const { data: about } = useShopAbout();
  const [visible, setVisible] = useState(false);

  const isAdmin = location.pathname.startsWith("/admin");
  const whatsappCta = about?.whatsapp_cta || {};
  const showFloating =
    !isAdmin &&
    whatsappCta.enabled === true &&
    whatsappCta.displayPosition === "floating";

  const raw =
    about?.shop_whatsapp_number ||
    about?.shop_contact_phone ||
    CONTACT_INFO?.whatsapp ||
    "+94770704274";
  const phoneDigits = String(raw).replace(/\D/g, "");
  const defaultMessage = "Hi, I need help with my Saga Elite order.";
  const message = encodeURIComponent(whatsappCta.message?.trim() || defaultMessage);
  const waUrl = phoneDigits ? `https://wa.me/${phoneDigits}?text=${message}` : null;

  useEffect(() => {
    if (!showFloating || !waUrl) {
      setVisible(false);
      return undefined;
    }
    const t = window.setTimeout(() => setVisible(true), DISPLAY_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [showFloating, waUrl]);

  if (!visible || !waUrl) {
    return null;
  }

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      title="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-110 hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300"
      aria-label="Chat with us on WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
};

export default WhatsAppFloatingButton;
