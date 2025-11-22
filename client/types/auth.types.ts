// user profile
export interface User {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

// login credentials
export interface LoginCredentials {
  username: string;
  password: string;
}

// registration data
export interface RegisterData {
  username: string;
  password: string;
  confirmPassword: string;
}

// auth response from API
export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

// auth context state
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// JWT payload interface
export interface JWTPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}
