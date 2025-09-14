import mongoose from "mongoose";
import { config } from "./config.js";

const connectDB = async() => {
    try {
        
        mongoose.connection.on('connected', () => {
            console.log("Connected to Database succesfully")
        })

        mongoose.connection.on('error', (err) => {
            console.log("Error in connecting to DB", err);
        })
        
        await mongoose.connect(config.databaseUrl as string)

    } catch (error) {
        console.error("Failed to connect to DB", error)
        process.exit(1)
    }
}

export default connectDB