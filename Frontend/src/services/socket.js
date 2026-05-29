import { io } from "socket.io-client";
import axios from "axios";
import { SOCKET_URL } from "../utils/constants";
import { API_BASE_URL } from "../utils/constants";

let reconnectAttempt = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 1000;

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionDelay: INITIAL_RECONNECT_DELAY,
  reconnectionDelayMax: 10000,
  reconnectionAttempts: MAX_RECONNECT_ATTEMPTS
});

const isDev = import.meta.env.DEV;

// Socket event listeners for connection state
socket.on("connect", () => {
  reconnectAttempt = 0;
  if (isDev) {
    console.info("✓ Socket connected successfully");
  }
});

socket.on("disconnect", async (reason) => {
  if (isDev) {
    console.warn(`✗ Socket disconnected: ${reason}`);
  }
  
  if (reason === "io server disconnect") {
    try {
      // Refresh token dynamically from HTTP-Only cookie using direct axios post
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
      const { token } = response.data;
      if (token) {
        const { setStoredToken } = await import("../utils/helpers");
        setStoredToken(token);
        socket.auth = { token };
      }
    } catch (error) {
      if (isDev) {
        console.error("Token refresh failed during socket reconnect:", error);
      }
    }
    socket.connect();
  }
});

socket.on("connect_error", (error) => {
  if (isDev) {
    console.error("Socket connection error:", error.message);
  }
});

socket.on("error", (error) => {
  if (isDev) {
    console.error("Socket error:", error);
  }
});

export const connectSocket = (token) => {
  if (token) {
    socket.auth = { token };
  }

  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const isSocketConnected = () => socket.connected;

export default socket;