import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { IUser } from '../../src/models/user';
import { AuthRepo } from '../../src/repos/authRepo';
import { TokenRepo } from '../../src/repos/tokenRepo';
import { AuthService } from '../../src/services/authService';

// Mock dependencies
jest.mock('../../src/repos/authRepo');
jest.mock('../../src/repos/tokenRepo');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService (Unit Tests)', () => {
  let authService: AuthService;
  let mockAuthRepo: jest.Mocked<AuthRepo>;
  let mockTokenRepo: jest.Mocked<TokenRepo>;

  beforeEach(() => {
    // Reset singleton instance
    (AuthService as any).instance = null;

    // Setup mocks
    mockAuthRepo = {
      findByUsername: jest.fn(),
      findById: jest.fn(),
      createUser: jest.fn(),
      authenticateUser: jest.fn(),
      getInstance: jest.fn(),
    } as any;

    mockTokenRepo = {
      storeToken: jest.fn(),
      isTokenValid: jest.fn(),
      revokeToken: jest.fn(),
      revokeAllUserTokens: jest.fn(),
      deleteExpiredTokens: jest.fn(),
      getInstance: jest.fn(),
    } as any;

    (AuthRepo.getInstance as jest.Mock).mockReturnValue(mockAuthRepo);
    (TokenRepo.getInstance as jest.Mock).mockReturnValue(mockTokenRepo);

    // Set environment variables
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRATION = '7d';

    authService = AuthService.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should achieve singleton instance of authService', () => {
    const a = AuthService.getInstance();
    const b = AuthService.getInstance();
    expect(a).toBe(b);
  });

  describe('authenticateUser', () => {
    const mockUser: IUser = {
      id: 1,
      username: 'testuser',
      password: 'hashedPassword123',
    };

    const userInput: IUser = {
      username: 'testuser',
      password: 'plainPassword123',
    };

    it('should authenticate user successfully and return token', async () => {
      mockAuthRepo.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token-123');
      mockTokenRepo.storeToken.mockResolvedValue(true);

      const token = await authService.authenticateUser(userInput);

      expect(token).toBe('jwt-token-123');
      expect(mockAuthRepo.findByUsername).toHaveBeenCalledWith('testuser');
      expect(bcrypt.compare).toHaveBeenCalledWith('plainPassword123', 'hashedPassword123');
      expect(mockTokenRepo.storeToken).toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      mockAuthRepo.findByUsername.mockResolvedValue(null as any);

      await expect(authService.authenticateUser(userInput))
        .rejects.toThrow('User not found');
    });

    it('should throw error when password is missing', async () => {
      mockAuthRepo.findByUsername.mockResolvedValue(mockUser);

      await expect(authService.authenticateUser({ username: 'testuser' }))
        .rejects.toThrow('Password is not valid');
    });

    it('should throw error when user password is missing', async () => {
      mockAuthRepo.findByUsername.mockResolvedValue({ ...mockUser, password: undefined });

      await expect(authService.authenticateUser(userInput))
        .rejects.toThrow('Password is not valid');
    });

    it('should throw error when password does not match', async () => {
      mockAuthRepo.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.authenticateUser(userInput))
        .rejects.toThrow('username or password does not match');
    });

    it('should throw error when token generation fails', async () => {
      mockAuthRepo.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockImplementation(() => {
        throw new Error('JWT error');
      });

      await expect(authService.authenticateUser(userInput))
        .rejects.toThrow('Error generating token');
    });
  });

  describe('registerUser', () => {
    const newUser: IUser = {
      username: 'newuser',
      password: 'plainPassword123',
    };

    it('should register new user successfully', async () => {
      mockAuthRepo.findByUsername.mockResolvedValue({ username: '' } as any); // User doesn't exist
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      mockAuthRepo.createUser.mockResolvedValue({
        id: 1,
        username: 'newuser',
      });

      const result = await authService.registerUser(newUser);

      expect(result).toBeDefined();
      expect(result.username).toBe('newuser');
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(mockAuthRepo.createUser).toHaveBeenCalled();
    });

    it('should throw error when username already exists', async () => {
      mockAuthRepo.findByUsername.mockResolvedValue({
        username: 'newuser',
        id: 1,
      });

      await expect(authService.registerUser(newUser))
        .rejects.toThrow('Username already taken');
    });

    it('should throw error when password is not provided', async () => {
      mockAuthRepo.findByUsername.mockResolvedValue({ username: '' } as any);

      await expect(authService.registerUser({ username: 'newuser' }))
        .rejects.toThrow('Password is not provided for registration');
    });

    it('should throw error when user creation fails', async () => {
      mockAuthRepo.findByUsername.mockResolvedValue({ username: '' } as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      mockAuthRepo.createUser.mockResolvedValue(null as any);

      await expect(authService.registerUser(newUser))
        .rejects.toThrow('User registration failed');
    });

    it('should throw error when password hashing fails', async () => {
      mockAuthRepo.findByUsername.mockResolvedValue({ username: '' } as any);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing error'));

      await expect(authService.registerUser(newUser))
        .rejects.toThrow('Error hashing password');
    });
  });

  describe('validateToken', () => {
    const mockPayload = {
      userId: 1,
      username: 'testuser',
    };

    it('should validate token successfully', async () => {
      mockTokenRepo.isTokenValid.mockResolvedValue(true);
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = await authService.validateToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(mockTokenRepo.isTokenValid).toHaveBeenCalledWith('valid-token');
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
    });

    it('should return null when token is not valid in database', async () => {
      mockTokenRepo.isTokenValid.mockResolvedValue(false);

      const result = await authService.validateToken('invalid-token');

      expect(result).toBeNull();
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it('should return null when JWT verification fails', async () => {
      mockTokenRepo.isTokenValid.mockResolvedValue(true);
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await authService.validateToken('invalid-jwt');

      expect(result).toBeNull();
    });

    it('should return null when token validation throws error', async () => {
      mockTokenRepo.isTokenValid.mockRejectedValue(new Error('DB error'));

      const result = await authService.validateToken('token');

      expect(result).toBeNull();
    });
  });

  describe('revokeToken', () => {
    it('should revoke token successfully', async () => {
      mockTokenRepo.revokeToken.mockResolvedValue(true);

      const result = await authService.revokeToken('token-to-revoke');

      expect(result).toBe(true);
      expect(mockTokenRepo.revokeToken).toHaveBeenCalledWith('token-to-revoke');
    });

    it('should throw error when revocation fails', async () => {
      mockTokenRepo.revokeToken.mockRejectedValue(new Error('DB error'));

      await expect(authService.revokeToken('token'))
        .rejects.toThrow('Error revoking token');
    });
  });

  describe('parseExpirationToMs', () => {
    it('should parse seconds correctly', () => {
      const service = authService as any;
      expect(service.parseExpirationToMs('30s')).toBe(30 * 1000);
    });

    it('should parse minutes correctly', () => {
      const service = authService as any;
      expect(service.parseExpirationToMs('15m')).toBe(15 * 60 * 1000);
    });

    it('should parse hours correctly', () => {
      const service = authService as any;
      expect(service.parseExpirationToMs('2h')).toBe(2 * 60 * 60 * 1000);
    });

    it('should parse days correctly', () => {
      const service = authService as any;
      expect(service.parseExpirationToMs('7d')).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should return default (7 days) for invalid unit', () => {
      const service = authService as any;
      expect(service.parseExpirationToMs('invalid')).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });
});
