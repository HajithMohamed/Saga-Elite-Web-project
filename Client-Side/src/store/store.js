import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth-slice";
import dropReducer from "./admin/drop-slice";
import productReducer from "./admin/product-slice";
import orderReducer from "./order-slice";
import cartReducer from "./cart-slice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    drop: dropReducer,
    product: productReducer,
    order: orderReducer,
    cart: cartReducer,
  },
});

export default store;

