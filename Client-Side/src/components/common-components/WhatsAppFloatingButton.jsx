import React, { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

import { CONTACT_INFO } from "@/config";

const DISPLAY_DELAY_MS = 2800;

const WhatsAppFloatingButton = () => {
  const [visible, setVisible] = useState(false);
  const raw = CONTACT_INFO?.whatsapp || "+94770704274";
  const phoneDigits = String(raw).replace(/\D/g, "");
  const message = encodeURIComponent(
    "Hi, I need help with my Saga Elite order."
  );
  const waUrl = `https://wa.me/${phoneDigits}?text=${message}`;

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), DISPLAY_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  if (!visible) {
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
