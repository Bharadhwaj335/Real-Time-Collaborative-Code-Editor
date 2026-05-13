import exp from "express";
import { sendMessage, getMessages } from "../Controllers/message.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateRequestBody } from "../middlewares/validation.middleware.js";

const messageRoute = exp.Router();

messageRoute.post("/send", authMiddleware, validateRequestBody({ roomId: true, text: true }), sendMessage);
messageRoute.get("/:roomId", validateRequestBody({ roomId: true }), getMessages);

export default messageRoute;