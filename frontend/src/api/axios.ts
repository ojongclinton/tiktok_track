// axios.ts
import axios, { AxiosError } from "axios";
import store from "../app/store"; // your Redux store
import { account } from "../appwrite/appwrite";
import { logout, setNewJwt } from "../slices/authSlice";

const axiosPriviate = axios.create({
  baseURL: "http://localhost:3001/api",
  withCredentials: false,
});

let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Attach token from Redux
axiosPriviate.interceptors.request.use(
  (config: any) => {
    const token = store.getState().auth.jwtToken;
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401s
axiosPriviate.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
          }
          return axiosPriviate(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Hit refresh endpoint
        let res = await account.createJWT();

        const newToken = res.jwt;

        // Update Redux
        store.dispatch(setNewJwt({ jwtToken: newToken }));

        axiosPriviate.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newToken}`;
        processQueue(null, newToken);

        return axiosPriviate(originalRequest);
      } catch (err) {
        processQueue(err, null);
        store.dispatch(logout()); // clear Redux auth state
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosPriviate;
