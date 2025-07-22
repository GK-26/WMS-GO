import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { apiClient, logout as apiLogout } from '../services/api';

// Backend User type (different from frontend User type)
interface BackendUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Array<{
    id: string;
    name: string;
    description: string;
    permissions: Array<{
      id: string;
      name: string;
      description: string;
      resource: string;
      action: string;
    }>;
  }>;
  permissions: any;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth State Interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth Action Types
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOAD_USER'; payload: User };

// Initial State
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
    case 'LOAD_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Auth Context Interface
interface AuthContextType {
  state: AuthState;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  hasPermission: (resource: string, action: string) => boolean;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('wms_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        dispatch({ type: 'LOAD_USER', payload: user });
      } catch (error) {
        localStorage.removeItem('wms_user');
      }
    }
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await apiClient.login({ username, password });
      
      if (response.success && response.data.user) {
        const backendUser = response.data.user as unknown as BackendUser;
        
        // Extract the primary role from the roles array
        const primaryRole = backendUser.roles && backendUser.roles.length > 0 
          ? backendUser.roles[0].name 
          : 'user';
          
        const user: User = {
          id: backendUser.id,
          username: backendUser.username,
          email: backendUser.email,
          firstName: backendUser.firstName,
          lastName: backendUser.lastName,
          role: primaryRole,
          isActive: backendUser.isActive,
          lastLogin: backendUser.lastLogin ? new Date(backendUser.lastLogin) : undefined,
          createdAt: backendUser.createdAt ? new Date(backendUser.createdAt) : new Date(),
          updatedAt: backendUser.updatedAt ? new Date(backendUser.updatedAt) : new Date(),
        };

        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        localStorage.setItem('wms_user', JSON.stringify(user));
      } else {
        dispatch({ 
          type: 'LOGIN_FAILURE', 
          payload: response.message || 'Login failed' 
        });
      }
    } catch (error) {
      dispatch({ 
        type: 'LOGIN_FAILURE', 
        payload: error instanceof Error ? error.message : 'Login failed' 
      });
    }
  };

  // Logout function
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    localStorage.removeItem('wms_user');
    apiLogout();
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Check if user has specific permission
  const hasPermission = (_resource: string, _action: string): boolean => {
    // With current User type, always return true (or implement RBAC if needed)
    return true;
  };

  const value: AuthContextType = {
    state,
    login,
    logout,
    clearError,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 