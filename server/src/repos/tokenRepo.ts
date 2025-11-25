import { TokenRepository } from "external-apis";

/**
 * TokenRepo - Token Repository Adapter
 * Handles token data operations as bridge between service and Prisma repository
 */
export class TokenRepo {

  private static instance: TokenRepo;
  private tokenRepository: TokenRepository;

  constructor() {
    this.tokenRepository = TokenRepository.getInstance();
  }

  static getInstance(): TokenRepo {
    if (!TokenRepo.instance) {
      TokenRepo.instance = new TokenRepo();
    }
    return TokenRepo.instance;
  }

  /**
   * Store a new token
   * @param token - JWT token string
   * @param userId - User's ID
   * @param expiresAt - Token expiration date
   * @returns true if stored successfully
   */
  async storeToken(token: string, userId: number, expiresAt: Date): Promise<boolean> {
    try {
      await this.tokenRepository.storeToken(token, userId, expiresAt);
      return true;
    } catch (error) {
      throw new Error("Failed to store token");
    }
  }

  /**
   * Validate if token is valid (not expired and not revoked)
   * @param token - JWT token string
   * @returns true if valid, false otherwise
   */
  async isTokenValid(token: string): Promise<boolean> {
    try {
      return await this.tokenRepository.isTokenValid(token);
    } catch (error) {
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
      return await this.tokenRepository.revokeToken(token);
    } catch (error) {
      throw new Error("Failed to revoke token");
    }
  }

  /**
   * Revoke all tokens for a user
   * @param userId - User's ID
   * @returns Number of tokens revoked
   */
  async revokeAllUserTokens(userId: number): Promise<number> {
    try {
      return await this.tokenRepository.revokeAllUserTokens(userId);
    } catch (error) {
      throw new Error("Failed to revoke all user tokens");
    }
  }

  /**
   * Delete expired tokens (cleanup)
   * @returns Number of tokens deleted
   */
  async deleteExpiredTokens(): Promise<number> {
    try {
      return await this.tokenRepository.deleteExpiredTokens();
    } catch (error) {
      throw new Error("Failed to delete expired tokens");
    }
  }
}
