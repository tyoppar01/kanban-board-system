import dotenv from "dotenv";
import mongoose from 'mongoose';
import path from 'path';

dotenv.config();

export const conenctMongoose = async () => {

    try {
        console.log("Starting to connect to MongoDB")
        await mongoose.connect(process.env.MONGO_URI!, 
            { 
                family: 4,
                serverSelectionTimeoutMS: 10000 
            });
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err);
        // terminate server
        process.exit(1); 
    }
}
