import { useEffect, useMemo, useState } from "react";
import useSocket from "./useSocket";
import { DEFAULT_MAX_PARTICIPANTS, SOCKET_EVENTS } from "../utils/constants";

const normalizeUser = (user) => ({
	id: user?.id || user?._id || "",
	name: user?.name || user?.username || "Guest",
	status: user?.status || "online"
});

const useRoom = ({ roomId, user }) => {
	const { socket, isConnected } = useSocket();
	const [users, setUsers] = useState([]);
	const [roomError, setRoomError] = useState("");
	const [maxParticipants, setMaxParticipants] = useState(DEFAULT_MAX_PARTICIPANTS);
	const [currentParticipants, setCurrentParticipants] = useState(0);

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

			if (Number.isFinite(Number(payload?.maxParticipants))) {
				setMaxParticipants(Number(payload.maxParticipants));
			}

			if (Number.isFinite(Number(payload?.currentParticipants))) {
				setCurrentParticipants(Number(payload.currentParticipants));
			} else {
				setCurrentParticipants(nextUsers.length);
			}
		};

		const handleUserJoined = (payload) => {
			if (Array.isArray(payload?.users)) {
				setUsers(payload.users.map(normalizeUser));
				setCurrentParticipants(payload.users.length);

				if (Number.isFinite(Number(payload?.maxParticipants))) {
					setMaxParticipants(Number(payload.maxParticipants));
				}

				return;
			}

			if (!payload?.user) return;

			setUsers((prev) => {
				const normalized = normalizeUser(payload.user);
				const withoutDuplicate = prev.filter((item) => item.id !== normalized.id);
				const next = [...withoutDuplicate, normalized];
				setCurrentParticipants(next.length);
				return next;
			});
		};

		const handleUserLeft = (payload) => {
			if (Array.isArray(payload?.users)) {
				setUsers(payload.users.map(normalizeUser));
				setCurrentParticipants(payload.users.length);
				return;
			}

			const userId = payload?.userId || payload?.id;
			if (!userId) return;

			setUsers((prev) => {
				const next = prev.filter((item) => item.id !== userId);
				setCurrentParticipants(next.length);
				return next;
			});
		};

		const handleRoomState = (payload) => {
			if (!payload) return;

			if (Number.isFinite(Number(payload?.maxParticipants))) {
				setMaxParticipants(Number(payload.maxParticipants));
			}

			if (Number.isFinite(Number(payload?.currentParticipants))) {
				setCurrentParticipants(Number(payload.currentParticipants));
			}
		};

		const handleJoinError = (payload) => {
			const message = payload?.message || "Unable to join room.";
			setRoomError(message);

			if (Number.isFinite(Number(payload?.maxParticipants))) {
				setMaxParticipants(Number(payload.maxParticipants));
			}

			if (Number.isFinite(Number(payload?.currentParticipants))) {
				setCurrentParticipants(Number(payload.currentParticipants));
			}
		};

		socket.on(SOCKET_EVENTS.ROOM_USERS, handleRoomUsers);
		socket.on(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
		socket.on(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
		socket.on(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
		socket.on(SOCKET_EVENTS.ROOM_JOIN_ERROR, handleJoinError);

		return () => {
			socket.emit(SOCKET_EVENTS.LEAVE_ROOM, {
				roomId,
				userId: identity.id
			});

			socket.off(SOCKET_EVENTS.ROOM_USERS, handleRoomUsers);
			socket.off(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
			socket.off(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
			socket.off(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
			socket.off(SOCKET_EVENTS.ROOM_JOIN_ERROR, handleJoinError);
		};
	}, [identity, roomId, socket]);

	return {
		users,
		setUsers,
		isConnected,
		roomError,
		setRoomError,
		maxParticipants,
		currentParticipants
	};
};

export default useRoom;
