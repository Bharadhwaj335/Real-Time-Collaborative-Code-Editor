import express from "express";
import { registerUser, getUsers ,loginUser,deleteUser } from "../Controllers/user.controller.js";

const userRoute = express.Router();

userRoute.post("/register", registerUser);
userRoute.get("/", getUsers);
userRoute.post("/login", loginUser);
userRoute.delete("/delete/:id", deleteUser);

export default userRoute;