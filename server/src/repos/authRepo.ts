import { IUser } from "../models/user";
import { AuthRepository } from "external-apis";

/**
 * AuthRepo - Authentication Repository
 * Handles user authentication data operations
 */
export class AuthRepo {

private static instance: AuthRepo;
private authRepository: AuthRepository;

constructor() {
this.authRepository = AuthRepository.getInstance();
}

static getInstance(): AuthRepo {
if (!AuthRepo.instance) {
    AuthRepo.instance = new AuthRepo();
}
return AuthRepo.instance;
}

    /**
     * Authenticate user with username and password
     * @param username - User's username
     * @param password - User's password (should be hashed in production)
     * @returns User object if authentication successful, null otherwise
     */
    async authenticateUser(username: string, password: string): Promise<IUser | null> {
        try {
            // Find user by username
            const user = await this.authRepository.findByUsername(username);
            if (!user) return null;
            
            const { password: _, ...userWithoutPassword } = user;
            return {
                ...userWithoutPassword,
                createdDate: user.createdAt.toISOString(),
                modifiedDate: user.updatedAt.toISOString(),
                lastLoginDate: user.lastLogin?.toISOString()
            } as IUser;

        } catch (error) {
            // User not found, return null instead of throwing
            return null;
        }
    }

    /**
     * Find user by username
     * @param username - User's username
     * @returns User object or throws error if not found
     */
    async findByUsername(username: string): Promise<IUser | null> {
        
        try {
            const user = await this.authRepository.findByUsername(username);

            // if user is empty, return empty IUser object
            if (!user) {
                return {
                    username: '',
                } as IUser;
            }

            const { password: _, ...userWithoutPassword } = user;
            return {
                ...userWithoutPassword,
                createdDate: user.createdAt.toISOString(),
                modifiedDate: user.updatedAt.toISOString(),
                lastLoginDate: user.lastLogin?.toISOString()
            } as IUser;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Find user by ID
     * @param id - User's ID
     * @returns User object or null
     */
    async findById(id: number): Promise<IUser | null> {
        try {
            const user = await this.authRepository.findById(id);
            if (!user) return null;

            const { password: _, ...userWithoutPassword } = user;
            return {
            ...userWithoutPassword,
            createdDate: user.createdAt.toISOString(),
            modifiedDate: user.updatedAt.toISOString(),
            lastLoginDate: user.lastLogin?.toISOString()
            } as IUser;
        } catch (error) {
            throw new Error("Failed to find user: " + error);
        }
    }

    /**
     * Create a new user
     * @param userProfile - User profile data
     * @returns Created user object without password
     */
    async createUser(userProfile: Omit<IUser, 'id'>): Promise<IUser> {
        try {
            const user = await this.authRepository.createUser(
                userProfile.username,
                userProfile.password || ''
            );

            const { password: _, ...userWithoutPassword } = user;
            return {
                ...userWithoutPassword,
                createdDate: user.createdAt.toISOString(),
                modifiedDate: user.updatedAt.toISOString(),
                lastLoginDate: user.lastLogin?.toISOString()
            } as IUser;

        } catch (error) {
            throw new Error("Create User Failed");
        }
    }

}
