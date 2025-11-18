import dotenv from "dotenv";
import path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { initBoardTable, testConnection } from "./dynamodb/client";

// ==================== DynamoDB Startup ================== //

export async function startDynamoDB(): Promise<void> {

  try {

    console.log("🚀 Starting DynamoDB Client...");
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("DynamoDB connection timeout after 30 seconds"));
      }, 30000);
    });
    
    const isConnected = await Promise.race([testConnection(), timeoutPromise]);
    
    if (!isConnected) {
      throw new Error("Failed to connect to DynamoDB");
    }
    
    await initBoardTable();
    console.log("✅ DynamoDB Client started successfully!");

  } catch (error) {
    console.error("❌ DynamoDB Client startup failed:", error);
    throw error;
  }
}

startDynamoDB();