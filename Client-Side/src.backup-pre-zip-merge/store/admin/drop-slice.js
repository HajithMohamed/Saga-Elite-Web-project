import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";

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
      return response.data.drops;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createDrop = createAsyncThunk(
  "drop/createDrop",
  async (dropData, { rejectWithValue }) => {
    dropData = dropData || {};
    if (!dropData.name || !dropData.releaseDate) {
      return rejectWithValue("Name and release date are required");
    }
    try {
      const response = await axios.post(`${API_BASE}/drops/create-drop`, dropData, {
        withCredentials: true,
      });
      return response.data.drop;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateDrop = createAsyncThunk(
  "drop/updateDrop",
  async ({ slug, dropData, formData }, { rejectWithValue }) => {
    const payload = dropData || formData || {};
    if (Object.keys(payload).length === 0) {
      return rejectWithValue("No data provided for update");
    }
    try {
      const response = await axios.patch(
        `${API_BASE}/drops/update-drop/${slug}`,
        payload,
        {
          withCredentials: true,
        }
      );
      return response.data.drop;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
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
      return response.data.drop;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteDrop = createAsyncThunk(
  "drop/deleteDrop",
  async (slug, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_BASE}/drops/delete-drop/${slug}`, {
        withCredentials: true,
      });
      return response.data.deletedDropSlug || slug;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const dropSlice = createSlice({
  name: "drop",
  initialState,
  reducers: {
    updateDropInStore: (state, action) => {
      const { dropId, drop } = action.payload || {};
      if (!drop) return;
      const id = dropId ?? drop._id;
      const idx = state.drops.findIndex((d) => String(d._id) === String(id));
      if (idx !== -1) {
        state.drops[idx] = drop;
      } else {
        state.drops.push(drop);
      }
    },
  },
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
      .addCase(getAllDrops.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createDrop.pending, (state) => {
        state.error = null;
      })
      .addCase(createDrop.fulfilled, (state, action) => {
        state.drops.push(action.payload);
      })
      .addCase(createDrop.rejected, (state, action) => {
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
      .addCase(updateDrop.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(archiveDrop.fulfilled, (state, action) => {
        const index = state.drops.findIndex(
          (drop) => drop._id === action.payload._id
        );
        if (index !== -1) {
          state.drops[index] = action.payload;
        }
      })
      .addCase(archiveDrop.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteDrop.fulfilled, (state, action) => {
        state.drops = state.drops.filter((drop) => drop.slug !== action.payload);
      })
      .addCase(deleteDrop.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { updateDropInStore } = dropSlice.actions;

export default dropSlice.reducer;
