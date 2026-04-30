import { useEffect } from "react";
import { io } from "socket.io-client";
import { useDispatch } from "react-redux";
import { updateProductInStore } from "@/store/admin/product-slice";
import { updateDropInStore } from "@/store/admin/drop-slice";

let socket;

export const useSocket = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    socket = io(
      import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5001",
      { withCredentials: true }
    );
    socket.on("product:updated", (data) => dispatch(updateProductInStore(data)));
    socket.on("drop:updated", (data) => dispatch(updateDropInStore(data)));
    return () => socket.disconnect();
  }, [dispatch]);
};
