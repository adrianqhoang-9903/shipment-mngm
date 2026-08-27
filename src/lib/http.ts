import axios from "axios";
import { REQUEST_TIMEOUT_MS } from "../constants";

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000",
  timeout: REQUEST_TIMEOUT_MS,
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
      return Promise.reject(new Error("Request timed out. Please try again."));
    }
    return Promise.reject(error);
  },
);
