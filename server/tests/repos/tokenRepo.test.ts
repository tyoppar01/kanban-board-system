import { TokenRepo } from '../../src/repos/tokenRepo';

// Mock the external-apis TokenRepository
jest.mock('external-apis', () => ({
  TokenRepository: {
    getInstance: jest.fn(() => mockTokenRepositoryInstance),
  },
}));

const mockTokenRepositoryInstance = {
  storeToken: jest.fn(),
  isTokenValid: jest.fn(),
  revokeToken: jest.fn(),
  revokeAllUserTokens: jest.fn(),
  deleteExpiredTokens: jest.fn(),
};

describe('TokenRepo (Unit Tests)', () => {
  let tokenRepo: TokenRepo;

  beforeEach(() => {
    // Reset singleton instance
    (TokenRepo as any).instance = null;
    tokenRepo = TokenRepo.getInstance();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  it('should achieve singleton instance of tokenRepo', () => {
    const a = TokenRepo.getInstance();
    const b = TokenRepo.getInstance();
    expect(a).toBe(b);
  });

  describe('storeToken', () => {
    it('should store a token successfully', async () => {
      const token = 'test-jwt-token';
      const userId = 1;
      const expiresAt = new Date();

      mockTokenRepositoryInstance.storeToken.mockResolvedValue({
        id: 1,
        token,
        userId,
        expiresAt,
        isRevoked: false,
        createdAt: new Date()
      });

      const result = await tokenRepo.storeToken(token, userId, expiresAt);

      expect(result).toBe(true);
      expect(mockTokenRepositoryInstance.storeToken).toHaveBeenCalledWith(token, userId, expiresAt);
    });

    it('should throw error when storing token fails', async () => {
      mockTokenRepositoryInstance.storeToken.mockRejectedValue(new Error('Database error'));

      await expect(tokenRepo.storeToken('token', 1, new Date()))
        .rejects.toThrow('Failed to store token');
    });
  });

  describe('isTokenValid', () => {
    it('should return true for valid token', async () => {
      mockTokenRepositoryInstance.isTokenValid.mockResolvedValue(true);

      const result = await tokenRepo.isTokenValid('valid-token');

      expect(result).toBe(true);
      expect(mockTokenRepositoryInstance.isTokenValid).toHaveBeenCalledWith('valid-token');
    });

    it('should return false for invalid token', async () => {
      mockTokenRepositoryInstance.isTokenValid.mockResolvedValue(false);

      const result = await tokenRepo.isTokenValid('invalid-token');

      expect(result).toBe(false);
    });

    it('should return false when validation throws error', async () => {
      mockTokenRepositoryInstance.isTokenValid.mockRejectedValue(new Error('DB error'));

      const result = await tokenRepo.isTokenValid('token');

      expect(result).toBe(false);
    });
  });

  describe('revokeToken', () => {
    it('should revoke token successfully', async () => {
      mockTokenRepositoryInstance.revokeToken.mockResolvedValue(true);

      const result = await tokenRepo.revokeToken('token-to-revoke');

      expect(result).toBe(true);
      expect(mockTokenRepositoryInstance.revokeToken).toHaveBeenCalledWith('token-to-revoke');
    });

    it('should throw error when revoking fails', async () => {
      mockTokenRepositoryInstance.revokeToken.mockRejectedValue(new Error('DB error'));

      await expect(tokenRepo.revokeToken('token'))
        .rejects.toThrow('Failed to revoke token');
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all tokens for a user', async () => {
      mockTokenRepositoryInstance.revokeAllUserTokens.mockResolvedValue(3);

      const result = await tokenRepo.revokeAllUserTokens(1);

      expect(result).toBe(3);
      expect(mockTokenRepositoryInstance.revokeAllUserTokens).toHaveBeenCalledWith(1);
    });

    it('should return 0 when user has no tokens', async () => {
      mockTokenRepositoryInstance.revokeAllUserTokens.mockResolvedValue(0);

      const result = await tokenRepo.revokeAllUserTokens(999);

      expect(result).toBe(0);
    });

    it('should throw error when revocation fails', async () => {
      mockTokenRepositoryInstance.revokeAllUserTokens.mockRejectedValue(new Error('DB error'));

      await expect(tokenRepo.revokeAllUserTokens(1))
        .rejects.toThrow('Failed to revoke all user tokens');
    });
  });

  describe('deleteExpiredTokens', () => {
    it('should delete expired tokens successfully', async () => {
      mockTokenRepositoryInstance.deleteExpiredTokens.mockResolvedValue(5);

      const result = await tokenRepo.deleteExpiredTokens();

      expect(result).toBe(5);
      expect(mockTokenRepositoryInstance.deleteExpiredTokens).toHaveBeenCalled();
    });

    it('should return 0 when no expired tokens exist', async () => {
      mockTokenRepositoryInstance.deleteExpiredTokens.mockResolvedValue(0);

      const result = await tokenRepo.deleteExpiredTokens();

      expect(result).toBe(0);
    });

    it('should throw error when deletion fails', async () => {
      mockTokenRepositoryInstance.deleteExpiredTokens.mockRejectedValue(new Error('DB error'));

      await expect(tokenRepo.deleteExpiredTokens())
        .rejects.toThrow('Failed to delete expired tokens');
    });
  });
});
