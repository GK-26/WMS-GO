import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User } from '../types';

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
  | { type: 'CLEAR_ERROR' };

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

  // Login function
  const login = async (username: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // TODO: Replace with actual API call
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data - replace with actual API response
      const mockUser: User = {
        id: '1',
        username: username,
        email: `${username}@wms.com`,
        firstName: 'John',
        lastName: 'Doe',
        roles: [
          {
            id: '1',
            name: 'Warehouse Manager',
            description: 'Full access to warehouse operations',
            permissions: [
              { id: '1', name: 'View Inventory', description: 'View inventory data', resource: 'inventory', action: 'read' },
              { id: '2', name: 'Edit Inventory', description: 'Edit inventory data', resource: 'inventory', action: 'update' },
              { id: '3', name: 'View Orders', description: 'View order data', resource: 'orders', action: 'read' },
              { id: '4', name: 'Manage Orders', description: 'Manage order operations', resource: 'orders', action: 'update' },
              { id: '5', name: 'View Receiving', description: 'View receiving data', resource: 'receiving', action: 'read' },
              { id: '6', name: 'Manage Receiving', description: 'Manage receiving operations', resource: 'receiving', action: 'update' },
              { id: '7', name: 'View Shipping', description: 'View shipping data', resource: 'shipping', action: 'read' },
              { id: '8', name: 'Manage Shipping', description: 'Manage shipping operations', resource: 'shipping', action: 'update' },
              { id: '9', name: 'View Labor', description: 'View labor data', resource: 'labor', action: 'read' },
              { id: '10', name: 'Manage Labor', description: 'Manage labor operations', resource: 'labor', action: 'update' },
              { id: '11', name: 'View Automation', description: 'View automation data', resource: 'automation', action: 'read' },
              { id: '12', name: 'Manage Automation', description: 'Manage automation operations', resource: 'automation', action: 'update' },
              { id: '13', name: 'View Reports', description: 'View reports and analytics', resource: 'reports', action: 'read' },
              { id: '14', name: 'Manage Reports', description: 'Manage reports and analytics', resource: 'reports', action: 'update' },
              { id: '15', name: 'View Configuration', description: 'View system configuration', resource: 'configuration', action: 'read' },
              { id: '16', name: 'Manage Configuration', description: 'Manage system configuration', resource: 'configuration', action: 'update' },
            ]
          }
        ],
        permissions: [
          { id: '1', name: 'View Inventory', description: 'View inventory data', resource: 'inventory', action: 'read' },
          { id: '2', name: 'Edit Inventory', description: 'Edit inventory data', resource: 'inventory', action: 'update' },
          { id: '3', name: 'View Orders', description: 'View order data', resource: 'orders', action: 'read' },
          { id: '4', name: 'Manage Orders', description: 'Manage order operations', resource: 'orders', action: 'update' },
          { id: '5', name: 'View Receiving', description: 'View receiving data', resource: 'receiving', action: 'read' },
          { id: '6', name: 'Manage Receiving', description: 'Manage receiving operations', resource: 'receiving', action: 'update' },
          { id: '7', name: 'View Shipping', description: 'View shipping data', resource: 'shipping', action: 'read' },
          { id: '8', name: 'Manage Shipping', description: 'Manage shipping operations', resource: 'shipping', action: 'update' },
          { id: '9', name: 'View Labor', description: 'View labor data', resource: 'labor', action: 'read' },
          { id: '10', name: 'Manage Labor', description: 'Manage labor operations', resource: 'labor', action: 'update' },
          { id: '11', name: 'View Automation', description: 'View automation data', resource: 'automation', action: 'read' },
          { id: '12', name: 'Manage Automation', description: 'Manage automation operations', resource: 'automation', action: 'update' },
          { id: '13', name: 'View Reports', description: 'View reports and analytics', resource: 'reports', action: 'read' },
          { id: '14', name: 'Manage Reports', description: 'Manage reports and analytics', resource: 'reports', action: 'update' },
          { id: '15', name: 'View Configuration', description: 'View system configuration', resource: 'configuration', action: 'read' },
          { id: '16', name: 'Manage Configuration', description: 'Manage system configuration', resource: 'configuration', action: 'update' },
        ],
        isActive: true,
        lastLogin: new Date(),
      };

      dispatch({ type: 'LOGIN_SUCCESS', payload: mockUser });
      
      // Store user in localStorage for persistence
      localStorage.setItem('wms_user', JSON.stringify(mockUser));
      
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
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Check if user has specific permission
  const hasPermission = (resource: string, action: string): boolean => {
    if (!state.user) return false;
    
    return state.user.permissions.some(
      permission => permission.resource === resource && permission.action === action
    );
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