import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Loading Insta CoServe session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to their role-appropriate home
    if (user.role === 'customer') return <Navigate to="/customer/dashboard" replace />;
    if (user.role === 'worker') return <Navigate to="/worker/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/overview" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
