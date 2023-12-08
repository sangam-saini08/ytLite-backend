import mongoose from "mongoose";
import { DATABASE_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${DATABASE_NAME}`
    );
    console.log(
      `\n MongoDB connected successfully !!\n DB HOST : ${connectionInstance.connection.host}\n DB : ${connectionInstance.connection.name}`
    );
  } catch (error) {
    console.error("MongoDB connection Failed", error);
    process.exit(1);
  }
};

export default connectDB;
