import exp from "express";
import { sendMessage, getMessages } from "../Controllers/message.controller.js";

const messageRoute = exp.Router();

messageRoute.post("/send", sendMessage);
messageRoute.get("/:roomId", getMessages);

export default messageRoute;