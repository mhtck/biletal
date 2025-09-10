import axios from "axios";
import { tokenHandler } from "@/lib/utils/tokenHandler";

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

service.interceptors.request.use(
  (config) => {
    const token = tokenHandler.getAccess();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.status, error.response?.data);

    if (error.response?.status === 401) {

        tokenHandler.removeToken();
        if(!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
        }
    }
    return Promise.reject(error);
  }
);

export default service;
