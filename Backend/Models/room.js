import { Schema, model } from "mongoose";

const roomSchema = new Schema({
    roomId:{
        type:String,
        required:[true,"roomId is required"],
        unique:true
    },
    language:{
        type:String,
        required:[true,"language is required"],
        default:"javascript"
    },
    code:{
        type:String,
        default:""
    },
    participants:{
        type:[String],
        required:true,
        validate:{
            validator:(v)=> v.length>=2 && v.length<=6,
            message:"Participants must be between 2 and 6"
        }
    },
    createdBy:{
        type:String,
        required:true
    },
    isDeleted:{
    type:Boolean,
    default:false
  }
},
{
    timestamps:true,
    strict:"throw",
    versionKey:false
});

export const RoomModel = model("Room", roomSchema);