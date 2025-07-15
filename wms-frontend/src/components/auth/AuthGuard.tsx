import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermissions?: Array<{ resource: string; action: string }>;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requiredPermissions = [] 
}) => {
  const { state, hasPermission } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (state.isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!state.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required permissions
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission =>
      hasPermission(permission.resource, permission.action)
    );

    if (!hasAllPermissions) {
      // Redirect to access denied page or dashboard
      return <Navigate to="/access-denied" replace />;
    }
  }

  return <>{children}</>;
}; 