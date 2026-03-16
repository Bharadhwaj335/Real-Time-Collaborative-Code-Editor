import { MAX_RECENT_ROOMS, STORAGE_KEYS } from "./constants";

const safeStorageGet = (key) => {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
};

const safeStorageSet = (key, value) => {
	try {
		localStorage.setItem(key, value);
	} catch {
		// Ignore storage write failures to keep UI functional.
	}
};

const safeStorageRemove = (key) => {
	try {
		localStorage.removeItem(key);
	} catch {
		// Ignore storage remove failures to keep UI functional.
	}
};

const safeJsonParse = (value, fallback = null) => {
	try {
		return JSON.parse(value);
	} catch {
		return fallback;
	}
};

export const getStoredToken = () => safeStorageGet(STORAGE_KEYS.TOKEN);

export const setStoredToken = (token) => {
	safeStorageSet(STORAGE_KEYS.TOKEN, token);
};

export const getStoredUser = () => {
	const value = safeStorageGet(STORAGE_KEYS.USER);
	return safeJsonParse(value, null);
};

export const setStoredUser = (user) => {
	safeStorageSet(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const clearAuthStorage = () => {
	safeStorageRemove(STORAGE_KEYS.TOKEN);
	safeStorageRemove(STORAGE_KEYS.USER);
};

export const isAuthenticated = () => {
	const token = getStoredToken();

	if (typeof token !== "string") return false;

	const normalized = token.trim();
	if (!normalized) return false;

	if (normalized === "undefined" || normalized === "null") {
		return false;
	}

	return true;
};

export const getInitials = (name = "Guest") =>
	name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0].toUpperCase())
		.join("");

export const formatMessageTime = (timestamp) => {
	if (!timestamp) return "";

	const date = new Date(timestamp);
	if (Number.isNaN(date.getTime())) return "";

	return date.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit"
	});
};

export const extractRoomId = (input = "") => {
	const trimmedInput = input.trim();
	if (!trimmedInput) return "";

	if (!trimmedInput.includes("/")) {
		return trimmedInput;
	}

	const segments = trimmedInput.split("/").filter(Boolean);
	return segments[segments.length - 1] || "";
};

export const buildRoomInviteLink = (roomId) => {
	const origin = window.location.origin;
	return `${origin}/room/${roomId}`;
};

export const getRecentRooms = () => {
	const value = safeStorageGet(STORAGE_KEYS.RECENT_ROOMS);
	const parsed = safeJsonParse(value, []);

	if (Array.isArray(parsed)) {
		return parsed;
	}

	// Reset malformed historical values like `null` to keep UI stable.
	safeStorageSet(STORAGE_KEYS.RECENT_ROOMS, JSON.stringify([]));
	return [];
};

export const saveRecentRoom = (room) => {
	if (!room?.roomId) return;

	const currentRooms = getRecentRooms();

	const deduplicated = currentRooms.filter(
		(item) => item.roomId.toLowerCase() !== room.roomId.toLowerCase()
	);

	const updated = [
		{
			roomId: room.roomId,
			language: room.language || "javascript",
			touchedAt: new Date().toISOString()
		},
		...deduplicated
	].slice(0, MAX_RECENT_ROOMS);

	safeStorageSet(STORAGE_KEYS.RECENT_ROOMS, JSON.stringify(updated));
};

export const createGuestIdentity = () => {
	const random = Math.floor(100 + Math.random() * 900);
	return {
		id: `guest-${Date.now()}`,
		name: `Guest ${random}`
	};
};
