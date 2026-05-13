import { io } from "socket.io-client";
import { SOCKET_URL } from "../utils/constants";

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

// Socket event listeners for connection state
socket.on("connect", () => {
	reconnectAttempt = 0;
	console.info("✓ Socket connected successfully");
});

socket.on("disconnect", (reason) => {
	console.warn(`✗ Socket disconnected: ${reason}`);
	if (reason === "io server disconnect") {
		socket.connect();
	}
});

socket.on("connect_error", (error) => {
	console.error("Socket connection error:", error.message);
});

socket.on("error", (error) => {
	console.error("Socket error:", error);
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