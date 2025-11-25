import { AuthRepo } from '../../src/repos/authRepo';

// Mock the external-apis AuthRepository
jest.mock('external-apis', () => ({
  AuthRepository: {
    getInstance: jest.fn(() => mockAuthRepositoryInstance),
  },
}));

const mockAuthRepositoryInstance = {
  findByUsername: jest.fn(),
  findById: jest.fn(),
  createUser: jest.fn(),
  updateLastLogin: jest.fn(),
  deleteUser: jest.fn(),
};

describe('AuthRepo (Unit Tests)', () => {
  let authRepo: AuthRepo;

  beforeEach(() => {
    // Reset singleton instance
    (AuthRepo as any).instance = null;
    authRepo = AuthRepo.getInstance();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  it('should achieve singleton instance of authRepo', () => {
    const a = AuthRepo.getInstance();
    const b = AuthRepo.getInstance();
    expect(a).toBe(b);
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null
      };

      mockAuthRepositoryInstance.createUser.mockResolvedValue(mockUser);

      const result = await authRepo.createUser({
        username: 'testuser',
        password: 'hashedpassword123'
      });

      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
      expect(mockAuthRepositoryInstance.createUser).toHaveBeenCalledWith('testuser', 'hashedpassword123');
    });

    it('should throw error when createUser fails', async () => {
      mockAuthRepositoryInstance.createUser.mockRejectedValue(new Error('Database error'));

      await expect(authRepo.createUser({
        username: 'testuser',
        password: 'password'
      })).rejects.toThrow('Create User Failed');
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const mockUser = {
        id: 1,
        username: 'findme',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null
      };

      mockAuthRepositoryInstance.findByUsername.mockResolvedValue(mockUser);

      const result = await authRepo.findByUsername('findme');

      expect(result).toBeDefined();
      expect(result?.username).toBe('findme');
      expect(mockAuthRepositoryInstance.findByUsername).toHaveBeenCalledWith('findme');
    });

    it('should throw error when repository throws', async () => {
      mockAuthRepositoryInstance.findByUsername.mockRejectedValue(new Error('Database error'));

      await expect(authRepo.findByUsername('nonexistent'))
        .rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      const mockUser = {
        id: 1,
        username: 'findbyid',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null
      };

      mockAuthRepositoryInstance.findById.mockResolvedValue(mockUser);

      const result = await authRepo.findById(1);

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.username).toBe('findbyid');
      expect(result?.password).toBeUndefined(); // Password should be excluded
      expect(mockAuthRepositoryInstance.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when user ID not found', async () => {
      mockAuthRepositoryInstance.findById.mockResolvedValue(null);

      const result = await authRepo.findById(99999);
      
      expect(result).toBeNull();
    });
  });

  describe('authenticateUser', () => {
    it('should return user when authentication succeeds', async () => {
      const mockUser = {
        id: 1,
        username: 'authtest',
        password: 'correctpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null
      };

      mockAuthRepositoryInstance.findByUsername.mockResolvedValue(mockUser);

      const result = await authRepo.authenticateUser('authtest', 'correctpassword');

      expect(result).toBeDefined();
      expect(result?.username).toBe('authtest');
      expect(mockAuthRepositoryInstance.findByUsername).toHaveBeenCalledWith('authtest');
    });

    it('should throw error when user not found', async () => {
      mockAuthRepositoryInstance.findByUsername.mockRejectedValue(new Error('User not found'));

      await expect(authRepo.authenticateUser('nonexistent', 'password'))
        .rejects.toThrow('Authentication failed');
    });
  });
});
