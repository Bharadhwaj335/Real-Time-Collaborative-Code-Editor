import { UserModel } from "../Models/user.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

//user registration
export const registerUser = async(req,res)=>{
  try{

    const {userName,email,password}=req.body;

    const hashedPassword = await bcrypt.hash(password,10);

    const user = await UserModel.create({
      userName,
      email,
      password:hashedPassword
    });

    res.status(201).json({
      success:true,
      user
    });

  }catch(err){
    res.status(500).json({error:err.message});
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      { id: user._id },
       process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      token,
      user
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get All Users
export const getUsers = async (req, res) => {
  try {

    const users = await UserModel.find();

    res.json({
      success: true,
      data: users,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Soft delete
export const deleteUser = async (req,res)=>{
  try{

    const {id} = req.params;

    const user = await UserModel.findByIdAndUpdate(
      id,
      { isDeleted:true },
      { new:true }
    );

    res.json({
      message:"User soft deleted",
      user
    });

  }catch(err){
    res.status(500).json({error:err.message});
  }
};