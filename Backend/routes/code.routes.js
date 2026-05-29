import exp from "express";
import {
	executeCode,
	getRoomCode,
	saveRoomCode,
} from "../Controllers/code.controller.js";
import { codeExecutionRateLimiter } from "../middlewares/rateLimiter.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const codeRoute = exp.Router();

codeRoute.post("/execute", authMiddleware, codeExecutionRateLimiter, executeCode);
codeRoute.post("/run", authMiddleware, codeExecutionRateLimiter, executeCode);
codeRoute.post("/save", authMiddleware, saveRoomCode);
codeRoute.get("/:roomId", authMiddleware, getRoomCode);

export default codeRoute;