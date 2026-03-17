import { useEffect, useMemo, useState } from "react";
import useSocket from "./useSocket";
import { SOCKET_EVENTS } from "../utils/constants";

const normalizeUser = (user) => ({
	id: user?.id || user?._id || "",
	name: user?.name || user?.username || "Guest",
	status: user?.status || "online"
});

const useRoom = ({ roomId, user }) => {
	const { socket, isConnected } = useSocket();
	const [users, setUsers] = useState([]);

	const identity = useMemo(
		() => ({
			id: user?.id,
			name: user?.name || "Guest"
		}),
		[user?.id, user?.name]
	);

	useEffect(() => {
		if (!roomId || !identity.id) return;

		socket.emit(SOCKET_EVENTS.JOIN_ROOM, {
			roomId,
			user: identity
		});

		const handleRoomUsers = (payload) => {
			const nextUsers = Array.isArray(payload)
				? payload
				: payload?.users || [];

			setUsers(nextUsers.map(normalizeUser));
		};

		const handleUserJoined = (payload) => {
			if (Array.isArray(payload?.users)) {
				setUsers(payload.users.map(normalizeUser));
				return;
			}

			if (!payload?.user) return;

			setUsers((prev) => {
				const normalized = normalizeUser(payload.user);
				const withoutDuplicate = prev.filter((item) => item.id !== normalized.id);
				return [...withoutDuplicate, normalized];
			});
		};

		const handleUserLeft = (payload) => {
			if (Array.isArray(payload?.users)) {
				setUsers(payload.users.map(normalizeUser));
				return;
			}

			const userId = payload?.userId || payload?.id;
			if (!userId) return;

			setUsers((prev) => prev.filter((item) => item.id !== userId));
		};

		socket.on(SOCKET_EVENTS.ROOM_USERS, handleRoomUsers);
		socket.on(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
		socket.on(SOCKET_EVENTS.USER_LEFT, handleUserLeft);

		return () => {
			socket.emit(SOCKET_EVENTS.LEAVE_ROOM, {
				roomId,
				userId: identity.id
			});

			socket.off(SOCKET_EVENTS.ROOM_USERS, handleRoomUsers);
			socket.off(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
			socket.off(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
		};
	}, [identity, roomId, socket]);

	return {
		users,
		setUsers,
		isConnected
	};
};

export default useRoom;
