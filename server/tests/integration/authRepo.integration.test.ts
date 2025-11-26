import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { prisma } from 'external-apis';
import { AuthRepo } from '../../src/repos/authRepo';
import { describeIfDocker } from '../helpers/integrationTestUtils';
import { TestDatabaseSetup } from '../helpers/testDatabaseSetup';

describeIfDocker('AuthRepo Integration Tests', () => {
  let authRepo: AuthRepo;
  let postgresContainer: StartedPostgreSqlContainer;

  beforeAll(async () => {
    // Setup database container and run migrations
    postgresContainer = await TestDatabaseSetup.setup();

    // Reset singleton instance
    (AuthRepo as any).instance = null;
    authRepo = AuthRepo.getInstance();
  }, 60000);

  afterAll(async () => {
    // Cleanup database and container
    await TestDatabaseSetup.teardown();
  });

  beforeEach(async () => {
    // Clear all user data before each test
    await prisma.userProfile.deleteMany({});
  });

  it('should achieve singleton instance of authRepo', () => {
    const a = AuthRepo.getInstance();
    const b = AuthRepo.getInstance();
    expect(a).toBe(b);
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userProfile = {
        username: 'testuser',
        password: 'hashedpassword123'
      };

      const result = await authRepo.createUser(userProfile);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.username).toBe('testuser');
      expect(result.password).toBeDefined(); // Password is returned
    });

    it('should throw error when creating user with duplicate username', async () => {
      const userProfile = {
        username: 'duplicate',
        password: 'password123'
      };

      await authRepo.createUser(userProfile);

      await expect(authRepo.createUser(userProfile))
        .rejects.toThrow('Create User Failed');
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      // Create a test user
      await authRepo.createUser({
        username: 'findme',
        password: 'password123'
      });

      const result = await authRepo.findByUsername('findme');

      expect(result).toBeDefined();
      expect(result?.username).toBe('findme');
    });

    it('should return empty object when user not found', async () => {
      const result = await authRepo.findByUsername('nonexistent');
      
      expect(result).toBeDefined();
      expect(result).toEqual({});
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      const created = await authRepo.createUser({
        username: 'findbyid',
        password: 'password123'
      });

      const result = await authRepo.findById(created.id!);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.username).toBe('findbyid');
      expect(result?.password).toBeUndefined(); // Password should be excluded
    });

    it('should return null when user ID not found', async () => {
      const result = await authRepo.findById(99999);
      expect(result).toBeNull();
    });
  });

  describe('authenticateUser', () => {
    it('should return user when authentication succeeds', async () => {
      await authRepo.createUser({
        username: 'authtest',
        password: 'correctpassword'
      });

      const result = await authRepo.authenticateUser('authtest', 'correctpassword');

      expect(result).toBeDefined();
      expect(result?.username).toBe('authtest');
    });

    it('should return null when user not found', async () => {
      const result = await authRepo.authenticateUser('nonexistent', 'password');
      
      expect(result).toBeNull();
    });
  });
});
