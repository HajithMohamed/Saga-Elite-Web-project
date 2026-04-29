import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth-slice";
import dropReducer from "./admin/drop-slice";
import productReducer from "./admin/product-slice";
import adminUsersReducer from "./admin/user-slice";
import orderReducer from "./order-slice";
import cartReducer from "./cart-slice";
import notificationReducer from "./notification-slice";
import manualPaymentReducer from "./manualPaymentSlice";
import superAdminReducer from "./admin/super-admin-slice";
import reviewReducer from "./reviewSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    drop: dropReducer,
    product: productReducer,
    adminUsers: adminUsersReducer,
    order: orderReducer,
    cart: cartReducer,
    notification: notificationReducer,
    manualPayment: manualPaymentReducer,
    superAdmin: superAdminReducer,
    review: reviewReducer,
  },
});

export default store;
