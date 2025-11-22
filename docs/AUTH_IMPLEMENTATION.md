but # Authentication Implementation Guide

## Overview
This frontend implements JWT-based authentication with login and registration functionality using **GraphQL**. The backend mutations/queries are currently mocked and need to be connected to your actual GraphQL API.

## What's Implemented

### Frontend Components
- ✅ Login Form (`/components/auth/LoginForm.tsx`)
- ✅ Registration Form (`/components/auth/RegisterForm.tsx`)
- ✅ Auth Modal (`/components/auth/AuthModal.tsx`)
- ✅ User Profile Display (`/components/auth/UserProfile.tsx`)
- ✅ Auth Context (`/contexts/AuthContext.tsx`)
- ✅ Auth Service with GraphQL (`/services/authService.ts`)

### Features
- User registration with validation
- User login with JWT token storage
- Automatic token persistence in localStorage
- Token expiration checking (placeholder)
- User profile display
- Logout functionality
- Protected route support (/board requires authentication)
- GraphQL integration with Apollo Client

## GraphQL Schema

The backend should implement these GraphQL types, mutations, and queries:

### Type Definitions

```graphql
type User {
  id: ID!
  username: String!
  createdAt: String!
  updatedAt: String!
  lastLogin: String
}

type AuthResponse {
  success: Boolean!
  message: String!
  token: String
  user: User
}

type Query {
  me: User
}

type Mutation {
  login(username: String!, password: String!): AuthResponse!
  register(username: String!, password: String!): AuthResponse!
  logout: AuthResponse
}
```

### Mutations

#### 1. Register User
**Mutation:**
```graphql
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
```

**Variables:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (Success):**
```json
{
  "data": {
    "register": {
      "success": true,
      "message": "Registration successful",
      "token": "jwt-token-here",
      "user": {
        "id": "uuid",
        "username": "string",
        "createdAt": "2024-11-22T10:00:00Z",
        "updatedAt": "2024-11-22T10:00:00Z"
      }
    }
  }
}
```

**Response (Error):**
```json
{
  "data": {
    "register": {
      "success": false,
      "message": "Username already exists",
      "token": null,
      "user": null
    }
  }
}
```

**Backend Tasks:**
- Validate username (min 3 characters, unique)
- Validate password (min 6 characters)
- Hash password using bcrypt
- Create user in database
- Generate JWT token (include userId, username)
- Return token and user data

#### 2. Login User
**Mutation:**
```graphql
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
```

**Variables:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (Success):**
```json
{
  "data": {
    "login": {
      "success": true,
      "message": "Login successful",
      "token": "jwt-token-here",
      "user": {
        "id": "uuid",
        "username": "string",
        "createdAt": "2024-11-22T10:00:00Z",
        "updatedAt": "2024-11-22T10:00:00Z",
        "lastLogin": "2024-11-22T12:00:00Z"
      }
    }
  }
}
```

**Response (Error):**
```json
{
  "data": {
    "login": {
      "success": false,
      "message": "Invalid username or password",
      "token": null,
      "user": null
    }
  }
}
```

**Backend Tasks:**
- Find user by username
- Verify password hash using bcrypt
- Update last_login timestamp
- Generate JWT token
- Return token and user data

### Queries

#### 3. Get Current User
**Query:**
```graphql
query GetCurrentUser {
  me {
    id
    username
    createdAt
    updatedAt
    lastLogin
  }
}
```

**Context Headers:**
```javascript
{
  headers: {
    Authorization: "Bearer <jwt-token>"
  }
}
```

**Response:**
```json
{
  "data": {
    "me": {
      "id": "uuid",
      "username": "string",
      "createdAt": "2024-11-22T10:00:00Z",
      "updatedAt": "2024-11-22T10:00:00Z",
      "lastLogin": "2024-11-22T12:00:00Z"
    }
  }
}
```

**Backend Tasks:**
- Extract JWT token from context headers
- Verify JWT token
- Extract userId from token
- Fetch user from database
- Return user data

#### 4. Logout (Optional)
**Mutation:**
```graphql
mutation Logout {
  logout {
    success
    message
  }
}
```

**Context Headers:**
```javascript
{
  headers: {
    Authorization: "Bearer <jwt-token>"
  }
}
```

**Response:**
```json
{
  "data": {
    "logout": {
      "success": true,
      "message": "Logged out successfully"
    }
  }
}
```

**Backend Tasks:**
- Optionally invalidate token (add to blacklist)
- Frontend will clear localStorage

## Database Schema

The backend should implement this profile table:

```sql
CREATE TABLE profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX idx_profile_username ON profile(username);
```

## GraphQL Resolver Implementation Example

### File: `server/src/graphql/resolvers/authResolver.ts`

