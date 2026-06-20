const SOCKET_EVENTS = require("./socket-events");
const { ADMIN_ROLES } = require("./admin-roles");

let ioInstance = null;

const setSocketServer = (io) => {
  ioInstance = io;
  return ioInstance;
};

const getSocketServer = () => ioInstance;

const emitToAll = (eventName, payload) => {
  if (!ioInstance) return;
  ioInstance.emit(eventName, payload);
};

const emitToRoom = (roomName, eventName, payload) => {
  if (!ioInstance || !roomName) return;
  ioInstance.to(roomName).emit(eventName, payload);
};

const emitToUser = (userId, eventName, payload) => {
  if (!userId) return;
  emitToRoom(`user:${userId}`, eventName, payload);
};

const emitToAdmins = (eventName, payload) => {
  emitToRoom("admins", eventName, payload);
};

const registerSocketHandlers = (socket) => {
  socket.on(SOCKET_EVENTS.CLIENT_REGISTER, (payload = {}) => {
    const userId = payload.userId ? String(payload.userId) : "";
    const role = String(payload.role || "").toLowerCase();

    if (socket.data.userId) {
      socket.leave(`user:${socket.data.userId}`);
    }

    socket.data.userId = userId || null;
    socket.data.role = role || null;

    if (userId) {
      socket.join(`user:${userId}`);
    }

    if (ADMIN_ROLES.includes(role)) {
      socket.join("admins");
    }

    socket.emit("client:registered", {
      success: true,
      userId,
      role,
    });
  });

  socket.on(SOCKET_EVENTS.CLIENT_DISCONNECT, () => {
    socket.disconnect(true);
  });
};

module.exports = {
  SOCKET_EVENTS,
  setSocketServer,
  getSocketServer,
  emitToAll,
  emitToRoom,
  emitToUser,
  emitToAdmins,
  registerSocketHandlers,
};