import React from 'react';
import { Navigate } from 'react-router-dom';
import { getUserInfo } from '../utils/authUtils';

const RoleRoute = ({ children, allowedRoles }) => {
    const user = getUserInfo();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const userRole = user.role?.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
    const hasPermission = userRole && normalizedAllowedRoles.includes(userRole);

    if (!hasPermission) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default RoleRoute;