```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { profileRepository } from '@/repositories/profileRepository';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

export const authResolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      // Extract token from context
      const token = context.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        const user = await profileRepository.findById(decoded.userId);
        
        if (!user) {
          throw new Error('User not found');
        }

        return {
          id: user.id,
          username: user.username,
          createdAt: user.created_at.toISOString(),
          updatedAt: user.updated_at.toISOString(),
          lastLogin: user.last_login?.toISOString() || null,
        };
      } catch (error) {
        throw new Error('Invalid token');
      }
    },
  },

  Mutation: {
    register: async (_: any, { username, password }: { username: string; password: string }) => {
      try {
        // Validation
        if (username.length < 3) {
          return {
            success: false,
            message: 'Username must be at least 3 characters',
            token: null,
            user: null,
          };
        }

        if (password.length < 6) {
          return {
            success: false,
            message: 'Password must be at least 6 characters',
            token: null,
            user: null,
          };
        }

        // Check if username exists
        const existingUser = await profileRepository.findByUsername(username);
        if (existingUser) {
          return {
            success: false,
            message: 'Username already exists',
            token: null,
            user: null,
          };
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Create user
        const user = await profileRepository.create({
          username,
          password_hash,
        });

        // Generate JWT
        const token = jwt.sign(
          { userId: user.id, username: user.username },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );

        return {
          success: true,
          message: 'Registration successful',
          token,
          user: {
            id: user.id,
            username: user.username,
            createdAt: user.created_at.toISOString(),
            updatedAt: user.updated_at.toISOString(),
          },
        };
      } catch (error) {
        return {
          success: false,
          message: 'Registration failed',
          token: null,
          user: null,
        };
      }
    },

    login: async (_: any, { username, password }: { username: string; password: string }) => {
      try {
        // Find user
        const user = await profileRepository.findByUsername(username);
        if (!user) {
          return {
            success: false,
            message: 'Invalid username or password',
            token: null,
            user: null,
          };
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
          return {
            success: false,
            message: 'Invalid username or password',
            token: null,
            user: null,
          };
        }

        // Update last login
        await profileRepository.updateLastLogin(user.id);

        // Generate JWT
        const token = jwt.sign(
          { userId: user.id, username: user.username },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );

        return {
          success: true,
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            username: user.username,
            createdAt: user.created_at.toISOString(),
            updatedAt: user.updated_at.toISOString(),
            lastLogin: new Date().toISOString(),
          },
        };
      } catch (error) {
        return {
          success: false,
          message: 'Login failed',
          token: null,
          user: null,
        };
      }
    },

    logout: async () => {
      // Optional: Implement token blacklist here
      return {
        success: true,
        message: 'Logged out successfully',
      };
    },
  },
};
```

### Update GraphQL Schema

Add to `server/src/graphql/schema.graphql`:

```graphql
type User {
  id: ID!
  username: String!
  createdAt: String!
  updatedAt: String!
  lastLogin: String
}

type AuthResponse {
  success: Boolean!
  message: String!
  token: String
  user: User
}

extend type Query {
  me: User
}

extend type Mutation {
  login(username: String!, password: String!): AuthResponse!
  register(username: String!, password: String!): AuthResponse!
  logout: AuthResponse
}
```

### Update Resolver Index

In `server/src/graphql/resolvers/index.ts`:

```typescript
import { authResolvers } from './authResolver';
// ... other imports

export const resolvers = {
  Query: {
    ...boardResolvers.Query,
    ...taskResolvers.Query,
    ...columnResolvers.Query,
    ...authResolvers.Query,
  },
  Mutation: {
    ...boardResolvers.Mutation,
    ...taskResolvers.Mutation,
    ...columnResolvers.Mutation,
    ...authResolvers.Mutation,
  },
};
```

### JWT Payload Structure
```json
{
  "userId": "uuid",
  "username": "string",
  "iat": 1637654321,
  "exp": 1637740721
}
```

### Token Expiration
- Recommended: 7 days for access tokens
- Consider implementing refresh tokens for better security

### Security Best Practices
1. Use strong secret key for JWT signing
2. Hash passwords with bcrypt (min 10 rounds)
3. Implement rate limiting on auth endpoints
4. Use HTTPS in production
5. Validate input on both frontend and backend
6. Consider implementing CSRF protection
7. Add password strength requirements

## Frontend Integration Steps

### Step 1: Update authService.ts

The GraphQL implementation is already in place in `/client/services/authService.ts`. When backend is ready, simply **uncomment the Apollo Client calls** and **remove the mock responses**:

```typescript
// In login method:
async login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    // Uncomment this:
    const { data } = await apolloClient.mutate({
      mutation: LOGIN_MUTATION,
      variables: credentials,
    });
    return data.login;

    // Remove the mock response below
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Login failed',
    };
  }
}
```

### Step 2: Configure Apollo Client Context

Apollo Client needs to send JWT tokens in headers. Update `/client/graphql/apolloClient.ts`:

```typescript
import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { setContext } from '@apollo/client/link/context';

const httpLink = new HttpLink({ 
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8080/graphql' 
});

const authLink = setContext((_, { headers }) => {
  // Get token from localStorage
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('auth_token') 
    : null;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

const client = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
});

export default client;
```

