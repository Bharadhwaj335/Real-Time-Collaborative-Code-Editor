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

const roomFileSchema = new Schema(
    {
        id: {
            type: String,
            required: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        language: {
            type: String,
            default: "javascript",
        },
        code: {
            type: String,
            default: "",
        },
        lastEditedBy: {
            type: String,
            default: "",
        },
        lastEditedAt: {
            type: Date,
            default: null,
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
        maxParticipants: {
            type: Number,
            min: 2,
            max: 50,
            default: 8,
        },
        users: {
            type: [roomUserSchema],
            default: [],
        },
        files: {
            type: [roomFileSchema],
            default: [],
        },
        activeFileId: {
            type: String,
            default: "",
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