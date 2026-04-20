import { jwtDecode } from 'jwt-decode';

export const getUserInfo = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const decoded = jwtDecode(token);
        // ASP.NET Core uses specific claim names
        return {
            id: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
            email: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"],
            role: decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
            name: decoded.FullName || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || decoded.email,
            nickName: decoded.NickName || '',
            phone: decoded.Phone || '',
            location: decoded.Location || '',
            grade: decoded.Grade || '',
            profilePictureUrl: decoded.ProfilePictureUrl || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))?.profilePictureUrl : '') || '',
            batchId: decoded.BatchId ? parseInt(decoded.BatchId) : null
        };
    } catch (error) {
        return null;
    }
};

/**
 * Checks if a JWT token is expired
 * @param {string} token - JWT token string
 * @returns {boolean} - true if expired or invalid, false if valid
 */
export const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
        const decoded = jwtDecode(token);
        const exp = decoded.exp;
        
        if (!exp) return true;
        
        // Add 10-second buffer for clock skew
        const currentTime = Math.floor(Date.now() / 1000);
        const bufferTime = 10;
        
        return currentTime >= (exp - bufferTime);
    } catch (error) {
        // Malformed token
        return true;
    }
};

/**
 * Clears authentication data and redirects to login with message
 * @param {string} message - Message to display to user
 */
export const handleSessionExpiration = (message = 'Your session has expired. Please log in again.') => {
    localStorage.clear();
    
    // Store message for login page to display
    sessionStorage.setItem('sessionExpiredMessage', message);
    
    // Store intended destination for post-login redirect
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
    }
    
    window.location.href = '/login';
};