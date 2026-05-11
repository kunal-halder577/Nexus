import mongoose from "mongoose";
import { dbName, dbPassword, dbUsername, mongoUri, nodeEnv } from "../constants.js";

export const connectDB = async () => {
    try {
        let URI;

        if (nodeEnv === 'development') {
            // Safely encode credentials to prevent URI parsing errors with special characters
            const encodedUser = encodeURIComponent(dbUsername);
            const encodedPass = encodeURIComponent(dbPassword);
            
            // Note: Ensure 'mongodb' is the correct host (e.g., in Docker). 
            // If running locally outside Docker, change 'mongodb' to '127.0.0.1'.
            URI = `mongodb://${encodedUser}:${encodedPass}@mongodb:27017/${dbName}?authSource=admin`;
        } else {
            URI = mongoUri;
        }

        const connectionInstance = await mongoose.connect(URI);
        
        const mongoConHost = connectionInstance.connection.host;
        const mongoConPort = connectionInstance.connection.port;
        
        console.log(`\nMongoDB connected :: ${mongoConHost}:${mongoConPort}`);
    } catch (error) {
        console.error("MongoDB Connection FAILED: ", error.message);
        throw new Error(error.message || "Failed to connect with DB.");
    }
};