import { useEffect, useRef } from "react";

import { connectSocket } from "@/lib/socket";

export const useSocketEvent = (eventName, handler, dependencies = []) => {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const socket = connectSocket();
    const listener = (...args) => handlerRef.current(...args);

    socket.on(eventName, listener);

    return () => {
      socket.off(eventName, listener);
    };
  }, [eventName, ...dependencies]);
};