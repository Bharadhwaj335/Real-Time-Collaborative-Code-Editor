import { env } from "../config/env.js";

const NETWORK_RETRY_LIMIT = 3;
const JUDGE0_REQUEST_TIMEOUT_MS = 12000;
const RETRYABLE_NETWORK_CODES = new Set([
	"ECONNRESET",
	"ETIMEDOUT",
	"ECONNREFUSED",
	"EHOSTUNREACH",
	"ENOTFOUND",
	"EAI_AGAIN",
	"UND_ERR_CONNECT_TIMEOUT",
	"UND_ERR_HEADERS_TIMEOUT",
	"UND_ERR_SOCKET",
]);

const LANGUAGE_ID_MAP = {
	javascript: 63,
	typescript: 74,
	python: 71,
	java: 62,
	cpp: 54,
	c: 50,
	go: 60,
	rust: 73,
};

const sleep = (ms) => new Promise((resolve) => {
	setTimeout(resolve, ms);
});

const getErrorCode = (error) => {
	return error?.cause?.code || error?.code || "";
};

const isRetryableNetworkError = (error) => {
	if (!error) return false;

	if (error.name === "AbortError") {
		return true;
	}

	if (error?.cause?.name === "AbortError") {
		return true;
	}

	const code = getErrorCode(error);
	return RETRYABLE_NETWORK_CODES.has(code);
};

const createServiceUnavailableError = (detail = "") => {
	const error = new Error("Code execution service is temporarily unavailable. Please try again.");
	error.statusCode = 503;

	if (detail) {
		error.detail = detail;
	}

	return error;
};

const fetchWithTimeout = async (url, options = {}) => {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => {
		controller.abort();
	}, JUDGE0_REQUEST_TIMEOUT_MS);

	try {
		return await fetch(url, {
			...options,
			signal: controller.signal,
		});
	} catch (error) {
		if (isRetryableNetworkError(error)) {
			throw createServiceUnavailableError(getErrorCode(error) || error.message);
		}

		throw error;
	} finally {
		clearTimeout(timeoutId);
	}
};

const fetchJudge0WithRetry = async (url, options = {}) => {
	for (let attempt = 0; attempt < NETWORK_RETRY_LIMIT; attempt += 1) {
		try {
			const response = await fetchWithTimeout(url, options);

			if (response.status === 429 || response.status >= 500) {
				const payload = await response.text();
				const detail = `Judge0 upstream HTTP ${response.status}: ${payload}`;

				if (attempt < NETWORK_RETRY_LIMIT - 1) {
					await sleep(400 * (attempt + 1));
					continue;
				}

				throw createServiceUnavailableError(detail);
			}

			return response;
		} catch (error) {
			if (error?.statusCode === 503 && attempt < NETWORK_RETRY_LIMIT - 1) {
				await sleep(400 * (attempt + 1));
				continue;
			}

			throw error;
		}
	}

	throw createServiceUnavailableError();
};

const parseJudge0Json = async (response, contextLabel) => {
	try {
		return await response.json();
	} catch (_error) {
		const error = new Error(`Judge0 ${contextLabel} response could not be parsed.`);
		error.statusCode = 502;
		throw error;
	}
};

const resolveLanguageId = (language = "") => {
	const normalized = language.toLowerCase().trim();
	return LANGUAGE_ID_MAP[normalized] || LANGUAGE_ID_MAP.javascript;
};

const buildJudge0Headers = () => {
	const headers = {
		"Content-Type": "application/json",
	};

	if (env.judge0ApiKey) {
		headers["X-RapidAPI-Key"] = env.judge0ApiKey;
	}

	if (env.judge0ApiHost) {
		headers["X-RapidAPI-Host"] = env.judge0ApiHost;
	}

	return headers;
};

const buildOutput = (payload = {}) => {
	return (
		payload.stdout ||
		payload.stderr ||
		payload.compile_output ||
		payload.message ||
		""
	);
};

export const executeCodeRemotely = async ({ code, language, stdin = "" }) => {
	const judge0BaseUrl = env.judge0ApiUrl.replace(/\/$/, "");

	if (!judge0BaseUrl) {
		return {
			output: "Code execution service is not configured.",
			stdout: "",
			stderr: "",
			compile_output: "",
			status: { description: "Not configured" },
		};
	}

	const submissionResponse = await fetchJudge0WithRetry(
		`${judge0BaseUrl}/submissions?base64_encoded=false&wait=false`,
		{
			method: "POST",
			headers: buildJudge0Headers(),
			body: JSON.stringify({
				source_code: code,
				language_id: resolveLanguageId(language),
				stdin,
			}),
		}
	);

	if (!submissionResponse.ok) {
		const errorPayload = await submissionResponse.text();
		const error = new Error(`Judge0 submission failed: ${errorPayload}`);
		error.statusCode = submissionResponse.status >= 500 ? 502 : 400;
		throw error;
	}

	const submission = await parseJudge0Json(submissionResponse, "submission");
	const token = submission?.token;

	if (!token) {
		const error = new Error("Judge0 did not return a submission token.");
		error.statusCode = 502;
		throw error;
	}

	for (let attempt = 0; attempt < 15; attempt += 1) {
		const resultResponse = await fetchJudge0WithRetry(
			`${judge0BaseUrl}/submissions/${token}?base64_encoded=false`,
			{
				method: "GET",
				headers: buildJudge0Headers(),
			}
		);

		if (!resultResponse.ok) {
			const errorPayload = await resultResponse.text();
			const error = new Error(`Judge0 result polling failed: ${errorPayload}`);
			error.statusCode = resultResponse.status >= 500 ? 502 : 400;
			throw error;
		}

		const result = await parseJudge0Json(resultResponse, "result");
		const statusId = result?.status?.id;

		if (statusId && statusId > 2) {
			return {
				token,
				output: buildOutput(result),
				stdout: result.stdout || "",
				stderr: result.stderr || "",
				compile_output: result.compile_output || "",
				status: result.status,
			};
		}

		await sleep(1000);
	}

	return {
		token,
		output: "Execution timed out while waiting for Judge0 result.",
		stdout: "",
		stderr: "",
		compile_output: "",
		status: { description: "Timeout" },
	};
};

