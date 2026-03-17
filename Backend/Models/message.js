import { Schema, model } from "mongoose";

// create schema for message
const messageSchema = new Schema(
  {
    roomId: {
      type: String,
      required: [true, "roomId is required"],
    },

    sender: {
      type: String,
      required: [true, "Sender is required"],
    },

    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
    strict: "throw",
    versionKey: false,
  }
);

// create message model
export const MessageModel = model("Message", messageSchema);