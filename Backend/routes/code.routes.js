import exp from "express";
import { updateCode, getCode } from "../Controllers/code.controller.js";

const codeRoute = exp.Router();

codeRoute.post("/update", updateCode);
codeRoute.get("/:roomId", getCode);

export default codeRoute;