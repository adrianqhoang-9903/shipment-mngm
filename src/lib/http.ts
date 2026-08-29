import axios from "axios";
import { REQUEST_TIMEOUT_MS } from "../constants";

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000",
  timeout: REQUEST_TIMEOUT_MS,
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        return Promise.reject(
          new Error("Request timed out. Please try again."),
        );
      }

      const status = error.response?.status;
      if (status === 404) {
        return Promise.reject(
          new Error(
            "The requested resource could not be found - it may have been deleted.",
          ),
        );
      }
      if (status !== undefined && status >= 500) {
        return Promise.reject(
          new Error("Something went wrong on the server. Please try again."),
        );
      }
    }
    return Promise.reject(error);
  },
);
