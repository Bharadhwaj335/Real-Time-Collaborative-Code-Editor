import exp from "express";
import { sendMessage, getMessages } from "../Controllers/message.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const messageRoute = exp.Router();

messageRoute.post("/send", authMiddleware, sendMessage);
messageRoute.get("/:roomId", getMessages);

export default messageRoute;