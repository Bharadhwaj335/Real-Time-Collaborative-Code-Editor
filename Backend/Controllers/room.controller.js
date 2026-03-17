import { RoomModel } from "../Models/room.js";

// Create Room
export const createRoom = async (req, res) => {
  try {

    const room = await RoomModel.create(req.body);

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: room,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Room by ID
export const getRoom = async (req,res)=>{
  try{

    const room = await RoomModel.findOne({
      roomId:req.params.roomId,
      isDeleted:false
    });

    if(!room){
      return res.status(404).json({
        message:"Room not found"
      });
    }

    res.json(room);

  }catch(err){
    res.status(500).json({error:err.message});
  }
};
//leave room
export const leaveRoom = async (req,res)=>{
  try{

    const {roomId} = req.params;
    const {userName} = req.body;

    const room = await RoomModel.findOneAndUpdate(
      {roomId},
      { $pull: { participants: userName } },
      { new:true }
    );

    if(!room){
      return res.status(404).json({
        message:"Room not found"
      });
    }

    res.json({
      message:"User left the room",
      room
    });

  }catch(err){
    res.status(500).json({error:err.message});
  }
};

//Soft delete room
export const deleteRoom = async (req,res)=>{
  try{

    const {roomId} = req.params;

    const room = await RoomModel.findOneAndUpdate(
      {roomId},
      {isDeleted:true},
      {new:true}
    );

    if(!room){
      return res.status(404).json({
        message:"Room not found"
      });
    }

    res.json({
      message:"Room soft deleted",
      room
    });

  }catch(err){
    res.status(500).json({
      error:err.message
    });
  }
}; 