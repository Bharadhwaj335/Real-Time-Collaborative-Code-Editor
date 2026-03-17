import mongoose from "mongoose";
import { connect } from 'mongoose';
export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("DB connection successful");
  } catch (err) {
    console.log("DB connection unsuccessful", err);
  }
};