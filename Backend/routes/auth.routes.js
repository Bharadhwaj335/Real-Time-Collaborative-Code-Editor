import { Router } from "express";
import { loginUser, registerUser, refreshAccessToken } from "../Controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.post("/refresh", refreshAccessToken);

export default authRouter;
