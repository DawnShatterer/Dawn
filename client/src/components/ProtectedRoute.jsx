import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');

    // If no token exists, redirect to login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // If token exists, render the dashboard/children
    return children;
};

export default ProtectedRoute;