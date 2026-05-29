import { Router } from "express";
import { loginUser, registerUser, refreshAccessToken, logoutUser } from "../Controllers/auth.controller.js";
import { validateRequestBody } from "../middlewares/validation.middleware.js";
import { optionalRegisterMultipart, validateAvatarMagicBytes } from "../middlewares/upload.middleware.js";
import { authRateLimiter } from "../middlewares/rateLimiter.js";

const authRouter = Router();

authRouter.post(
  "/register",
  authRateLimiter,
  optionalRegisterMultipart,
  validateAvatarMagicBytes,
  validateRequestBody({ email: true, password: true, name: true }),
  registerUser
);
authRouter.post("/login", authRateLimiter, validateRequestBody({ email: true, password: true }), loginUser);
authRouter.post("/refresh", refreshAccessToken);
authRouter.post("/logout", logoutUser);

export default authRouter;
