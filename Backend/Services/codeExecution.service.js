import { env } from "../config/env.js";

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

	const submissionResponse = await fetch(
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
		error.statusCode = 502;
		throw error;
	}

	const submission = await submissionResponse.json();
	const token = submission?.token;

	if (!token) {
		const error = new Error("Judge0 did not return a submission token.");
		error.statusCode = 502;
		throw error;
	}

	for (let attempt = 0; attempt < 15; attempt += 1) {
		const resultResponse = await fetch(
			`${judge0BaseUrl}/submissions/${token}?base64_encoded=false`,
			{
				method: "GET",
				headers: buildJudge0Headers(),
			}
		);

		if (!resultResponse.ok) {
			const errorPayload = await resultResponse.text();
			const error = new Error(`Judge0 result polling failed: ${errorPayload}`);
			error.statusCode = 502;
			throw error;
		}

		const result = await resultResponse.json();
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

