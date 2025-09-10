import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "@/lib/services/authService";
import { tokenHandler } from "@/lib/utils/tokenHandler";

// Login Slice
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      console.log("response:", response.data.refresh);
      tokenHandler.setToken(response.data.refresh);
      tokenHandler.setAccess(response.data.access);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Oturum Açılamadı"
      );
    }
  }
);

// Register Slice
export const registerUser = createAsyncThunk(
  "auth/register",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.register(credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Kayıt yapılamadı"
      );
    }
  }
);

// Logout Slice
export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      tokenHandler.removeToken();
      return {};
    } catch (error) {
      tokenHandler.removeToken();
      return rejectWithValue(error.message || "Oturum Kapatılamadı");
    }
  }
);

// Auth Status
export const checkAuthStatus = createAsyncThunk(
  "auth/token/refresh",
  async (_, { rejectWithValue }) => {
    try {
      const token = tokenHandler.getToken();
      if (!token) {
        return rejectWithValue("Token Bulunmadı");
      }
      const userData = {refresh: token}
      const response = await authService.verifyToken(userData);
      console.log("authSlice: ",response)

      return response.data;
    } catch (error) {
      console.log("error: ", error)
      /* tokenHandler.removeToken();
      return rejectWithValue(
        error.response?.data?.message || "Oturum doğrulama başarısız"
      ); */
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.verifyToken(); // Using /auth/me endpoint
      return response.data.user || response.data;
    } catch (error) {
      console.error("fetchProfile :", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Profil getirmr başarısız";
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  user: null,
  token: tokenHandler.getToken(),
  isAuthenticated: !!tokenHandler.getToken(),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      tokenHandler.clearAll();
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
      tokenHandler.setToken(action.payload.token);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      })
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearAuth, setCredentials } = authSlice.actions;
export default authSlice.reducer;
