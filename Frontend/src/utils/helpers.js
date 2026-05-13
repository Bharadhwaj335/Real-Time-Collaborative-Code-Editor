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

export const getStoredToken = () => {
	const token = safeStorageGet(STORAGE_KEYS.TOKEN);

	if (typeof token !== "string") {
		return null;
	}

	const normalized = token.trim();

	if (
		!normalized ||
		normalized === "undefined" ||
		normalized === "null" ||
		normalized.startsWith("mock-token-")
	) {
		safeStorageRemove(STORAGE_KEYS.TOKEN);
		safeStorageRemove(STORAGE_KEYS.USER);
		return null;
	}

	return normalized;
};

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
	return Boolean(getStoredToken());
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

export const removeRecentRoom = (roomId) => {
	if (!roomId) return;

	const list = getRecentRooms().filter(
		(item) => String(item.roomId).toUpperCase() !== String(roomId).toUpperCase()
	);

	safeStorageSet(STORAGE_KEYS.RECENT_ROOMS, JSON.stringify(list));
};

export const getStarredRoomIds = () => {
	const value = safeStorageGet(STORAGE_KEYS.STARRED_ROOMS);
	const parsed = safeJsonParse(value, []);

	return Array.isArray(parsed) ? parsed.map((id) => String(id).toUpperCase()) : [];
};

export const isRoomStarred = (roomId) => {
	if (!roomId) return false;
	const key = String(roomId).toUpperCase();
	return getStarredRoomIds().includes(key);
};

export const toggleStarredRoom = (roomId) => {
	if (!roomId) return false;

	const key = String(roomId).toUpperCase();
	const current = new Set(getStarredRoomIds());

	if (current.has(key)) {
		current.delete(key);
	} else {
		current.add(key);
	}

	safeStorageSet(STORAGE_KEYS.STARRED_ROOMS, JSON.stringify(Array.from(current)));
	return current.has(key);
};

export const removeStarredRoom = (roomId) => {
	if (!roomId) return;
	const key = String(roomId).toUpperCase();
	const next = getStarredRoomIds().filter((id) => id !== key);
	safeStorageSet(STORAGE_KEYS.STARRED_ROOMS, JSON.stringify(next));
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
			roomName: room.roomName || room.name || "",
			language: room.language || "javascript",
			touchedAt: new Date().toISOString()
		},
		...deduplicated
	].slice(0, MAX_RECENT_ROOMS);

	safeStorageSet(STORAGE_KEYS.RECENT_ROOMS, JSON.stringify(updated));
};

/** Short relative label for recent-room "last opened" UI (e.g. "Just now", "3h ago"). */
export const formatRecentOpened = (iso) => {
	if (!iso || typeof iso !== "string") return "";

	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";

	const diffMs = Date.now() - date.getTime();
	if (diffMs < 60_000) return "Just now";
	if (diffMs < 3_600_000) return `${Math.max(1, Math.floor(diffMs / 60_000))}m ago`;
	if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
	if (diffMs < 7 * 86_400_000) return `${Math.floor(diffMs / 86_400_000)}d ago`;

	return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

export const createGuestIdentity = () => {
	const random = Math.floor(100 + Math.random() * 900);
	return {
		id: `guest-${Date.now()}`,
		name: `Guest ${random}`
	};
};

export const getStoredGuestIdentity = () => {
	const value = safeStorageGet(STORAGE_KEYS.GUEST_IDENTITY);
	return safeJsonParse(value, null);
};

export const setStoredGuestIdentity = (guest) => {
	safeStorageSet(STORAGE_KEYS.GUEST_IDENTITY, JSON.stringify(guest));
};

export const getOrCreateGuestIdentity = () => {
	const existing = getStoredGuestIdentity();
	if (existing && existing.id && existing.name) {
		return existing;
	}

	const newGuest = createGuestIdentity();
	setStoredGuestIdentity(newGuest);
	return newGuest;
};
