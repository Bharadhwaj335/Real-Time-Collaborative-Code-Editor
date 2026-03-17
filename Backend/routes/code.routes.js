import exp from "express";
import { executeCode } from "../Controllers/code.controller.js";
import { codeExecutionRateLimiter } from "../middlewares/rateLimiter.js";

const codeRoute = exp.Router();

codeRoute.post("/execute", codeExecutionRateLimiter, executeCode);
codeRoute.post("/run", codeExecutionRateLimiter, executeCode);

export default codeRoute;