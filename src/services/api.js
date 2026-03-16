import axios from "axios";
import { API_BASE_URL } from "../utils/constants";
import { getStoredToken } from "../utils/helpers";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

const MOCK_USER_STORAGE_KEY = "cc_mock_users";
const MOCK_ROOM_STORAGE_KEY = "cc_mock_rooms";

const isNetworkError = (error) => !error?.response;

const readStorageArray = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStorageArray = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const toUserPublicShape = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email
});

const createUniqueId = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now()
    .toString(36)
    .slice(-4)}`;

const createRoomId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const mockRegisterUser = (payload) => {
  const users = readStorageArray(MOCK_USER_STORAGE_KEY);
  const email = payload?.email?.trim().toLowerCase();

  if (!email) {
    throw new Error("Email is required.");
  }

  const duplicateUser = users.find((user) => user.email === email);
  if (duplicateUser) {
    throw new Error("Email already registered in local test mode.");
  }

  const nextUser = {
    id: createUniqueId("user"),
    name: payload?.name || payload?.username || email.split("@")[0] || "Student",
    email,
    password: payload?.password || ""
  };

  users.push(nextUser);
  writeStorageArray(MOCK_USER_STORAGE_KEY, users);

  return {
    success: true,
    mock: true,
    message: "Registered in local test mode.",
    user: toUserPublicShape(nextUser)
  };
};

const mockLoginUser = (payload) => {
  const users = readStorageArray(MOCK_USER_STORAGE_KEY);
  const email = payload?.email?.trim().toLowerCase();
  const password = payload?.password || "";

  const matchedUser = users.find(
    (user) => user.email === email && user.password === password
  );

  if (!matchedUser) {
    throw new Error("Invalid credentials. Register first in local test mode.");
  }

  return {
    success: true,
    mock: true,
    token: `mock-token-${matchedUser.id}-${Date.now()}`,
    user: toUserPublicShape(matchedUser)
  };
};

const mockCreateRoom = (payload = {}) => {
  const rooms = readStorageArray(MOCK_ROOM_STORAGE_KEY);
  const roomId = createRoomId();

  const nextRoom = {
    roomId,
    language: payload?.language || "javascript",
    roomName: payload?.roomName || "",
    visibility: payload?.visibility || "private",
    createdAt: new Date().toISOString()
  };

  const updated = [nextRoom, ...rooms.filter((item) => item.roomId !== roomId)];
  writeStorageArray(MOCK_ROOM_STORAGE_KEY, updated);

  return {
    ...nextRoom,
    mock: true
  };
};

const mockJoinRoom = (roomId) => {
  const rooms = readStorageArray(MOCK_ROOM_STORAGE_KEY);

  const matchedRoom = rooms.find(
    (room) => room.roomId.toLowerCase() === String(roomId).toLowerCase()
  );

  if (!matchedRoom) {
    throw new Error("Room not found in local test mode. Create it first.");
  }

  return {
    ...matchedRoom,
    mock: true
  };
};

const mockExecuteCode = (payload) => ({
  stdout: `Local test mode: backend is disconnected. Simulated run for ${
    payload?.language || "code"
  }.`,
  stderr: "",
  error: ""
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const loginUser = async (payload) => {
  const loginPaths = ["/auth/login", "/auth/signin"];
  let lastError = null;

  for (const path of loginPaths) {
    try {
      const response = await api.post(path, payload);
      return response.data;
    } catch (error) {
      lastError = error;

      if (isNetworkError(error)) {
        return mockLoginUser(payload);
      }

      if (error?.response?.status === 404) {
        continue;
      }

      throw error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error("Login failed.");
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

  const registerPaths = [
    "/auth/register",
    "/auth/signup"
  ];

  let lastError = null;

  for (const path of registerPaths) {
    try {
      const response = await api.post(path, normalizedPayload);
      return response.data;
    } catch (error) {
      const status = error?.response?.status;
      lastError = error;

      if (isNetworkError(error)) {
        return mockRegisterUser(normalizedPayload);
      }

      if (status === 404) {
        continue;
      }

      throw error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error("Registration failed.");
};

export const createRoom = async (payload = {}) => {
  try {
    const response = await api.post("/rooms/create", payload);
    return response.data;
  } catch (error) {
    if (isNetworkError(error)) {
      return mockCreateRoom(payload);
    }

    throw error;
  }
};

export const joinRoom = async (roomId) => {
  try {
    const response = await api.get(`/rooms/${roomId}`);
    return response.data;
  } catch (error) {
    if (isNetworkError(error)) {
      return mockJoinRoom(roomId);
    }

    throw error;
  }
};

export const getRoomMessages = async (roomId) => {
  try {
    const response = await api.get(`/messages/${roomId}`);
    return response.data;
  } catch (error) {
    if (isNetworkError(error)) {
      return [];
    }

    throw error;
  }
};

export const executeCode = async (payload) => {
  try {
    const response = await api.post("/code/execute", payload);
    return response.data;
  } catch (error) {
    if (isNetworkError(error)) {
      return mockExecuteCode(payload);
    }

    if (error?.response?.status === 404) {
      try {
        const fallback = await api.post("/code/run", payload);
        return fallback.data;
      } catch (fallbackError) {
        if (isNetworkError(fallbackError)) {
          return mockExecuteCode(payload);
        }

        throw fallbackError;
      }
    }

    throw error;
  }
};

export default api;