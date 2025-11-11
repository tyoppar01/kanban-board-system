import mongoose from 'mongoose';
import dotenv from "dotenv";
dotenv.config();

export const conenctMongoose = async () => {

    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err);
        // terminate server
        process.exit(1); 
    }
}
