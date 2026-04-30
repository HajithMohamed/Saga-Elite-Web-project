const SOCKET_EVENTS = {
  CLIENT_REGISTER: "client:register",
  CLIENT_DISCONNECT: "client:disconnect",
  ADMIN_REFRESH: "admin:refresh",
  ORDER_REFRESH: "order:refresh",
  PAYMENT_REFRESH: "payment:refresh",
  REVIEW_REFRESH: "review:refresh",
  NOTIFICATION_REFRESH: "notification:refresh",
  DASHBOARD_REFRESH: "dashboard:refresh",
};

module.exports = SOCKET_EVENTS;