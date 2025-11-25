import { IUser } from "../models/user";
import { AuthRepo } from "../repos/authRepo";
import { TokenRepo } from "../repos/tokenRepo";
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

interface JWTPayload {
    userId: number;
    username: string;
}

export class AuthService {

    private static instance: AuthService;
    private readonly saltRounds: number = 10;
    private readonly jwtSecret: string;
    private readonly jwtExpiration: string;
    private authRepo: AuthRepo;
    private tokenRepo: TokenRepo;

    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
        this.jwtExpiration = process.env.JWT_EXPIRATION || '7d';
        this.authRepo = AuthRepo.getInstance();
        this.tokenRepo = TokenRepo.getInstance();
    }

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    /**
     * User Authentication Function
     * @param userProfile 
     * @returns 
     */
    async authenticateUser(userProfile: IUser): Promise<string> {

        // validate user credentials
        const user = await this.authRepo.findByUsername(userProfile.username);

        if (!user || !user.id) {
            throw new Error("User not found");
        }

        // hash and validate password
        if (!userProfile.password || !user.password) {
            throw new Error("Password is not valid");
        }

        const isPasswordValid = await bcrypt.compare(userProfile.password, user.password);
        
        if (!isPasswordValid) {
            throw new Error("username or password does not match");
        }

        // Generate JWT token
        const token = await this.generateToken(user.id!, user.username);
        
        return token;
    }

    /**
     * Register User Function
     * @param userProfile 
     * @returns 
     */
    async registerUser(userProfile: IUser): Promise<IUser> {

        // check if user already exists
        const existingUser = await this.authRepo.findByUsername(userProfile.username);
        if (existingUser.username === userProfile.username) {
            throw new Error("Username already taken");
        }

        // hash password before storing
        if (userProfile.password) {
            userProfile.password = await this.hashPassword(userProfile.password);
        } else {
            throw new Error("Password is not provided for registration");
        }

        // create new user
        const newUser = await this.authRepo.createUser(userProfile);

        if (!newUser) {
            throw new Error("User registration failed");
        }
        return newUser;
    }       

    /**
     * Hash Password Function
     * @param plainPassword 
     * @returns 
     */
    private async hashPassword(plainPassword: string): Promise<string> {
        try {
            const hashedPassword = await bcrypt.hash(plainPassword, this.saltRounds);
            return hashedPassword;
        } catch (error) {
            throw new Error('Error hashing password');
        }
    }

    /**
     * Generate JWT token and store in database
     * @param userId - User's ID
     * @param username - User's username
     * @returns JWT token string
     */
    private async generateToken(userId: number, username: string): Promise<string> {
        try {
            const payload: JWTPayload = { userId, username };
            // Generate JWT token
            const token = jwt.sign(payload, this.jwtSecret) as string;

            // Calculate expiration date
            const expiresAt = new Date();
            const expirationMs = this.parseExpirationToMs(this.jwtExpiration);
            expiresAt.setTime(expiresAt.getTime() + expirationMs);

            // Store token in database
            await this.tokenRepo.storeToken(token, userId, expiresAt);
            return token;

        } catch (error) {
            throw new Error('Error generating token');
        }
    }

    /**
     * Validate JWT token
     * @param token - JWT token string
     * @returns User payload if valid, null otherwise
     */
    async validateToken(token: string): Promise<JWTPayload | null> {
        try {
            // Check if token exists and is valid in database
            const isValid = await this.tokenRepo.isTokenValid(token);
            if (!isValid) {
                return null;
            }

            // Verify JWT signature and expiration
            const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
            return decoded;
        } catch (error) {
            return null;
        }
    }

    /**
     * Revoke token (logout)
     * @param token - JWT token string
     * @returns true if revoked successfully
     */
    async revokeToken(token: string): Promise<boolean> {
        try {
            return await this.tokenRepo.revokeToken(token);
        } catch (error) {
            throw new Error('Error revoking token');
        }
    }

    /**
     * Parse expiration string to milliseconds
     * @param expiration - Expiration string (e.g., '7d', '1h')
     * @returns Milliseconds
     */
    private parseExpirationToMs(expiration: string): number {
        const unit = expiration.slice(-1);
        const value = parseInt(expiration.slice(0, -1));

        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: return 7 * 24 * 60 * 60 * 1000; // Default 7 days
        }
    }

}   