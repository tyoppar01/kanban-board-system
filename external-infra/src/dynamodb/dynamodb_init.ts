import { CreateTableCommand, DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { logProcess, MethodName } from "../utils/loggerResponse";

/**
 * Get DynamoDB Local Configurations
 * @returns DynamoDB client configuration
 */
const getDynamoConfig = () => {
  const isLocal = process.env.NODE_ENV === 'development' || process.env.DYNAMO_LOCAL === 'true';
  
  if (isLocal) {
    console.log('🔧 Using DynamoDB Local');
    return {
      region: 'localhost',
      endpoint: process.env.DYNAMO_ENDPOINT || 'http://localhost:8000',
      credentials: { accessKeyId: 'nokeytho', secretAccessKey: 'noaccesskeytho' }
    };
  } else {
    throw new Error("⚠️  Cloud Access Restricted (DEV Only)");
  }
};

/**
 * Get Table Names (Prefix + name + Suffix)
 * @returns Object with table names
 */
const getTableNames = () => {
  const prefix = process.env.DYNAMO_TABLE_PREFIX || '';
  const suffix = process.env.NODE_ENV === 'development' ? '' : '_prod';
  
  return {
    BOARDS: `${prefix}board${suffix}`,
    TASKS: `${prefix}task${suffix}`,
    COLUMNS: `${prefix}column${suffix}`
  };
};

/**
 * Database Initialization (Kanban Boards)
 * @returns 
 */
export const initBoardTable = async () => {

  const command = new CreateTableCommand({
    TableName: "KanbanBoards",
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
  logProcess(MethodName.INIT_TABLE, "Table initialized successfully");
  return response;
};

/**
 * Test DynamoDB connection
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    logProcess(MethodName.TEST, "🔍 Testing DynamoDB connection...");
    
    await docClient.send(new ScanCommand({ TableName: TABLES.BOARDS, Limit: 1 }));
    
    logProcess(MethodName.TEST, "✅ DynamoDB connection successful");
    return true;
  } catch (error) {
    logProcess(MethodName.TEST, "✅ DynamoDB connection failed");
    return false;
  }
};

// Create DynamoDB Client with environment-based config
export const client = new DynamoDBClient(getDynamoConfig());
export const docClient = DynamoDBDocumentClient.from(client);
export const TABLES = getTableNames();