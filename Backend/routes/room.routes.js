import express from "express";
import {
  createRoom,
  deleteRoom,
  getRoom,
  leaveRoom,
  listMyRooms,
  updateRoom
} from "../Controllers/room.controller.js";
import { authMiddleware, optionalAuth } from "../middlewares/auth.middleware.js";
import { validateRequestBody } from "../middlewares/validation.middleware.js";

const roomRoute = express.Router();

roomRoute.post("/create", authMiddleware, createRoom);
roomRoute.get("/mine", authMiddleware, listMyRooms);
roomRoute.post("/leave/:roomId", authMiddleware, validateRequestBody({ roomId: true }), leaveRoom);
roomRoute.patch("/:roomId", authMiddleware, validateRequestBody({ roomId: true }), updateRoom);
roomRoute.delete("/:roomId", authMiddleware, validateRequestBody({ roomId: true }), deleteRoom);
roomRoute.get("/:roomId", validateRequestBody({ roomId: true }), getRoom);

export default roomRoute;
