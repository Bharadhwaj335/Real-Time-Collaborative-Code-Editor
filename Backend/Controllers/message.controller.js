import { MessageModel } from "../Models/message.js";

const normalizeRoomId = (value = "") => value.trim().toUpperCase();

const toClientMessage = (message) => ({
  _id: message._id,
  roomId: message.roomId,
  text: message.text,
  user: message.user,
  senderId: message.user?.id,
  senderName: message.user?.name,
  timestamp: message.timestamp,
  createdAt: message.createdAt,
});

export const createMessage = async ({ roomId, senderId, senderName, text }) => {
  const saved = await MessageModel.create({
    roomId: normalizeRoomId(roomId),
    user: {
      id: String(senderId),
      name: senderName || "Collaborator",
    },
    text: text.trim(),
    timestamp: new Date(),
  });

  return toClientMessage(saved);
};

export const sendMessage = async (req, res, next) => {
  try {
    const roomId = normalizeRoomId(req.body?.roomId || "");
    const senderId = req.body?.senderId || req.user?.id;
    const senderName = req.body?.senderName || req.user?.name;
    const text = (req.body?.text || req.body?.message || "").trim();

    if (!roomId || !senderId || !text) {
      return res.status(400).json({
        success: false,
        message: "roomId, senderId, and text are required.",
      });
    }

    const message = await createMessage({
      roomId,
      senderId,
      senderName,
      text,
    });

    return res.status(201).json({
      success: true,
      data: message,
    });
  } catch (err) {
    return next(err);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const roomId = normalizeRoomId(req.params.roomId);
    const messages = await MessageModel.find({
      roomId,
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      messages: messages.map(toClientMessage),
    });
  } catch (err) {
    return next(err);
  }
};

