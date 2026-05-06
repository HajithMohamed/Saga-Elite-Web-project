import { io } from "socket.io-client";
import { SOCKET_URL } from "@/lib/api";

let socketInstance = null;

const getSocketUrl = () => SOCKET_URL;

export const connectSocket = () => {
  if (socketInstance) {
    if (!socketInstance.connected) {
      socketInstance.connect();
    }
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
