import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useDispatch } from "react-redux";

import { SOCKET_URL } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { receiveLiveProductUpdate } from "@/store/live-product-slice";

const getSocketUrl = () => SOCKET_URL;

export const useLiveProductUpdates = (isRelevantUpdate, dependencies = []) => {
  const dispatch = useDispatch();
  const relevanceRef = useRef(isRelevantUpdate);

  useEffect(() => {
    relevanceRef.current = isRelevantUpdate;
  }, [isRelevantUpdate]);

  useEffect(() => {
    const socket = io(getSocketUrl(), {
      withCredentials: true,
      transports: ["websocket"],
    });

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
      socket.disconnect();
    };
  }, [dispatch, ...dependencies]);
};

export default useLiveProductUpdates;
