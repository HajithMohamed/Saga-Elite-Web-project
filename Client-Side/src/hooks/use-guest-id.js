import { useEffect, useState, useCallback } from "react";
import axiosInstance from "@/api/axiosInstance";

const STORAGE_KEY = "guestToken";

let identifyPromise = null;

const identifyOnce = async () => {
  if (identifyPromise) return identifyPromise;
  identifyPromise = axiosInstance
    .post("/guest/identify")
    .then((res) => {
      const token = res.data?.data?.guestToken;
      if (token) {
        localStorage.setItem(STORAGE_KEY, token);
      }
      return token || null;
    })
    .catch(() => null);
  return identifyPromise;
};

export const trackGuestEvent = (type, meta) => {
  if (!type) return;
  axiosInstance
    .post("/guest/activity", { type, meta })
    .catch(() => {
      /* fire-and-forget */
    });
};

export const useGuestId = () => {
  const [guestToken, setGuestToken] = useState(
    () => localStorage.getItem(STORAGE_KEY) || null
  );

  useEffect(() => {
    let cancelled = false;
    identifyOnce().then((token) => {
      if (!cancelled && token) setGuestToken(token);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const track = useCallback((type, meta) => trackGuestEvent(type, meta), []);

  return { guestToken, track };
};

export default useGuestId;
