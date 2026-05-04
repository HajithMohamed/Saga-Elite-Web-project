import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

import { connectSocket } from "@/lib/socket";
import { toast } from "@/hooks/use-toast";
import { receiveLiveProductUpdate } from "@/store/live-product-slice";

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
      toast({
        title: "Price updated live",
        description: "This product pricing changed just now.",
      });
    };

    socket.on("product:updated", handleProductUpdated);

    return () => {
      socket.off("product:updated", handleProductUpdated);
    };
  }, [dispatch, ...dependencies]);
};

export default useLiveProductUpdates;
