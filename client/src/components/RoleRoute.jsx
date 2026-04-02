import React from 'react';
import { Navigate } from 'react-router-dom';
import { getUserInfo } from '../utils/authUtils';

const RoleRoute = ({ children, allowedRoles }) => {
    const user = getUserInfo();

    // 1. If no user is found, bounce them to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 2. Normalize the user's role to lowercase
    const userRole = user.role?.toLowerCase();

    // 3. Normalize the allowedRoles array to lowercase
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());

    // 4. Check if the user's role exists in the allowed list
    const hasPermission = userRole && normalizedAllowedRoles.includes(userRole);

    if (!hasPermission) {
        console.warn(`Access denied for role: ${user.role}. Required: ${allowedRoles}`);
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default RoleRoute;