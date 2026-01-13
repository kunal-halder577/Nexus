import mongoose from "mongoose";
import { dbName, dbPassword, dbUsername } from "../constants.js";

export const connectDB = async () => {
    try {
        const URI = `mongodb://${dbUsername}:${dbPassword}@localhost:27017/${dbName}?authSource=admin`;
        const connectionInstance = await mongoose.connect(URI);
        const mongoConHost = connectionInstance.connection.host;
        const mongoConPort = connectionInstance.connection.host;
        console.log(`mongoDB connected :: ${mongoConHost}:${mongoConPort}`);
    } catch (error) {
        throw new Error(error.message || "Failed to conneect with DB.");
    }
}