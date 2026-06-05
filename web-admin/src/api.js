import axios from "axios";

export const API_BASE_URL = (() => {
  let url = process.env.REACT_APP_API_URL;
  if (url) {
    return url.endsWith("/api") ? url : `${url}/api`;
  }
  return window.location.hostname === "localhost" ? "http://localhost:5000/api" : window.location.origin + "/api";
})();
export const BACKEND_URL = API_BASE_URL.replace("/api", "");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
