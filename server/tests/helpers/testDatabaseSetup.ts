import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { connectDatabase, disconnectDatabase } from 'external-apis';
import { execSync } from 'child_process';
import * as path from 'path';

export class TestDatabaseSetup {
  private static container: StartedPostgreSqlContainer | null = null;
  private static originalDatabaseUrl: string | undefined;

  /**
   * Start PostgreSQL testcontainer and run migrations
   */
  static async setup(): Promise<StartedPostgreSqlContainer> {
    // Save original DATABASE_URL
    this.originalDatabaseUrl = process.env.DATABASE_URL;

    // Start PostgreSQL container
    this.container = await new PostgreSqlContainer('postgres:16-alpine')
      .withExposedPorts(5432)
      .start();

    // Set DATABASE_URL for Prisma
    const connectionString = this.container.getConnectionUri();
    process.env.DATABASE_URL = connectionString;

    // Run Prisma migrations to set up the schema
    const prismaDir = path.join(__dirname, '../../../external-apis');
    try {
      // Use db push instead of migrate deploy for test environment
      // This doesn't require migration files and just syncs the schema
      execSync('npx prisma db push --skip-generate', {
        cwd: prismaDir,
        env: { ...process.env, DATABASE_URL: connectionString },
        stdio: 'inherit',
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash'
      });
    } catch (error) {
      console.error('Failed to run Prisma migrations:', error);
      throw error;
    }

    // Connect to database
    await connectDatabase();

    return this.container;
  }

  /**
   * Cleanup: disconnect from database and stop container
   */
  static async teardown(): Promise<void> {
    try {
      await disconnectDatabase();
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }

    if (this.container) {
      try {
        await this.container.stop();
      } catch (error) {
        console.error('Error stopping container:', error);
      }
    }

    // Restore original DATABASE_URL
    if (this.originalDatabaseUrl) {
      process.env.DATABASE_URL = this.originalDatabaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  }
}
