import { io } from "socket.io-client";

import { SERVER_URL } from "@/config";

let socketInstance = null;

const getSocketUrl = () => import.meta.env.VITE_SOCKET_URL || SERVER_URL;

export const connectSocket = () => {
  if (socketInstance) {
    return socketInstance;
  }

  socketInstance = io(getSocketUrl(), {
    autoConnect: true,
    withCredentials: true,
    transports: ["websocket"],
  });

  return socketInstance;
};

export const getSocket = () => socketInstance;

export const registerSocketUser = (user) => {
  const socket = connectSocket();

  if (user?._id) {
    socket.emit("client:register", {
      userId: user._id,
      role: user.role,
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (!socketInstance) {
    return;
  }

  socketInstance.removeAllListeners();
  socketInstance.disconnect();
  socketInstance = null;
};