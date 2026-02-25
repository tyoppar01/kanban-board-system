import { IUser } from "../../models/user";

export interface JWTPayload {
    userId: number;
    username: string;
}

/**
 * Authentication Service Interface
 * Defines the public contract for authentication operations
 */
export interface IAuthService {
    /**
     * Authenticate user with credentials
     * @param userProfile - User credentials (username and password)
     * @returns JWT token string
     */
    authenticateUser(userProfile: IUser): Promise<string>;

    /**
     * Register a new user
     * @param userProfile - User profile with credentials
     * @returns Created user object
     */
    registerUser(userProfile: IUser): Promise<IUser>;

    /**
     * Validate JWT token
     * @param token - JWT token string
     * @returns User payload if valid, null otherwise
     */
    validateToken(token: string): Promise<JWTPayload | null>;

    /**
     * Revoke token (logout)
     * @param token - JWT token string
     * @returns true if revoked successfully
     */
    revokeToken(token: string): Promise<boolean>;
}
