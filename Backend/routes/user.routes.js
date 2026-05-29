import express from "express";
import {
  getCurrentUser,
  getUsers,
  updateProfile,
  updateProfilePicture,
  deleteProfilePicture,
} from "../Controllers/user.controller.js";
import { loginUser, registerUser } from "../Controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { optionalRegisterMultipart, requireAvatarUpload, validateAvatarMagicBytes } from "../middlewares/upload.middleware.js";
import { validateRequestBody } from "../middlewares/validation.middleware.js";

const userRoute = express.Router();

// Legacy auth aliases for compatibility with older clients.
userRoute.post(
  "/register",
  optionalRegisterMultipart,
  validateRequestBody({ email: true, password: true, name: true }),
  registerUser
);
userRoute.post("/login", validateRequestBody({ email: true, password: true }), loginUser);

userRoute.get("/", authMiddleware, getUsers);
userRoute.get("/me", authMiddleware, getCurrentUser);
userRoute.put("/profile", authMiddleware, updateProfile);
userRoute.put("/profile/picture", authMiddleware, requireAvatarUpload, validateAvatarMagicBytes, updateProfilePicture);
userRoute.delete("/profile/picture", authMiddleware, deleteProfilePicture);

export default userRoute;