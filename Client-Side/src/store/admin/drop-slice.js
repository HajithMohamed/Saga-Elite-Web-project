import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_URL}/v1`;

const initialState = {
  drops: [],
  isLoading: false,
  error: null,
};

export const getAllDrops = createAsyncThunk(
  "drop/getAllDrops",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE}/drops/get-all-drops`, {
        withCredentials: true,
      });
      return response.data.data.drops;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createDrop = createAsyncThunk(
  "drop/createDrop",
  async (dropData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE}/drops/create-drop`, dropData, {
        withCredentials: true,
      });
      return response.data.data.drop;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateDrop = createAsyncThunk(
  "drop/updateDrop",
  async ({ slug, dropData }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_BASE}/drops/update-drop/${slug}`,
        dropData,
        {
          withCredentials: true,
        }
      );
      return response.data.data.drop;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const archiveDrop = createAsyncThunk(
  "drop/archiveDrop",
  async ({ slug, isArchived }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_BASE}/drops/archive-drop/${slug}`,
        { isArchived },
        {
          withCredentials: true,
        }
      );
      return response.data.data.drop;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteDrop = createAsyncThunk(
  "drop/deleteDrop",
  async (slug, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE}/drops/delete-drop/${slug}`, {
        withCredentials: true,
      });
      return slug;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const dropSlice = createSlice({
  name: "drop",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllDrops.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllDrops.fulfilled, (state, action) => {
        state.isLoading = false;
        state.drops = action.payload;
      })
      .addCase(createDrop.fulfilled, (state, action) => {
        state.drops.push(action.payload);
      })
      .addCase(getAllDrops.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateDrop.fulfilled, (state, action) => {
        const index = state.drops.findIndex(
          (drop) => drop._id === action.payload._id
        );
        if (index !== -1) {
          state.drops[index] = action.payload;
        }
      })
      .addCase(archiveDrop.fulfilled, (state, action) => {
        const index = state.drops.findIndex(
          (drop) => drop._id === action.payload._id
        );
        if (index !== -1) {
          state.drops[index] = action.payload;
        }
      })
      .addCase(deleteDrop.fulfilled, (state, action) => {
        state.drops = state.drops.filter((drop) => drop.slug !== action.payload);
      });
  },
});

export default dropSlice.reducer;
