import { prisma } from '../config/database';
import { UserProfile } from '@prisma/client';

export class AuthRepository {

  private static instance: AuthRepository;

  private constructor() {}

  static getInstance(): AuthRepository {
    if (!AuthRepository.instance) {
      AuthRepository.instance = new AuthRepository();
    }
    return AuthRepository.instance;
  }

  /**
   * Find user by username
   * @param username - User's username
   * @returns UserProfile object or null
   */
  async findByUsername(username: string): Promise<UserProfile | null> {
    try {
      const user = await prisma.userProfile.findUnique({
        where: { username }
      });

      return user;
    } catch (error) {
      throw new Error('Failed to find user by username');
    }
  }

  /**
   * Find user by ID
   * @param id - User's ID
   * @returns UserProfile object or null
   */
  async findById(id: number): Promise<UserProfile | null> {
    try {
      const user = await prisma.userProfile.findUnique({
        where: { id }
      });

      return user;
    } catch (error) {
      throw new Error('Failed to find user by id');
    }
  }

  /**
   * Create a new user
   * @param username - User's username
   * @param password - User's password (should be hashed)
   * @returns Created UserProfile object
   */
  async createUser(username: string, password: string): Promise<UserProfile> {
    try {
      const user = await prisma.userProfile.create({
        data: {
          username,
          password
        }
      });

      return user;
    } catch (error) {
      throw new Error('Failed to create user');
    }
  }

  /**
   * Update last login timestamp
   * @param id - User's ID
   * @returns Updated UserProfile object
   */
  async updateLastLogin(id: number): Promise<UserProfile> {
    try {
      const user = await prisma.userProfile.update({
        where: { id },
        data: {
          lastLogin: new Date()
        }
      });

      return user;
    } catch (error) {
      throw new Error('Failed to update last login');
    }
  }

  /**
   * Delete user by ID
   * @param id - User's ID
   * @returns true if deleted successfully
   */
  async deleteUser(id: number): Promise<boolean> {
    try {
      await prisma.userProfile.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      throw new Error('Failed to delete user');
    }
  }
  
}
