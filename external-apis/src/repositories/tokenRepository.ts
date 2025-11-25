import { prisma } from '../config/database';
import { Token } from '@prisma/client';

export class TokenRepository {

  private static instance: TokenRepository;

  private constructor() {}

  static getInstance(): TokenRepository {
    if (!TokenRepository.instance) {
      TokenRepository.instance = new TokenRepository();
    }
    return TokenRepository.instance;
  }

  /**
   * Store a new token
   * @param token - JWT token string
   * @param userId - User's ID
   * @param expiresAt - Token expiration date
   * @returns Created Token object
   */
  async storeToken(token: string, userId: number, expiresAt: Date): Promise<Token> {
    try {
      const tokenRecord = await prisma.token.create({
        data: {
          token,
          userId,
          expiresAt
        }
      });

      return tokenRecord;
    } catch (error) {
      console.error('Failed to store token:', error);
      throw new Error('Failed to store token');
    }
  }

  /**
   * Find token by token string
   * @param token - JWT token string
   * @returns Token object or null
   */
  async findByToken(token: string): Promise<Token | null> {
    try {
      const tokenRecord = await prisma.token.findUnique({
        where: { token }
      });

      return tokenRecord;
    } catch (error) {
      console.error('Failed to find token:', error);
      throw new Error('Failed to find token');
    }
  }

  /**
   * Validate if token is valid (not expired and not revoked)
   * @param token - JWT token string
   * @returns true if valid, false otherwise
   */
  async isTokenValid(token: string): Promise<boolean> {
    try {
      const tokenRecord = await this.findByToken(token);

      if (!tokenRecord) {
        return false;
      }

      // Check if token is revoked
      if (tokenRecord.isRevoked) {
        return false;
      }

      // Check if token is expired
      if (tokenRecord.expiresAt < new Date()) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to validate token:', error);
      return false;
    }
  }

  /**
   * Revoke a token (logout)
   * @param token - JWT token string
   * @returns true if revoked successfully
   */
  async revokeToken(token: string): Promise<boolean> {
    try {
      await prisma.token.update({
        where: { token },
        data: { isRevoked: true }
      });

      return true;
    } catch (error) {
      console.error('Failed to revoke token:', error);
      throw new Error('Failed to revoke token');
    }
  }

  /**
   * Revoke all tokens for a user
   * @param userId - User's ID
   * @returns Number of tokens revoked
   */
  async revokeAllUserTokens(userId: number): Promise<number> {
    try {
      const result = await prisma.token.updateMany({
        where: { 
          userId,
          isRevoked: false
        },
        data: { isRevoked: true }
      });

      return result.count;
    } catch (error) {
      console.error('Failed to revoke all user tokens:', error);
      throw new Error('Failed to revoke all user tokens');
    }
  }

  /**
   * Delete expired tokens (cleanup)
   * @returns Number of tokens deleted
   */
  async deleteExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.token.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      return result.count;
    } catch (error) {
      console.error('Failed to delete expired tokens:', error);
      throw new Error('Failed to delete expired tokens');
    }
  }
}
