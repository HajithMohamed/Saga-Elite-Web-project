import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth-slice";
import dropReducer from "./admin/drop-slice";
import orderReducer from "./order-slice";
import cartReducer from "./cart-slice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    drop: dropReducer,
    order: orderReducer,
    cart: cartReducer,
  },
});

export default store;

