import { IUser } from "../models/user";
import { AuthRepo } from "../repos/authRepo";

export class AuthService {

    private static instance: AuthService;

    constructor(private authRepo: AuthRepo = AuthRepo.getInstance()) {}

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    async authenticateUser(userProfile: IUser): Promise<string> {

        // pending token-based authentication implementation
        // TODO: add here

        // validate user credentials (no token provided)
        const res = await this.authRepo.findByUsername(userProfile.username);

        if (!res) {
            throw new Error("User not found");
        }

        if (res.password !== userProfile.password) {
            throw new Error("username or password does not match");
        }

        // Generate JWT token (for now, return a dummy token)
        // TODO: Implement proper JWT token generation with secret key
        const token = `jwt-token-${res.id}-${Date.now()}`;
        
        return token;
    }

    async registerUser(userProfile: IUser): Promise<IUser> {
        // check if user already exists
        const existingUser = await this.authRepo.findByUsername(userProfile.username);
        
        if (existingUser.username === userProfile.username) {
            throw new Error("Username already taken");
        }

        // create new user
        const newUser = await this.authRepo.createUser(userProfile);

        if (!newUser) {
            throw new Error("User registration failed");
        }
        return newUser;
    }       

}   