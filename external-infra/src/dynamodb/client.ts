import dotenv from "dotenv";
import path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { CreateTableCommand, DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { logProcess, MethodName } from "../utils/loggerResponse";

/**
 * Get DynamoDB Local Configurations
 * @returns DynamoDB client configuration
 */
const getDynamoConfig = () => {

      const isLocal = process.env.NODE_ENV === 'development' || process.env.DYNAMO_LOCAL === 'true';
  
      if (isLocal) {
            return {
                  region: process.env.DYNAMO_REGION || 'localhost',
                  endpoint: process.env.DYNAMO_ENDPOINT || 'http://localhost:8000',
                  credentials: { 
                        accessKeyId: process.env.DYNAMO_ACCESS_KEY_ID || 'dummykey', 
                        secretAccessKey: process.env.DYNAMO_SECRET_ACCESS_KEY || 'dummysecret' 
                  }
            };
      }
      throw new Error("⚠️  Cloud Access Restricted (DEV Only)");

};

/**
 * Get Table Names (Prefix + name + Suffix)
 * @returns Object with table names
 */
const getTableNames = () => {
  // Clean the prefix by removing quotes if they exist
  let prefix = process.env.DYNAMO_TABLE_PREFIX || '';
  prefix = prefix.replace(/^["']|["']$/g, ''); // Remove leading/trailing quotes
  
  const suffix = process.env.NODE_ENV === 'development' ? '' : '_prod';
  
  const tableNames = {
    BOARDS: `${prefix}board${suffix}`,
    TASKS: `${prefix}task${suffix}`,
    COLUMNS: `${prefix}column${suffix}`
  };
  
  // Debug logging to see what table names are being generated
  console.log('🔍 Generated table names:', tableNames);
  console.log('🔍 Raw prefix from env:', process.env.DYNAMO_TABLE_PREFIX);
  console.log('🔍 Cleaned prefix:', prefix);
  
  return tableNames;
};

export { DynamoBoardRepo } from "../dynamodb/dynamodb_board";
export { DynamoTaskRepo } from "../dynamodb/dynamodb_task";

export const client = new DynamoDBClient(getDynamoConfig());
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true, // Remove undefined values from objects
    convertEmptyValues: false,
    convertClassInstanceToMap: false
  }
});
export const TABLES = getTableNames();

/**
 * Test DynamoDB connection
 */
export const testConnection = async (): Promise<boolean> => {

  try {
    logProcess(MethodName.TEST, `🔍 Testing DynamoDB connection at Endpoint: ${getDynamoConfig().endpoint}`);
    await client.send(new ListTablesCommand({}));
    logProcess(MethodName.TEST, "✅ DynamoDB connection successful");
    return true;
    
  } catch (error: any) {
    logProcess(MethodName.TEST, `❌ DynamoDB connection failed: ${error.message}`);
    return false;
  }
};

/**
 * Database Initialization (Kanban Boards)
 * @returns 
 */
export const initBoardTable = async () => {
  try {
    console.log(`🔍 Attempting to create table: ${TABLES.BOARDS}`);
    
    const command = new CreateTableCommand({
      TableName: TABLES.BOARDS,
      AttributeDefinitions: [
        {
          AttributeName: "id",
          AttributeType: "N",
        },
      ],
      KeySchema: [
        {
          AttributeName: "id",
          KeyType: "HASH",
        },
      ],
      BillingMode: "PAY_PER_REQUEST",
    });

    const response = await client.send(command);
    logProcess(MethodName.INIT_TABLE, `✅ Table '${TABLES.BOARDS}' initialized successfully`);
    return response;
    
  } catch (error: any) {
    // Check if table already exists
    if (error.name === 'ResourceInUseException' || error.message.includes('preexisting table')) {
      logProcess(MethodName.INIT_TABLE, `✅ Table '${TABLES.BOARDS}' already exists - continuing`);
      console.log(`🔍 Table ${TABLES.BOARDS} already exists, skipping creation`);
      return null; // Table already exists, this is fine
    }
    
    logProcess(MethodName.INIT_TABLE, `❌ Table creation failed: ${error.message}`);
    console.error('🔍 Table creation error details:', {
      tableName: TABLES.BOARDS,
      error: error.message,
      tableNames: TABLES
    });
    throw error;
  }
};