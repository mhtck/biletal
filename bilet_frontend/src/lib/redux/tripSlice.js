import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { tripService } from "../services/tripService";

export const fetchTrips = createAsyncThunk(
  "trip/trips",
  async (_, { rejectWithValue }) => {
    try {
      const response = await tripService.getAllTrips();
      console.log("fetchTrips:", response);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Seferler getirilemedi"
      );
    }
  }
);

const initialState = {
  trips: [],
  currentTrip: null,
  loading: false,
  error: null,
};

const tripSlice = createSlice({
  name: 'trip',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentTrip: (state) => {
      state.currentTrip = null;
    },
    setCurrentTrip: (state, action) => {
      state.currentTrip = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.trips = action.payload.data || [];
        state.error = null;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.loading = false;
        state.trips = action.payload.data ;
      });
  },
});

export const { clearError, clearCurrentTrip, setCurrentTrip } =
  tripSlice.actions;
export default tripSlice.reducer;
