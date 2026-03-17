import express from "express";
import { getCurrentUser, getUsers } from "../Controllers/user.controller.js";
import { loginUser, registerUser } from "../Controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const userRoute = express.Router();

// Legacy auth aliases for compatibility with older clients.
userRoute.post("/register", registerUser);
userRoute.post("/login", loginUser);

userRoute.get("/", getUsers);
userRoute.get("/me", authMiddleware, getCurrentUser);

export default userRoute;