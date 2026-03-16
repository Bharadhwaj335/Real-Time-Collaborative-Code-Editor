import axios from "axios";
import { API_BASE_URL } from "../utils/constants";
import { getStoredToken } from "../utils/helpers";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

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

export default api;