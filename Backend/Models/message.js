import { Schema, model } from "mongoose";

const messageUserSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    roomId: {
      type: String,
      required: [true, "roomId is required"],
      trim: true,
      uppercase: true,
      index: true,
    },

    user: {
      type: messageUserSchema,
      required: [true, "Message user is required"],
    },

    text: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const MessageModel = model("Message", messageSchema);