import { Router } from "express";
import { loginUser, registerUser, refreshAccessToken } from "../Controllers/auth.controller.js";
import { validateRequestBody } from "../middlewares/validation.middleware.js";
import { optionalRegisterMultipart } from "../middlewares/upload.middleware.js";

const authRouter = Router();

authRouter.post(
  "/register",
  optionalRegisterMultipart,
  validateRequestBody({ email: true, password: true, name: true }),
  registerUser
);
authRouter.post("/login", validateRequestBody({ email: true, password: true }), loginUser);
authRouter.post("/refresh", refreshAccessToken);

export default authRouter;
