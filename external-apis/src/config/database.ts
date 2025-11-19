import { PrismaClient } from '@prisma/client';

// Singleton Prisma Client instance
class DatabaseClient {
  private static instance: PrismaClient | null = null;
  private static connecting = false;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!DatabaseClient.instance) {
      console.log('🔗 Initializing Prisma Client with DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
      
      DatabaseClient.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
      });

      // Don't auto-connect here, let the first query trigger connection
    }

    return DatabaseClient.instance;
  }

  public static async connect(): Promise<void> {
    if (DatabaseClient.connecting) return;
    
    DatabaseClient.connecting = true;
    const client = DatabaseClient.getInstance();
    
    try {
      await client.$connect();
      console.log('✅ Connected to PostgreSQL via Prisma');
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error);
      throw error;
    } finally {
      DatabaseClient.connecting = false;
    }
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseClient.instance) {
      await DatabaseClient.instance.$disconnect();
      console.log('🔌 Disconnected from PostgreSQL');
      DatabaseClient.instance = null;
    }
  }
}

// Export lazy getter for prisma instance
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const instance = DatabaseClient.getInstance();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

// Export connection functions
export const connectDatabase = DatabaseClient.connect;
export const disconnectDatabase = DatabaseClient.disconnect;
