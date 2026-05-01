import axios from "axios";
import { useAuthStore } from "./stores/authStore";

const rawBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://p23africa.com/fastlink-backend/public/api/v1";

const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, "");

const api = axios.create({
  baseURL: normalizedBaseUrl,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;
