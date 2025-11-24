import { LoginCredentials, RegisterData, AuthResponse, User } from '@/types/auth.types';
import apolloClient from '@/graphql/apolloClient';
import { gql } from '@apollo/client';

// GraphQL Mutations
const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      success
      message
      token
      user {
        id
        username
        createdAt
        updatedAt
        lastLogin
      }
    }
  }
`;

const REGISTER = gql`
  mutation Register($username: String!, $password: String!) {
    register(username: $username, password: $password) {
      success
      message
      token
      user {
        id
        username
        createdAt
        updatedAt
      }
    }
  }
`;

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    me {
      id
      username
      createdAt
      updatedAt
      lastLogin
    }
  }
`;

class AuthService {
  /**
   * Login user
   * TODO: Connect to real backend GraphQL endpoint
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // TODO: Uncomment when backend is ready
      // const { data } = await apolloClient.mutate({
      //   mutation: LOGIN_MUTATION,
      //   variables: credentials,
      // });
      // return data.login;

      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      if (credentials.username === 'demo' && credentials.password === 'demo123') {
        const mockUser: User = {
          id: '1',
          username: credentials.username,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };

        const mockToken = 'mock-jwt-token-' + Date.now();

        return {
          success: true,
          message: 'Login successful',
          token: mockToken,
          user: mockUser,
        };
      }

      return {
        success: false,
        message: 'Invalid username or password',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Register new user
   * TODO: Connect to real backend GraphQL endpoint
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // TODO: Uncomment when backend is ready
      // const { data: result } = await apolloClient.mutate({
      //   mutation: REGISTER_MUTATION,
      //   variables: {
      //     username: data.username,
      //     password: data.password,
      //   },
      // });
      // return result.register;

      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 1000)); // simulate network delay

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

      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        username: data.username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockToken = 'mock-jwt-token-' + Date.now();

      return {
        success: true,
        message: 'Registration successful',
        token: mockToken,
        user: mockUser,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  /**
   * Get current user profile
   * TODO: Connect to real backend GraphQL endpoint
   */
  async getCurrentUser(token: string): Promise<User | null> {
    try {
      // TODO: Uncomment when backend is ready
      // const { data } = await apolloClient.query({
      //   query: GET_CURRENT_USER_QUERY,
      //   context: {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   },
      // });
      // return data.me;

      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 500));

      // Decode mock token to get user info
      const mockUser: User = {
        id: '1',
        username: 'demo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      return mockUser;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return null;
    }
  }

  /**
   * Logout user (clear local storage, optionally invalidate token on backend)
   * TODO: Add token invalidation mutation when backend is ready
   */
  async logout(): Promise<void> {
    try {
      // TODO: Optionally call backend to invalidate token
      // await apolloClient.mutate({
      //   mutation: gql`
      //     mutation Logout {
      //       logout {
      //         success
      //       }
      //     }
      //   `,
      // });

      // Clear local storage
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
   * TODO: Implement proper JWT validation when backend is ready
   */
  isTokenExpired(token: string): boolean {
    try {
      // TODO: Decode JWT and check expiration
      // const payload = JSON.parse(atob(token.split('.')[1]));
      // return Date.now() >= payload.exp * 1000;

      // Mock: tokens don't expire for now
      return false;
    } catch {
      return true;
    }
  }
}

export const authService = new AuthService();
