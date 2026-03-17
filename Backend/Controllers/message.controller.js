import { MessageModel } from "../Models/message.js";

// send message
export const sendMessage = async (req, res) => {
  try {
    const { roomId, sender, message } = req.body;

    const msg = await MessageModel.create({
      roomId,
      sender,
      message,
    });

    res.status(201).json({
      success: true,
      msg,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// get messages of room
export const getMessages = async (req, res) => {
  try {
    const messages = await MessageModel.find({
      roomId: req.params.roomId,
    });

    res.json(messages);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

