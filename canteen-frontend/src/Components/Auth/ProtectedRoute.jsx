import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import LoadingSpinner from '../Common/LoadingSpinner';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullPage />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const redirectMap = {
      admin: '/admin/dashboard',
      cashier: '/cashier/pos',
      customer: '/menu',
    };
    return <Navigate to={redirectMap[user.role] || '/login'} replace />;
  }

  return children;
}