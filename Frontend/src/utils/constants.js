export const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const SOCKET_URL =
	import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const STORAGE_KEYS = {
	TOKEN: "cc_token",
	USER: "cc_user",
	RECENT_ROOMS: "cc_recent_rooms"
};

export const LANGUAGES = [
	{ label: "JavaScript", value: "javascript" },
	{ label: "TypeScript", value: "typescript" },
	{ label: "Python", value: "python" },
	{ label: "Java", value: "java" },
	{ label: "C++", value: "cpp" },
	{ label: "Go", value: "go" },
	{ label: "Rust", value: "rust" }
];

export const DEFAULT_LANGUAGE = LANGUAGES[0].value;

export const SOCKET_EVENTS = {
	JOIN_ROOM: "JOIN_ROOM",
	LEAVE_ROOM: "LEAVE_ROOM",
	CODE_CHANGE: "CODE_CHANGE",
	CODE_UPDATE: "CODE_UPDATE",
	CURSOR_MOVE: "CURSOR_MOVE",
	CURSOR_UPDATE: "CURSOR_UPDATE",
	SEND_MESSAGE: "SEND_MESSAGE",
	NEW_MESSAGE: "NEW_MESSAGE",
	USER_JOINED: "USER_JOINED",
	USER_LEFT: "USER_LEFT",
	ROOM_USERS: "ROOM_USERS"
};

export const DEFAULT_EDITOR_CODE = `// Welcome to the collaborative editor\n// Start coding with your teammates in real time.\n\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("Team"));\n`;

export const MAX_RECENT_ROOMS = 6;
