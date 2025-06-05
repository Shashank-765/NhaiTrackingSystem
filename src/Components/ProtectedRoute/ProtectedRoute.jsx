import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CircularLoader from '../CircularLoader/CircularLoader';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return <CircularLoader />;
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
