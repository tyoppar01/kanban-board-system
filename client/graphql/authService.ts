import { LoginCredentials, RegisterData, AuthResponse, User } from '@/types/auth.types';
import apolloClient from '@/graphql/apolloClient';
import { gql } from '@apollo/client';

// GraphQL Mutations
const LOGIN = gql`
  mutation Login($userProfile: UserInput!) {
    login(userProfile: $userProfile)
  }
`;

const REGISTER = gql`
  mutation Register($userProfile: UserInput!) {
    register(userProfile: $userProfile) {
      id
      username
      createdAt
      updatedAt
    }
  }
`;

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: LOGIN,
        variables: {
          userProfile: {
            username: credentials.username,
            password: credentials.password
          }
        },
      });

      // Backend returns JWT token as a string
      const token = (data as any).login;

      if (token) {
        const mockUser: User = {
          id: credentials.username, // Use username as ID for now
          username: credentials.username,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };

        return {
          success: true,
          message: 'Login successful',
          token: token,
          user: mockUser,
        };
      }

      return {
        success: false,
        message: 'Invalid username or password',
      };
    } catch (error) {
      // Extract error message from GraphQL error
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      // Don't log expected errors like "username or password does not match" to console
      const expectedErrors = ['username or password does not match', 'Invalid credentials', 'does not match', 'Invalid username or password', 'Password is required'];
      const isExpectedError = expectedErrors.some(msg => errorMessage.toLowerCase().includes(msg.toLowerCase()));
      
      if (!isExpectedError) {
        console.error('Login error:', error);
      }
      
      return {
        success: false,
        message: 'Invalid username or password',
      };
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      if (data.password !== data.confirmPassword) {
        return {
          success: false,
          message: 'Passwords do not match',
        };
      }

      if (data.password.length < 6) {
        return {
          success: false,
          message: 'Password must be at least 6 characters',
        };
      }

      const { data: result } = await apolloClient.mutate({
        mutation: REGISTER,
        variables: {
          userProfile: {
            username: data.username,
            password: data.password,
          }
        },
      });

      // Backend returns User object
      const user = (result as any).register;

      if (user) {
        // After registration, login to get token
        const loginResponse = await this.login({
          username: data.username,
          password: data.password
        });

        return loginResponse;
      }

      return {
        success: false,
        message: 'Registration failed',
      };
    } catch (error) {
      // Extract error message from GraphQL error
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      
      // Don't log expected errors like "Username already taken" to console
      const expectedErrors = ['Username already taken', 'already exists', 'username or password does not match', ];
      const isExpectedError = expectedErrors.some(msg => errorMessage.includes(msg));
      
      if (!isExpectedError) {
        console.error('Registration error:', error);
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(token: string): Promise<User | null> {
    try {
      // For now, decode user info from token or use stored user
      // Backend doesn't have a 'me' query yet
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return null;
    }
  }

  /**
   * Logout user (clear local storage)
   */
  async logout(): Promise<void> {
    try {
      // Backend doesn't have a logout mutation yet
      // Just clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      // Decode JWT and check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
}

export const authService = new AuthService();
