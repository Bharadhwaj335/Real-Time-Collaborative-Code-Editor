import express from "express";
import { createRoom, getRoom, leaveRoom } from "../Controllers/room.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const roomRoute = express.Router();

roomRoute.post("/create", authMiddleware, createRoom);
roomRoute.get("/:roomId", getRoom);
roomRoute.post("/leave/:roomId", authMiddleware, leaveRoom);

export default roomRoute;