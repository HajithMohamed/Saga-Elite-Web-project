import { useEffect, useRef } from "react";

import { connectSocket } from "@/lib/socket";

// `dependencies` is accepted for backwards compatibility with existing callers
// but is intentionally NOT spread into the effect's dep array — the handler is
// always read through `handlerRef.current`, so spreading caller-provided arrays
// (which often include freshly-created callbacks) would tear down and re-register
// the socket listener on every render. Re-register only when the event name changes.
export const useSocketEvent = (eventName, handler /* , dependencies = [] */) => {
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
  }, [eventName]);
};