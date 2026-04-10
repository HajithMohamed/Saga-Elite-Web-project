import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth-slice";
import dropReducer from "./admin/drop-slice";
import orderReducer from "./order-slice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    drop: dropReducer,
    order: orderReducer,
  },
});

export default store;

