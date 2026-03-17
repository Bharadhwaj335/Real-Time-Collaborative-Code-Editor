import { config } from "dotenv";
config();
import exp from "express";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import messageRoute from "./routes/message.routes.js";
import userRoute from "./routes/user.routes.js";
import roomRoute from "./routes/room.routes.js";
import codeRoute from "./routes/code.routes.js";

const app = exp();

app.use(exp.json());
app.use(cookieParser());
app.use("/api/users", userRoute);
app.use("/api/rooms", roomRoute);
app.use("/api/messages", messageRoute);
app.use("/api/code",codeRoute)

connectDB();

app.listen(process.env.PORT || 7000, () => {
  console.log(`Server running on port ${process.env.PORT || 7000}`);
});