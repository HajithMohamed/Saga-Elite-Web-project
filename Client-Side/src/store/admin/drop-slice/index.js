import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const initialState = {
  isLoading: false,
  dropList: [],
  dropDetails: null,
};

export const createDrop = createAsyncThunk(
  "/drop/createDrop",
  async (formData) => {
    const response = await axios.post(`${API_BASE}/drops/create-drop`, formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response?.data;
  }
);

export const getAllDrops = createAsyncThunk(
  "/drop/getAllDrops",
  async () => {
    const response = await axios.get(`${API_BASE}/drops/get-all-drops`, {
      withCredentials: true,
    });
    return response?.data;
  }
);

export const updateDrop = createAsyncThunk(
  "/drop/updateDrop",
  async ({ slug, formData }) => {  // ← must be `formData`, not `dropData`
    const response = await axios.patch(
      `${API_BASE}/drops/update-drop/${slug}`,
      formData,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response?.data;
  }
);

export const deleteDrop = createAsyncThunk(
  "/drop/deleteDrop",
  async (slug) => {
    const response = await axios.delete(`${API_BASE}/drops/delete-drop/${slug}`, {
      withCredentials: true,
    });
    return response?.data;
  }
);

export const archiveDrop = createAsyncThunk(
  "/drop/archiveDrop",
  async (slug) => {
    const response = await axios.patch(
      `${API_BASE}/drops/archive-drop/${slug}`,
      {},
      {
        withCredentials: true,
      }
    );
    return response?.data;
  }
);

export const getSingleDrop = createAsyncThunk(
  "/drop/getSingleDrop",
  async (slug) => {
    const response = await axios.get(`${API_BASE}/drops/get-single-drop/${slug}`, {
      withCredentials: true,
    });
    return response?.data;
  }
);

const adminDropSlice = createSlice({
  name: "adminDrop",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllDrops.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllDrops.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dropList = action.payload.drops; // ← was `action.payload.data`, API returns `drops`
      })
      .addCase(getAllDrops.rejected, (state) => {
        state.isLoading = false;
        state.dropList = [];
      })
      .addCase(getSingleDrop.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSingleDrop.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dropDetails = action.payload.drop; // ← was `action.payload.data`
      })
      .addCase(getSingleDrop.rejected, (state) => {
        state.isLoading = false;
        state.dropDetails = null;
      });
  },
});

export default adminDropSlice.reducer;