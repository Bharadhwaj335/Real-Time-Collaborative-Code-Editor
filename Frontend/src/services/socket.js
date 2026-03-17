import { io } from "socket.io-client";
import { SOCKET_URL } from "../utils/constants";

const socket = io(SOCKET_URL, {
	autoConnect: false,
	transports: ["websocket"],
	reconnection: true
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

export default socket;