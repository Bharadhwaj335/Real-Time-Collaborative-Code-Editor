import express from "express";
import { createRoom, getRoom,deleteRoom ,leaveRoom} from "../Controllers/room.controller.js";

const roomRoute = express.Router();

roomRoute.post("/create", createRoom);
roomRoute.get("/:roomId", getRoom);
roomRoute.delete("/delete/:roomId", deleteRoom);
roomRoute.post("/leave/:roomId", leaveRoom);

export default roomRoute;