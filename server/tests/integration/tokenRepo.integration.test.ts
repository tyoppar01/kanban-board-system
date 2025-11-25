import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { prisma } from 'external-apis';
import { TokenRepo } from '../../src/repos/tokenRepo';
import { describeIfDocker, futureDate } from '../helpers/integrationTestUtils';
import { TestDatabaseSetup } from '../helpers/testDatabaseSetup';

describeIfDocker('TokenRepo Integration Tests', () => {
  let postgresContainer: StartedPostgreSqlContainer;
  let tokenRepo: TokenRepo;
  let testUserId: number;

  beforeAll(async () => {
    // Setup database container and run migrations
    postgresContainer = await TestDatabaseSetup.setup();

    // Create a test user for token tests
    const user = await prisma.userProfile.create({
      data: {
        username: 'tokenuser',
        password: 'password123'
      }
    });
    testUserId = user.id;

    // Reset singleton instance
    (TokenRepo as any).instance = null;
    tokenRepo = TokenRepo.getInstance();
  }, 60000);

  afterAll(async () => {
    // Cleanup database and container
    await TestDatabaseSetup.teardown();
  });

  beforeEach(async () => {
    // Clear all token data before each test
    await prisma.token.deleteMany({});
  });

  it('should achieve singleton instance of tokenRepo', () => {
    const a = TokenRepo.getInstance();
    const b = TokenRepo.getInstance();
    expect(a).toBe(b);
  });

  describe('storeToken', () => {
    it('should store a new token successfully', async () => {
      const token = 'test-jwt-token-123';
      const expiresAt = futureDate(7); // 7 days in the future

      const result = await tokenRepo.storeToken(token, testUserId, expiresAt);

      expect(result).toBe(true);

      // Verify token was stored in database
      const storedToken = await prisma.token.findUnique({
        where: { token }
      });
      expect(storedToken).toBeDefined();
      expect(storedToken?.userId).toBe(testUserId);
    });

    it('should throw error when storing duplicate token', async () => {
      const token = 'duplicate-token';
      const expiresAt = futureDate(7);

      await tokenRepo.storeToken(token, testUserId, expiresAt);

      await expect(tokenRepo.storeToken(token, testUserId, expiresAt))
        .rejects.toThrow('Failed to store token');
    });
  });

  describe('isTokenValid', () => {
    it('should return true for valid, non-expired, non-revoked token', async () => {
      const token = 'valid-token-123';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await tokenRepo.storeToken(token, testUserId, expiresAt);

      const isValid = await tokenRepo.isTokenValid(token);

      expect(isValid).toBe(true);
    });

    it('should return false for expired token', async () => {
      const token = 'expired-token';
      const expiresAt = new Date(Date.now() - 1000); // Expired 1 second ago

      await tokenRepo.storeToken(token, testUserId, expiresAt);

      const isValid = await tokenRepo.isTokenValid(token);

      expect(isValid).toBe(false);
    });

    it('should return false for revoked token', async () => {
      const token = 'revoked-token';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await tokenRepo.storeToken(token, testUserId, expiresAt);
      await tokenRepo.revokeToken(token);

      const isValid = await tokenRepo.isTokenValid(token);

      expect(isValid).toBe(false);
    });

    it('should return false for non-existent token', async () => {
      const isValid = await tokenRepo.isTokenValid('non-existent-token');

      expect(isValid).toBe(false);
    });
  });

  describe('revokeToken', () => {
    it('should revoke a token successfully', async () => {
      const token = 'token-to-revoke';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await tokenRepo.storeToken(token, testUserId, expiresAt);

      const result = await tokenRepo.revokeToken(token);

      expect(result).toBe(true);

      // Verify token is revoked
      const revokedToken = await prisma.token.findUnique({
        where: { token }
      });
      expect(revokedToken?.isRevoked).toBe(true);
    });

    it('should throw error when revoking non-existent token', async () => {
      await expect(tokenRepo.revokeToken('non-existent-token'))
        .rejects.toThrow('Failed to revoke token');
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all tokens for a user', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Create multiple tokens for the user
      await tokenRepo.storeToken('token1', testUserId, expiresAt);
      await tokenRepo.storeToken('token2', testUserId, expiresAt);
      await tokenRepo.storeToken('token3', testUserId, expiresAt);

      const revokedCount = await tokenRepo.revokeAllUserTokens(testUserId);

      expect(revokedCount).toBe(3);

      // Verify all tokens are revoked
      const tokens = await prisma.token.findMany({
        where: { userId: testUserId }
      });
      tokens.forEach((token: any) => {
        expect(token.isRevoked).toBe(true);
      });
    });

    it('should return 0 when user has no active tokens', async () => {
      const revokedCount = await tokenRepo.revokeAllUserTokens(99999);

      expect(revokedCount).toBe(0);
    });
  });

  describe('deleteExpiredTokens', () => {
    it('should delete all expired tokens', async () => {
      const expiredDate = new Date(Date.now() - 1000);
      const validDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Create expired and valid tokens
      await tokenRepo.storeToken('expired1', testUserId, expiredDate);
      await tokenRepo.storeToken('expired2', testUserId, expiredDate);
      await tokenRepo.storeToken('valid1', testUserId, validDate);

      const deletedCount = await tokenRepo.deleteExpiredTokens();

      expect(deletedCount).toBe(2);

      // Verify only valid token remains
      const remainingTokens = await prisma.token.findMany({});
      expect(remainingTokens.length).toBe(1);
      expect(remainingTokens[0]?.token).toBe('valid1');
    });

    it('should return 0 when no expired tokens exist', async () => {
      const validDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await tokenRepo.storeToken('valid1', testUserId, validDate);

      const deletedCount = await tokenRepo.deleteExpiredTokens();

      expect(deletedCount).toBe(0);
    });
  });
});
