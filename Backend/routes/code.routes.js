import exp from "express";
import {
	executeCode,
	getRoomCode,
	saveRoomCode,
} from "../Controllers/code.controller.js";
import { codeExecutionRateLimiter } from "../middlewares/rateLimiter.js";

const codeRoute = exp.Router();

codeRoute.post("/execute", codeExecutionRateLimiter, executeCode);
codeRoute.post("/run", codeExecutionRateLimiter, executeCode);
codeRoute.post("/save", saveRoomCode);
codeRoute.get("/:roomId", getRoomCode);

export default codeRoute;