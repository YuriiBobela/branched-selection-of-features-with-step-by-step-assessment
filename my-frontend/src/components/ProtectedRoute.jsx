import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

export const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
};
