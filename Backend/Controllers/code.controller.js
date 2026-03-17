import { RoomModel } from "../Models/room.js";

// save or update code in a room
export const updateCode = async (req, res) => {
  try {
    const { roomId, code } = req.body;

    const room = await RoomModel.findOneAndUpdate(
      { roomId },
      { code },
      { new: true }
    );
    if (!room) {
      return res.status(404).json({
        message: "Room not found"
      });
    }

    res.json({
      success: true,
      code: room.code
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// get code of a room
export const getCode = async (req, res) => {
  try {
    const room = await RoomModel.findOne({
      roomId: req.params.roomId
    });

    if (!room) {
      return res.status(404).json({
        message: "Room not found"
      });
    }

    res.json({
      code: room.code
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};