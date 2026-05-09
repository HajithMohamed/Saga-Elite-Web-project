import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Phone, X } from "lucide-react";
import axiosInstance from "@/api/axiosInstance";

// Slim banner mounted in the shopping layout that nudges authenticated
// customers without a phone on record to add one. Most relevant for Google
// signups (OAuth doesn't provide a phone number) but also covers older local
// accounts created before phone became required.
//
// Dismissal is sticky for the session — we don't want to nag on every page
// navigation, but we also don't want to set a permanent dismiss because the
// user genuinely needs to add their phone to receive WhatsApp updates.

const SESSION_DISMISS_KEY = "saga_phone_banner_dismissed";

const PhoneCompletionBanner = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [requiresPhone, setRequiresPhone] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem(SESSION_DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setRequiresPhone(false);
      return;
    }
    let cancelled = false;
    axiosInstance
      .get("/user/me")
      .then((res) => {
        if (cancelled) return;
        setRequiresPhone(Boolean(res?.data?.data?.requiresPhone));
      })
      .catch(() => {
        // Silent — if the endpoint fails the banner just stays hidden.
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?._id]);

  const handleDismiss = () => {
    try {
      window.sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  if (!isAuthenticated || !requiresPhone || dismissed) return null;

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 text-amber-100">
      <div className="container mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-xs sm:text-sm">
        <Phone className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
        <span className="flex-1">
          <span className="font-semibold">Add your mobile number</span>{" "}
          <span className="text-amber-200/90">
            so we can send order confirmations and OTPs on WhatsApp.
          </span>
        </span>
        <Link
          to="/shopping/account"
          className="rounded-full border border-amber-400/40 bg-amber-400/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-100 transition-colors hover:bg-amber-400/30"
        >
          Add now
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="text-amber-200/70 transition-colors hover:text-amber-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PhoneCompletionBanner;
