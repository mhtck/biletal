import service from "./index";

export const authService = {
  login: (credentials) => {
    return service.post("/auth/login/", credentials);
  },

  register: (userData) => {
    return service.post("/auth/register/", userData);
  },

  logout: () => {
    return service.post("/auth/logout/");
  },

  verifyToken: (userData) => {
    console.log("verifyToken: ", userData)
    return service.post("/auth/token/refresh/", userData);
  },

  getProfile: () => {
    return service.get("/auth/profile/");
  },

  updateProfile: (userData) => {
    return service.put("/auth/profile/", userData);
  },

  forgotPassword: (email) => {
    return service.post("/auth/forgot-password/", { email });
  },

  resetPassword: (resetData) => {
    return service.post("/auth/reset-password/", resetData);
  },
};
