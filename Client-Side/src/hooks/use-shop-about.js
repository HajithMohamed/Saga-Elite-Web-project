import { useEffect, useState } from "react";
import axios from "axios";
import { API_V1_URL } from "@/lib/api";

// Module-level cache so the public-about payload is fetched at most once per
// browser session. About / Contact / Footer all consume this hook — without
// caching they'd each fire a separate request on page load.
//
// Store admins editing siteConfig need the page to reflect changes quickly.
// Pattern: after an admin save, the admin form calls `invalidateShopAbout()`
// (exported below) to clear this cache; the next consuming component will
// refetch. Public-side users get the latest data on next navigation.
let cachedData = null;
let inflight = null;
const subscribers = new Set();

const fetchShopAbout = async () => {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await axios.get(`${API_V1_URL}/site-config/about`);
      cachedData = res.data?.data || {};
      return cachedData;
    } catch (err) {
      // Network / server failure — return empty so consumers fall back to
      // their hardcoded defaults gracefully. Errors surfaced via console.
      // eslint-disable-next-line no-console
      console.warn("[use-shop-about] fetch failed:", err?.message || err);
      cachedData = {};
      return cachedData;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
};

export const invalidateShopAbout = () => {
  cachedData = null;
  inflight = null;
  // Tell every mounted consumer to refetch.
  subscribers.forEach((cb) => cb());
};

export function useShopAbout() {
  const [data, setData] = useState(cachedData);
  const [loading, setLoading] = useState(!cachedData);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }
      setLoading(true);
      const result = await fetchShopAbout();
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    };

    const onInvalidate = () => {
      if (cancelled) return;
      setLoading(true);
      fetchShopAbout().then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      });
    };

    subscribers.add(onInvalidate);
    load();

    return () => {
      cancelled = true;
      subscribers.delete(onInvalidate);
    };
  }, []);

  return { data: data || {}, loading };
}

export default useShopAbout;
