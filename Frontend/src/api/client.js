import axios from "axios";

export const clientServer = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8080/api",
});

// Automatically attach the token to every request
clientServer.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
