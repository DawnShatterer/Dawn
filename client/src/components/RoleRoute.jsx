import { Navigate } from 'react-router-dom';
import { getUserInfo } from '../utils/authUtils';

const RoleRoute = ({ children, allowedRoles }) => {
    const user = getUserInfo();

    if (!user || !allowedRoles.includes(user.role)) {
        // If not a teacher, send them back to the dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default RoleRoute;