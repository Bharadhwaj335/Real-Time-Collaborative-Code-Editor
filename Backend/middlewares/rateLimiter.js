const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;
const requestStore = new Map();

const getClientKey = (req) => {
	const forwardedFor = req.headers["x-forwarded-for"];

	if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
		return forwardedFor.split(",")[0].trim();
	}

	return req.ip || req.socket.remoteAddress || "unknown-client";
};

export const codeExecutionRateLimiter = (req, res, next) => {
	const key = getClientKey(req);
	const now = Date.now();
	const existing = requestStore.get(key);

	if (!existing || now > existing.resetAt) {
		requestStore.set(key, {
			count: 1,
			resetAt: now + WINDOW_MS,
		});

		return next();
	}

	if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
		const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);

		return res.status(429).json({
			success: false,
			message: `Rate limit exceeded. Try again in ${retryAfterSeconds}s.`,
		});
	}

	existing.count += 1;
	requestStore.set(key, existing);
	return next();
};

