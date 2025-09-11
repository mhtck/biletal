import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { tripService } from "../services/tripService";

export const fetchTrips = createAsyncThunk(
  "rest/trips",
  async (data, { rejectWithValue }) => {
    try {
      console.log("findTrip fetch : ", data);
      const response = await tripService.getAllTrips(data);
      console.log("fetchTrips:", response.data);
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
  filters: {
    departureTime: "all",
    priceRange: [0, 5000],
    company: "all",
  },
  expandedTrip: null,
  selectedSeats: [],
  findTrip: {},
};

const tripSlice = createSlice({
  name: "trip",
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
    setFindTrip: (state, action) => {
      state.findTrip = {
        ...state.findTrip,
        ...action.payload,
      };
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    expandTrip: (state, action) => {
      const tripId = action.payload;
      state.expandedTrip = state.expandedTrip === tripId ? null : tripId;
      state.selectedSeats = [];

      // İlgili trip'i bul
      const trip = state.trips.find((t) => t.id === tripId);
      if (!trip) return;

      // Seat'lerin hepsinin is_selected'ını false yap
      trip.seats = trip.seats.map((seat) => ({
        ...seat,
        is_selected: false,
      }));
    },
    selectSeat: (state, action) => {
      const { tripId, seatNumber } = action.payload;
      const trip = state.trips.find((t) => t.id === tripId);
      if (!trip) return;

      // Tüm koltukları önce is_selected: false yap
      trip.seats = trip.seats.map((seat) => ({
        ...seat,
        is_selected: seat.id === seatNumber && !seat.is_reserved,
      }));

      // selectedSeats alanını güncelle
      const selected = trip.seats
        .filter((seat) => seat.is_selected)
        .map((seat) => seat.id);

      state.selectedSeats = selected;
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
        state.trips = generateSeatMap(action.payload) || [];
        state.error = null;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.loading = false;
        state.trips = generateSeatMap(action.payload) || [];
      });
  },
});

export const {
  clearError,
  clearCurrentTrip,
  setCurrentTrip,
  updateFilters,
  expandTrip,
  selectSeat,
  setFindTrip,
} = tripSlice.actions;
export default tripSlice.reducer;

// Koltuk haritası oluşturucu
function generateSeatMap(seatApi) {
  const seats = [];
  console.log("seatApi : ", seatApi);
  if (Array.isArray(seatApi)) {
    const updatedTrips = seatApi.map((trip) => ({
      ...trip,
      seats: trip.seats.map((seat) => ({
        ...seat,
        is_selected: false,
      })),
    }));

    return updatedTrips;
  }
  return [];
}

export const selectFilteredTrips = (state) => {
  const { trips, filters } = state.trip;

  return trips.filter((trip) => {
    if (filters.company !== "all" && trip.company !== filters.company)
      return false;
    // Kalkış saati filtresi
    if (filters.departureTime !== "all") {
      const hour = parseInt(
        trip.departure_time.split("T")[1].split(":")[0],
        10
      );
      console.log("hour:", hour)

      switch (filters.departureTime) {
        case "morning":
          if (hour < 6 || hour >= 12) return false;
          break;
        case "afternoon":
          if (hour < 12 || hour >= 18) return false;
          break;
        case "evening":
          if (hour < 18) return false;
          break;
        default:
          break;
      }
    }

    // Fiyat aralığı filtresi
    if (
      trip.price < filters.priceRange[0] ||
      trip.price > filters.priceRange[1]
    )
      return false;

    return true;
  });
};
