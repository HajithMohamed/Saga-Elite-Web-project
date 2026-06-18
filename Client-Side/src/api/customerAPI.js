import axiosInstance from "./axiosInstance";

export const fetchMyProfile = () =>
  axiosInstance.get("/customer/me").then((r) => r.data);

export const updateMyProfile = (data) =>
  axiosInstance.patch("/customer/me", data).then((r) => r.data);

export const fetchViewedProducts = () =>
  axiosInstance.get("/customer/recently-viewed").then((r) => r.data);

export const clearViewedProducts = () =>
  axiosInstance.delete("/customer/recently-viewed").then((r) => r.data);

export const syncGuestViewedProducts = (productIds) =>
  axiosInstance.post("/customer/recently-viewed/sync", { productIds }).then((r) => r.data);

export const migrateFromGuest = (guestToken) =>
  axiosInstance.post("/customer/migrate-from-guest", { guestToken }).then((r) => r.data);

export const fetchActivityFeed = () =>
  axiosInstance.get("/customer/activity").then((r) => r.data);