### Step 2: Update Environment Variables

Ensure your `.env.production` has:
```
NEXT_PUBLIC_API_URL=https://api.mykanban.fun
```

### Step 3: Test with Backend

Once backend is ready:
1. Remove mock responses from `authService.ts`
2. Uncomment the Apollo Client GraphQL calls
3. Update `apolloClient.ts` to include auth headers
4. Test registration flow
5. Test login flow
6. Test `me` query (auto-login on page refresh)
7. Test token persistence
8. Test logout flow
9. Test protected routes with expired/invalid tokens

## Current Mock Behavior

For testing without backend:
- **Demo Login:** username: `demo`, password: `demo123`
- **Registration:** Any username/password (min 6 chars) will succeed
- **Token:** Mock tokens generated with timestamp
- **Persistence:** Uses localStorage

## Protected Routes (To Implement)

Create a middleware or HOC for protected routes:

```typescript
// Example: /middleware.ts or useProtectedRoute hook
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return { isAuthenticated, isLoading };
}
```

## Testing Checklist

- [ ] Backend implements GraphQL schema with auth types
- [ ] Backend implements login, register, me mutations/queries
- [ ] Password hashing with bcrypt works (10+ rounds)
- [ ] JWT tokens are generated correctly with userId and username
- [ ] Token expiration is set properly (7 days recommended)
- [ ] Registration validates unique username
- [ ] Login verifies password correctly
- [ ] `me` query extracts and validates JWT from headers
- [ ] Frontend apolloClient.ts includes auth headers
- [ ] Frontend authService.ts uses Apollo mutations (mocks removed)
- [ ] Frontend can register new users via GraphQL
- [ ] Frontend can login existing users via GraphQL
- [ ] Tokens are stored in localStorage
- [ ] Tokens are sent in Authorization header for `me` query
- [ ] User profile displays correctly
- [ ] Logout clears auth state
- [ ] Token expiration is handled (401 errors redirect to login)
- [ ] Protected route /board redirects if not authenticated

## Security Considerations

### CSRF Protection
Consider implementing CSRF tokens for state-changing operations:
```typescript
// Add CSRF token to requests
headers: {
  'X-CSRF-Token': getCsrfToken(),
  'Authorization': `Bearer ${token}`,
}
```

### Rate Limiting
Backend should implement rate limiting:
- Login attempts: 5 per 15 minutes per IP
- Registration: 3 per hour per IP

### Password Requirements
Current frontend validation:
- Minimum 6 characters
- Consider adding: uppercase, lowercase, number, special char

## Next Steps

1. **Backend Developer:**
   - Add GraphQL schema types to `server/src/graphql/schema.graphql`
   - Create `authResolver.ts` with login, register, me, logout resolvers
   - Update resolver index to include auth resolvers
   - Set up PostgreSQL profile table
   - Implement JWT generation/verification (use jsonwebtoken package)
   - Add password hashing with bcrypt (10+ rounds)
   - Install dependencies: `npm install bcrypt jsonwebtoken @types/bcrypt @types/jsonwebtoken`
   - Test mutations/queries with GraphQL Playground

2. **Frontend Developer:**
   - Update `apolloClient.ts` to include Authorization headers
   - Remove mock responses from `authService.ts`
   - Uncomment Apollo Client mutation/query calls
   - Test integration with backend
   - Handle GraphQL errors (401 → redirect to login)
   - Optional: Add token refresh logic

3. **Testing:**
   - Test registration mutation end-to-end
   - Test login mutation end-to-end
   - Test `me` query with valid token
   - Test `me` query with invalid/expired token
   - Test token expiration handling
   - Test error scenarios (wrong password, duplicate username)
   - Security testing

## Files Modified

- `/client/types/auth.types.ts` - Auth type definitions
- `/client/services/authService.ts` - Auth service with GraphQL (Apollo Client)
- `/client/contexts/AuthContext.tsx` - Auth state management
- `/client/components/auth/LoginForm.tsx` - Login component
- `/client/components/auth/RegisterForm.tsx` - Registration component
- `/client/components/auth/UserProfile.tsx` - User display with logout
- `/client/components/kanban/Header.tsx` - Added auth UI
- `/client/app/layout.tsx` - Added AuthProvider
- `/client/app/page.tsx` - Login/registration page
- `/client/app/board/page.tsx` - Protected kanban board route

## Backend Files to Create/Modify

- `/server/src/graphql/schema.graphql` - Add User, AuthResponse types and mutations
- `/server/src/graphql/resolvers/authResolver.ts` - NEW: Auth resolvers
- `/server/src/graphql/resolvers/index.ts` - Import and merge auth resolvers
- `/server/src/repositories/profileRepository.ts` - NEW: Database operations for profile table
- Database migration - CREATE TABLE profile

## Frontend File to Update (When Backend Ready)

- `/client/graphql/apolloClient.ts` - Add authentication headers with setContext
- `/client/graphql/authService.ts` - Replace with backend api calling


