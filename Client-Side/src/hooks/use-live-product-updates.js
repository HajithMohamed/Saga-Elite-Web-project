import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

import { connectSocket } from "@/lib/socket";
import { toast } from "@/hooks/use-toast";
import { receiveLiveProductUpdate } from "@/store/live-product-slice";

let lastToastTime = 0;
const TOAST_COOLDOWN_MS = 10000;

export const useLiveProductUpdates = (isRelevantUpdate, dependencies = []) => {
  const dispatch = useDispatch();
  const relevanceRef = useRef(isRelevantUpdate);

  useEffect(() => {
    relevanceRef.current = isRelevantUpdate;
  }, [isRelevantUpdate]);

  useEffect(() => {
    const socket = connectSocket();

    const handleProductUpdated = (payload = {}) => {
      if (
        typeof relevanceRef.current === "function" &&
        !relevanceRef.current(payload)
      ) {
        return;
      }

      dispatch(receiveLiveProductUpdate(payload));
      
      const now = Date.now();
      if (now - lastToastTime >= TOAST_COOLDOWN_MS) {
        lastToastTime = now;
        toast({
          title: "Stock updated live",
          description: "A product you're viewing had its stock or price updated.",
        });
      }
    };

    socket.on("product:updated", handleProductUpdated);

    return () => {
      socket.off("product:updated", handleProductUpdated);
    };
  }, [dispatch, ...dependencies]);
};

export default useLiveProductUpdates;
