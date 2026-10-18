import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute() {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.isAuthenticated) {
    auth.setIntendedPath(location.pathname);
    return <Navigate to="/signup" replace />;
  }

  return <Outlet />;
}
