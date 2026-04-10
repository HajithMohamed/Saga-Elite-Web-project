import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth-slice";
import dropReducer from "./admin/drop-slice";
import productReducer from "./admin/product-slice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    drop: dropReducer,
    product: productReducer,
  },
});

export default store;

