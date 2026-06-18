import { useCallback, useRef, useEffect } from "react";
import axiosInstance from "@/api/axiosInstance";

const STORAGE_KEY_SESSION = "saga_session_id";

const getSessionId = () => {
  let id = sessionStorage.getItem(STORAGE_KEY_SESSION);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(STORAGE_KEY_SESSION, id);
  }
  return id;
};

const EVENT_TYPE_MAP = {
  page_view: "page_view",
  product_view: "product_view",
  product_dwell: "product_dwell",
  search: "search",
  add_to_cart: "add_to_cart",
  remove_from_cart: "remove_from_cart",
  add_to_wishlist: "add_to_wishlist",
  remove_from_wishlist: "remove_from_wishlist",
  begin_checkout: "begin_checkout",
  purchase: "purchase",
  login: "login",
  register: "register",
  logout: "logout",
  newsletter_subscribe: "newsletter_subscribe",
  review_submit: "review_submit",
  drop_view: "drop_view",
  coupon_apply: "coupon_apply",
};

const useTracker = () => {
  const buffer = useRef([]);
  const flushing = useRef(false);
  const sessionId = useRef(getSessionId());

  const flush = useCallback(async () => {
    if (flushing.current || buffer.current.length === 0) return;
    flushing.current = true;

    const batch = buffer.current.splice(0);
    try {
      await axiosInstance.post("/events/track-batch", { events: batch });
    } catch {
      buffer.current.unshift(...batch);
    } finally {
      flushing.current = false;
    }
  }, []);

  useEffect(() => {
    const id = setInterval(flush, 5000);
    return () => clearInterval(id);
  }, [flush]);

  useEffect(() => {
    const handleUnload = () => {
      if (buffer.current.length > 0) {
        navigator.sendBeacon?.("/api/v1/events/track-batch",
          JSON.stringify({ events: buffer.current.splice(0) })
        );
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  const track = useCallback((eventName, payload = {}, metadata = {}) => {
    const eventType = EVENT_TYPE_MAP[eventName] || "page_view";

    buffer.current.push({
      eventType,
      eventName,
      payload,
      sessionId: sessionId.current,
      metadata: {
        pageUrl: window.location.href,
        referrerUrl: document.referrer,
        userAgent: navigator.userAgent,
        ...metadata,
      },
      timestamp: new Date().toISOString(),
    });

    if (buffer.current.length >= 20) {
      flush();
    }
  }, [flush]);

  const trackView = useCallback((productId, variantId, dwellMs = 0) => {
    track("product_view", { productId, variantId, dwellMs });
  }, [track]);

  const trackSearch = useCallback((query, resultsCount = 0) => {
    track("search", { query, resultsCount });
  }, [track]);

  const trackCart = useCallback((action, productId, variantId, quantity) => {
    const eventName = action === "add" ? "add_to_cart" : "remove_from_cart";
    track(eventName, { productId, variantId, quantity });
  }, [track]);

  const trackCheckout = useCallback((items, totalValue) => {
    track("begin_checkout", {
      itemCount: items?.length || 0,
      totalValue,
      items: items?.map((i) => ({
        productId: i.product?._id || i.product,
        variantId: i.variant,
        quantity: i.quantity,
        price: i.unitPrice || i.price,
      })),
    });
  }, [track]);

  const trackPurchase = useCallback((orderId, orderValue, itemCount) => {
    track("purchase", { orderId, orderValue, itemCount });
  }, [track]);

  return {
    track,
    trackView,
    trackSearch,
    trackCart,
    trackCheckout,
    trackPurchase,
    flush,
  };
};

export default useTracker;
