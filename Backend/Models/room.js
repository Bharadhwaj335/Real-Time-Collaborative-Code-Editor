import { Schema, model } from "mongoose";

const roomUserSchema = new Schema(
    {
        id: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            default: "online",
        },
    },
    { _id: false }
);

const roomSchema = new Schema(
    {
        roomId: {
            type: String,
            required: [true, "roomId is required"],
            unique: true,
            uppercase: true,
            trim: true,
        },
        roomName: {
            type: String,
            trim: true,
            default: "",
        },
        language: {
            type: String,
            required: [true, "language is required"],
            default: "javascript",
        },
        code: {
            type: String,
            default: "",
        },
        visibility: {
            type: String,
            enum: ["private", "public"],
            default: "private",
        },
        users: {
            type: [roomUserSchema],
            default: [],
        },
        createdBy: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const RoomModel = model("Room", roomSchema);