import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth-slice";
import dropReducer from "./admin/drop-slice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    drop: dropReducer,
  },
});

export default store;

