import axiosInstance from "./axiosInstance";

export const trackEvent = (eventName, payload = {}, metadata = {}) => {
  axiosInstance.post("/events/track", {
    eventName,
    payload,
    metadata: {
      pageUrl: window.location.href,
      referrerUrl: document.referrer,
      ...metadata,
    },
  }).catch(() => {});
};

export const trackBatch = (events) => {
  if (!events || events.length === 0) return;
  axiosInstance.post("/events/track-batch", { events }).catch(() => {});
};

export const fetchMyEvents = (params = {}) =>
  axiosInstance.get("/events/my-events", { params }).then((r) => r.data);

export const fetchBehavioralInsights = () =>
  axiosInstance.get("/events/insights").then((r) => r.data);
