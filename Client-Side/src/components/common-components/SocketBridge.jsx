import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { disconnectSocket, registerSocketUser } from "@/lib/socket";
import { useSocketEvent } from "@/hooks/use-socket-events";
import { fetchNotifications, fetchAdminNotifications } from "@/store/notification-slice";
import { fetchDashboardStats, fetchUserOrders, fetchAdminOrders } from "@/store/order-slice";
import { fetchPendingManualPayments } from "@/store/manualPaymentSlice";
import { fetchAdminReviews } from "@/store/reviewSlice";
import { updateProductInStore } from "@/store/admin/product-slice";
import { updateDropInStore } from "@/store/admin/drop-slice";

const adminPaymentParams = {
  status: "proof_submitted",
  page: 1,
  limit: 10,
};

const adminReviewParams = {
  status: "pending",
  page: 1,
  limit: 20,
};

const SocketBridge = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const isAdmin = useMemo(
    () => ["admin", "super_admin", "superadmin"].includes(String(user?.role || "").toLowerCase()),
    [user?.role],
  );

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      disconnectSocket();
      return undefined;
    }

    registerSocketUser(user);

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user]);

  useSocketEvent(
    "product:updated",
    (payload = {}) => {
      if (!isAdmin) return;

      dispatch(updateProductInStore(payload));
    },
    [dispatch, isAdmin],
  );

  useSocketEvent(
    "drop:updated",
    (payload = {}) => {
      if (!isAdmin) return;

      dispatch(updateDropInStore(payload));
    },
    [dispatch, isAdmin],
  );

  useSocketEvent(
    "admin:refresh",
    () => {
      if (!isAdmin) return;

      dispatch(fetchDashboardStats());
      dispatch(fetchPendingManualPayments(adminPaymentParams));
      dispatch(fetchAdminReviews(adminReviewParams));
      dispatch(fetchAdminNotifications({ page: 1, limit: 10 }));
      dispatch(fetchAdminOrders());
    },
    [dispatch, isAdmin],
  );

  useSocketEvent(
    "order:refresh",
    (payload = {}) => {
      const matchesCurrentUser = String(payload.userId || "") === String(user?._id || "");

      if (isAdmin) {
        dispatch(fetchAdminOrders());
        dispatch(fetchDashboardStats());
      }

      if (isAuthenticated && matchesCurrentUser) {
        dispatch(fetchUserOrders());
        dispatch(fetchNotifications());
      }
    },
    [dispatch, isAdmin, isAuthenticated, user?._id],
  );

  useSocketEvent(
    "payment:refresh",
    (payload = {}) => {
      const matchesCurrentUser = String(payload.userId || "") === String(user?._id || "");

      if (isAdmin) {
        dispatch(fetchPendingManualPayments(adminPaymentParams));
        dispatch(fetchDashboardStats());
      }

      if (isAuthenticated && matchesCurrentUser) {
        dispatch(fetchNotifications());
      }
    },
    [dispatch, isAdmin, isAuthenticated, user?._id],
  );

  useSocketEvent(
    "review:refresh",
    () => {
      if (!isAdmin) return;

      dispatch(fetchAdminReviews(adminReviewParams));
      dispatch(fetchDashboardStats());
      dispatch(fetchAdminNotifications({ page: 1, limit: 10 }));
    },
    [dispatch, isAdmin],
  );

  useSocketEvent(
    "notification:refresh",
    (payload = {}) => {
      const matchesCurrentUser = String(payload.userId || "") === String(user?._id || "");

      if (isAdmin && (payload.scope === "admin" || payload.audience === "broadcast")) {
        dispatch(fetchAdminNotifications({ page: 1, limit: 10 }));
      }

      if (isAuthenticated && (matchesCurrentUser || payload.scope === "user")) {
        dispatch(fetchNotifications());
      }
    },
    [dispatch, isAdmin, isAuthenticated, user?._id],
  );

  return null;
};

export default SocketBridge;
