import axios from "axios";
import { API_BASE_URL } from "../utils/constants";
import { getStoredToken, clearAuthStorage } from "../utils/helpers";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  isRefreshing = false;
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return api.post("/auth/refresh")
        .then((response) => {
          const { token } = response.data;
          
          if (token) {
            processQueue(null, token);
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          } else {
            clearAuthStorage();
            processQueue(new Error("Token refresh failed"), null);
            return Promise.reject(error);
          }
        })
        .catch((err) => {
          clearAuthStorage();
          processQueue(err, null);
          return Promise.reject(err);
        });
    }

    return Promise.reject(error);
  }
);

export const loginUser = async (payload) => {
  const response = await api.post("/auth/login", payload);
  return response.data;
};

export const registerUser = async (payload) => {
  const cleanName = payload?.name?.trim() || "";

  const normalizedPayload = {
    ...payload,
    name: cleanName,
    username: payload?.username || cleanName,
    fullName: payload?.fullName || cleanName,
    email: payload?.email?.trim().toLowerCase(),
    password: payload?.password || ""
  };

  const response = await api.post("/auth/register", normalizedPayload);
  return response.data;
};

export const createRoom = async (payload = {}) => {
  const response = await api.post("/rooms/create", payload);
  return response.data;
};

export const joinRoom = async (roomId) => {
  const response = await api.get(`/rooms/${roomId}`);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/users/me");
  return response.data;
};

export const updateProfile = async (payload = {}) => {
  const response = await api.put("/users/profile", payload);
  return response.data;
};

export const getRoomMessages = async (roomId) => {
  const response = await api.get(`/messages/${roomId}`);
  return response.data;
};

export const executeCode = async (payload) => {
  try {
    const response = await api.post("/code/execute", payload);
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      const fallback = await api.post("/code/run", payload);
      return fallback.data;
    }

    throw error;
  }
};

export const getRoomCodeSnapshot = async (roomId) => {
  const response = await api.get(`/code/${roomId}`);
  return response.data;
};

export const saveRoomCodeSnapshot = async (payload) => {
  const response = await api.post("/code/save", payload);
  return response.data;
};

export default api;