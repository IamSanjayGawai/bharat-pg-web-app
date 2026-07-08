import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../store/store';

const ProtectedRoute: React.FC = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const token = localStorage.getItem('token');

  // If there's no auth state and no token, redirect to login
  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
