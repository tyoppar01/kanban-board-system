import { PrismaClient } from '@prisma/client';

// Singleton Prisma Client instance
class DatabaseClient {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
      });

      // Handle connection errors
      DatabaseClient.instance.$connect()
        .then(() => {
          console.log('✅ Connected to PostgreSQL via Prisma');
        })
        .catch((error) => {
          console.error('❌ PostgreSQL connection failed:', error);
          process.exit(1);
        });
    }

    return DatabaseClient.instance;
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseClient.instance) {
      await DatabaseClient.instance.$disconnect();
      console.log('🔌 Disconnected from PostgreSQL');
    }
  }
}

// Export singleton instance
export const prisma = DatabaseClient.getInstance();

// Export disconnect function for graceful shutdown
export const disconnectDatabase = DatabaseClient.disconnect;
